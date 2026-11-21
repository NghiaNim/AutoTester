import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createMemoryCache } from "@/lib/openrouter/cache";
import { StructuredRequest, createOpenRouterClient } from "@/lib/openrouter/client";

const Schema = z.object({ answer: z.string() });

const request: StructuredRequest<z.infer<typeof Schema>> = {
  role: "solve",
  model: "openai/test",
  temperature: 0,
  system: "Answer.",
  user: [{ type: "text", text: "What is 2 + 2?" }],
  schema: Schema,
  schema_name: "answer",
  prompt_version: "v1",
};

type Reply = { status?: number; content?: string; cost?: number; error?: string };

function fakeFetch(replies: Reply[]) {
  const calls: { body: Record<string, unknown>; auth: string }[] = [];
  const impl = (async (_url: unknown, init?: RequestInit) => {
    calls.push({ body: JSON.parse(String(init?.body)), auth: String((init?.headers as Record<string, string>).Authorization) });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)]!;
    const payload = reply.error
      ? { error: { message: reply.error } }
      : { choices: [{ message: { content: reply.content } }], usage: { cost: reply.cost ?? 0 } };
    return new Response(JSON.stringify(payload), { status: reply.status ?? 200 });
  }) as typeof fetch;
  return { impl, calls };
}

const noSleep = async () => {};
const good: Reply = { content: '{"answer":"4"}', cost: 0.01 };

describe("OpenRouter client", () => {
  it("returns validated structured output and records spend", async () => {
    const { impl, calls } = fakeFetch([good]);
    const client = createOpenRouterClient({ apiKey: "k", fetchImpl: impl });
    const result = await client.structured(request);
    expect(result.data?.value).toEqual({ answer: "4" });
    expect(calls[0]!.auth).toBe("Bearer k");
    expect(calls[0]!.body.model).toBe("openai/test");
    expect((calls[0]!.body.response_format as { type: string }).type).toBe("json_schema");
    expect(client.spend()).toMatchObject({ total_usd: 0.01, calls: 1, cached_calls: 0 });
  });

  it("answers an unchanged request from the cache at no cost", async () => {
    const { impl, calls } = fakeFetch([good]);
    const cache = createMemoryCache();
    const first = createOpenRouterClient({ apiKey: "k", fetchImpl: impl, cache });
    await first.structured(request);
    const second = createOpenRouterClient({ apiKey: undefined, fetchImpl: impl, cache });
    const result = await second.structured(request);
    expect(result.data?.meta).toMatchObject({ cached: true, cost_usd: 0 });
    expect(calls).toHaveLength(1);
    expect(second.spend()).toMatchObject({ total_usd: 0, cached_calls: 1 });
  });

  it("misses the cache when the prompt, model or prompt version changes", async () => {
    const { impl, calls } = fakeFetch([good]);
    const client = createOpenRouterClient({ apiKey: "k", fetchImpl: impl, cache: createMemoryCache() });
    await client.structured(request);
    await client.structured({ ...request, user: [{ type: "text", text: "What is 3 + 3?" }] });
    await client.structured({ ...request, model: "google/test" });
    await client.structured({ ...request, prompt_version: "v2" });
    expect(calls).toHaveLength(4);
  });

  it("calls the model again on a fresh run even when cached", async () => {
    const { impl, calls } = fakeFetch([good]);
    const cache = createMemoryCache();
    await createOpenRouterClient({ apiKey: "k", fetchImpl: impl, cache }).structured(request);
    await createOpenRouterClient({ apiKey: "k", fetchImpl: impl, cache, fresh: true }).structured(request);
    expect(calls).toHaveLength(2);
  });

  it("fails clearly when the key is missing", async () => {
    const { impl, calls } = fakeFetch([good]);
    const result = await createOpenRouterClient({ apiKey: undefined, fetchImpl: impl }).structured(request);
    expect(result.error).toBe("OPENROUTER_KEY is not set");
    expect(calls).toHaveLength(0);
  });

  it("stops paying once the spend cap is reached", async () => {
    const { impl, calls } = fakeFetch([{ content: '{"answer":"4"}', cost: 20 }]);
    const client = createOpenRouterClient({ apiKey: "k", fetchImpl: impl, budgetUsd: 30 });
    expect((await client.structured(request)).error).toBeNull();
    expect((await client.structured({ ...request, prompt_version: "v2" })).error).toBeNull();
    const third = await client.structured({ ...request, prompt_version: "v3" });
    expect(third.error).toMatch(/Spend cap reached/);
    expect(calls).toHaveLength(2);
  });

  it("retries rate limits and server errors, but not client errors", async () => {
    const flaky = fakeFetch([{ status: 429, error: "slow down" }, { status: 503, error: "busy" }, good]);
    const ok = await createOpenRouterClient({ apiKey: "k", fetchImpl: flaky.impl, sleep: noSleep }).structured(request);
    expect(ok.error).toBeNull();
    expect(flaky.calls).toHaveLength(3);

    const denied = fakeFetch([{ status: 401, error: "bad key" }]);
    const result = await createOpenRouterClient({ apiKey: "k", fetchImpl: denied.impl, sleep: noSleep }).structured(request);
    expect(result.error).toMatch(/bad key/);
    expect(denied.calls).toHaveLength(1);
  });

  it("retries output that does not match the schema and never caches it", async () => {
    const { impl, calls } = fakeFetch([{ content: '{"wrong":1}', cost: 0.01 }, { content: "not json", cost: 0.01 }, good]);
    const cache = createMemoryCache();
    const client = createOpenRouterClient({ apiKey: "k", fetchImpl: impl, cache, sleep: noSleep });
    const result = await client.structured(request);
    expect(result.data?.value).toEqual({ answer: "4" });
    expect(calls).toHaveLength(3);
    expect(client.spend().total_usd).toBeCloseTo(0.03);

    const bad = fakeFetch([{ content: '{"wrong":1}' }]);
    const failing = createOpenRouterClient({ apiKey: "k", fetchImpl: bad.impl, cache: createMemoryCache(), sleep: noSleep });
    expect((await failing.structured(request)).error).toMatch(/did not match the schema/);
  });

  it("sends images as image_url parts", async () => {
    const { impl, calls } = fakeFetch([good]);
    await createOpenRouterClient({ apiKey: "k", fetchImpl: impl }).structured({
      ...request,
      user: [{ type: "text", text: "Read this." }, { type: "image", data_url: "data:image/png;base64,AAAA" }],
    });
    const content = (calls[0]!.body.messages as { content: unknown }[])[1]!.content as { type: string }[];
    expect(content.map((p) => p.type)).toEqual(["text", "image_url"]);
  });
});
