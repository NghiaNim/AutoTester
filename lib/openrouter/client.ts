import { z } from "zod";
import type { ModelRole } from "@/lib/config/models";
import { Result, err, ok } from "@/lib/utils/result";
import { LlmCache, hashRequest } from "./cache";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_ATTEMPTS = 3;

export type ChatPart = { type: "text"; text: string } | { type: "image"; data_url: string };

export type StructuredRequest<T> = {
  role: ModelRole;
  model: string;
  temperature: number;
  system: string;
  user: ChatPart[];
  schema: z.ZodType<T>;
  schema_name: string;
  prompt_version: string;
  max_tokens?: number;
};

export type CallMeta = { role: ModelRole; model: string; cost_usd: number; cached: boolean };

export type SpendSummary = {
  total_usd: number;
  calls: number;
  cached_calls: number;
  by_role: Partial<Record<ModelRole, number>>;
};

export interface LlmClient {
  structured<T>(request: StructuredRequest<T>): Promise<Result<{ value: T; meta: CallMeta }>>;
  spend(): SpendSummary;
}

export type OpenRouterOptions = {
  apiKey: string | undefined;
  cache?: LlmCache;
  /** Ignore cached answers and call the model again. Used for sign-off runs. */
  fresh?: boolean;
  /** Refuse further paid calls once this much has been spent through this client. */
  budgetUsd?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

type WireResponse = {
  choices?: { message?: { content?: string | null } }[];
  usage?: { cost?: number };
  error?: { message?: string };
};

function buildBody<T>(request: StructuredRequest<T>) {
  return {
    model: request.model,
    temperature: request.temperature,
    max_tokens: request.max_tokens ?? 8000,
    messages: [
      { role: "system", content: request.system },
      {
        role: "user",
        content: request.user.map((part) =>
          part.type === "text"
            ? { type: "text", text: part.text }
            : { type: "image_url", image_url: { url: part.data_url } },
        ),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: request.schema_name, strict: true, schema: z.toJSONSchema(request.schema) },
    },
    usage: { include: true },
  };
}

function parseStructured<T>(schema: z.ZodType<T>, content: string): Result<T> {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return err("The model did not return JSON", 502);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return err(`The model's output did not match the schema: ${z.prettifyError(parsed.error)}`, 502);
  return ok(parsed.data);
}

export function createOpenRouterClient(options: OpenRouterOptions): LlmClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const summary: SpendSummary = { total_usd: 0, calls: 0, cached_calls: 0, by_role: {} };

  function record(role: ModelRole, cost: number, cached: boolean) {
    summary.calls += 1;
    if (cached) summary.cached_calls += 1;
    summary.total_usd += cost;
    summary.by_role[role] = (summary.by_role[role] ?? 0) + cost;
  }

  async function callOnce(body: unknown): Promise<Result<{ content: string; cost_usd: number }>> {
    let response: Response;
    try {
      response = await fetchImpl(OPENROUTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.apiKey}` },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return err(`Could not reach the model service: ${e instanceof Error ? e.message : String(e)}`, 503);
    }
    const data = (await response.json().catch(() => ({}))) as WireResponse;
    if (!response.ok || data.error) {
      return err(`Model service error (${response.status}): ${data.error?.message ?? response.statusText}`, response.status || 502);
    }
    const content = data.choices?.[0]?.message?.content;
    if (!content) return err("The model returned an empty answer", 502);
    return ok({ content, cost_usd: data.usage?.cost ?? 0 });
  }

  return {
    spend: () => ({ ...summary, by_role: { ...summary.by_role } }),

    async structured<T>(request: StructuredRequest<T>) {
      const body = buildBody(request);
      const key = hashRequest({ body, prompt_version: request.prompt_version });

      if (options.cache && !options.fresh) {
        const hit = await options.cache.get(key);
        if (hit) {
          const parsed = parseStructured(request.schema, hit.content);
          if (parsed.error === null) {
            record(request.role, 0, true);
            return ok({ value: parsed.data, meta: { role: request.role, model: request.model, cost_usd: 0, cached: true } });
          }
        }
      }

      if (!options.apiKey) return err("OPENROUTER_KEY is not set", 500);

      let last: Result<never> = err("The model call was not attempted", 500);
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (options.budgetUsd !== undefined && summary.total_usd >= options.budgetUsd) {
          return err(`Spend cap reached: $${summary.total_usd.toFixed(2)} of $${options.budgetUsd.toFixed(2)}`, 402);
        }
        const call = await callOnce(body);
        if (call.error !== null) {
          last = err(call.error, call.status);
          const retryable = call.status === 429 || call.status >= 500;
          if (!retryable) return last;
          await sleep(500 * 2 ** (attempt - 1));
          continue;
        }
        record(request.role, call.data.cost_usd, false);
        const parsed = parseStructured(request.schema, call.data.content);
        if (parsed.error !== null) {
          last = err(parsed.error, parsed.status);
          continue;
        }
        await options.cache?.set(key, { content: call.data.content, cost_usd: call.data.cost_usd, model: request.model });
        return ok({ value: parsed.data, meta: { role: request.role, model: request.model, cost_usd: call.data.cost_usd, cached: false } });
      }
      return last;
    },
  };
}
