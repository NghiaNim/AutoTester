import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadModelConfig } from "@/lib/config/models";
import { createFileCache } from "@/lib/openrouter/cache";
import { createOpenRouterClient } from "@/lib/openrouter/client";
import { EVALS } from "./defs";
import { ExamSetEntry, buildExamSet } from "./lib/exam-set";
import { loadPacks } from "./lib/packs";
import { RunSummary, renderScoreboard } from "./lib/scoreboard";
import { Blocked, EvalContext, EvalDef, EvalRecord } from "./lib/types";

const DEFAULT_SPEND_CAP_USD = 30;

async function runOne(def: EvalDef, ctx: EvalContext): Promise<EvalRecord> {
  const started = Date.now();
  const base = { id: def.id, title: def.title, kind: def.kind };
  try {
    const outcome = await def.run(ctx);
    const pass = outcome.measures.length > 0 && outcome.measures.every((m) => m.pass);
    return { ...base, status: pass ? "pass" : "fail", reason: pass ? null : "below the pass bar", ...outcome, duration_ms: Date.now() - started };
  } catch (e) {
    const blocked = e instanceof Blocked;
    const message = e instanceof Error ? e.message : String(e);
    return {
      ...base,
      status: blocked ? "fail" : "crash",
      reason: blocked ? `${e.kind.replace(/_/g, " ")}: ${message}` : `crashed: ${message}`,
      measures: [],
      failures: [],
      duration_ms: Date.now() - started,
    };
  }
}

async function main(): Promise<number> {
  const root = process.cwd();
  if (existsSync(path.join(root, ".env.local"))) process.loadEnvFile(path.join(root, ".env.local"));

  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const ids = args.filter((a) => !a.startsWith("--")).map((a) => a.toUpperCase());
  const all = flags.has("--all");
  const fresh = flags.has("--fresh");
  const includeHoldout = flags.has("--holdout");

  if (!all && ids.length === 0) {
    console.error("Usage: npm run eval -- <E1..E13|R1..R5>... [--fresh] [--holdout]\n       npm run eval:all [-- --fresh --holdout]");
    return 2;
  }
  const unknown = ids.filter((id) => !EVALS.some((e) => e.id === id));
  if (unknown.length > 0) {
    console.error(`Unknown eval: ${unknown.join(", ")}. Known: ${EVALS.map((e) => e.id).join(", ")}`);
    return 2;
  }

  const models = loadModelConfig();
  if (models.error !== null) {
    console.error(models.error);
    return 2;
  }
  const cap = Number(process.env.EVAL_SPEND_CAP_USD ?? DEFAULT_SPEND_CAP_USD);
  const llm = createOpenRouterClient({
    apiKey: process.env.OPENROUTER_KEY,
    cache: createFileCache(path.join(root, ".cache", "llm")),
    fresh,
    budgetUsd: cap,
  });
  if (!process.env.OPENROUTER_KEY) console.warn("OPENROUTER_KEY is not set: any eval that reaches a model call will fail.\n");

  const packs = await loadPacks(root, includeHoldout);
  let examSet: Promise<ExamSetEntry[]> | null = null;
  const deps = { llm, models: models.data, allowPrivateHosts: true };
  const ctx: EvalContext = {
    root,
    fresh,
    includeHoldout,
    deps,
    packs,
    examSet: () => (examSet ??= buildExamSet(packs, deps)),
  };

  const selected = all ? EVALS : EVALS.filter((e) => ids.includes(e.id));
  const records: EvalRecord[] = [];
  for (const def of selected) {
    const record = await runOne(def, ctx);
    records.push(record);
    console.log(`${record.status.toUpperCase().padEnd(5)} ${def.id.padEnd(4)} ${def.title}${record.reason ? ` — ${record.reason}` : ""}`);
    for (const m of record.measures) console.log(`        ${m.pass ? "ok  " : "MISS"} ${m.name}: ${m.value} (bar: ${m.bar})`);
    for (const failure of record.failures.slice(0, 10)) console.log(`        - ${failure}`);
    if (record.failures.length > 10) console.log(`        - ... and ${record.failures.length - 10} more`);
  }

  const spend = llm.spend();
  console.log(`\nSpend: $${spend.total_usd.toFixed(2)} of a $${cap.toFixed(2)} cap, ${spend.calls} model calls, ${spend.cached_calls} from cache.`);

  if (all) {
    const historyFile = path.join(root, "evals", "history.json");
    const history: RunSummary[] = existsSync(historyFile) ? JSON.parse(await readFile(historyFile, "utf8")) : [];
    history.push({
      at: new Date().toISOString(),
      fixtures: includeHoldout ? "dev+holdout" : "dev",
      fresh,
      spend_usd: spend.total_usd,
      model_calls: spend.calls,
      cached_calls: spend.cached_calls,
      results: Object.fromEntries(records.map((r) => [r.id, r.status])),
    });
    await writeFile(historyFile, JSON.stringify(history, null, 2) + "\n");
    await writeFile(path.join(root, "evals", "SCOREBOARD.md"), renderScoreboard(records, history));
    console.log("Wrote evals/SCOREBOARD.md");
  }

  const gates = records.filter((r) => r.kind === "gate");
  const failing = gates.filter((r) => r.status !== "pass");
  console.log(`Gates passing: ${gates.length - failing.length}/${gates.length}`);
  return failing.length === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e);
    process.exit(3);
  },
);
