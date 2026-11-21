/**
 * Command-line entry for each pipeline stage. No browser, no database.
 *   npm run stage -- extractStyle sample1.pdf sample2.docx --out style.json
 *   npm run stage -- ingestMaterials deck.pptx https://example.org/page topics.txt --out materials.json
 *   npm run stage -- planExam --style style.json --materials materials.json --out blueprint.json
 * Stages that take several JSON inputs read them from named flags, as shown by `npm run stage`.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadModelConfig } from "@/lib/config/models";
import { createFileCache } from "@/lib/openrouter/cache";
import { createOpenRouterClient } from "@/lib/openrouter/client";
import {
  InputFile,
  MaterialInput,
  PipelineDeps,
  extractStyle,
  gradeAttempt,
  ingestMaterials,
  planExam,
  readSubmission,
  renderExam,
  writeExam,
} from "@/lib/pipeline";
import { AnswerKeySchema, BlueprintSchema, ExamSchema, MaterialSetSchema, ReadingSetSchema, RenderedExamSchema, StyleProfileSchema } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { loadFile } from "../evals/lib/packs";

type Args = { positional: string[]; flags: Record<string, string> };

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) flags[arg.slice(2)] = argv[++i] ?? "";
    else positional.push(arg);
  }
  return { positional, flags };
}

async function json(file: string | undefined, flag: string): Promise<unknown> {
  if (!file) throw new Error(`missing --${flag} <file.json>`);
  return JSON.parse(await readFile(file, "utf8"));
}

const files = (paths: string[]): Promise<InputFile[]> => Promise.all(paths.map(loadFile));

async function materialInputs(items: string[]): Promise<MaterialInput[]> {
  return Promise.all(
    items.map(async (item): Promise<MaterialInput> => {
      if (/^https?:\/\//i.test(item)) return { kind: "url", url: item };
      if (item.toLowerCase().endsWith(".txt")) return { kind: "topic_list", text: await readFile(item, "utf8") };
      return { kind: "file", file: await loadFile(item) };
    }),
  );
}

type Stage = { usage: string; run(args: Args, deps: PipelineDeps): Promise<Result<unknown>> };

const STAGES: Record<string, Stage> = {
  extractStyle: {
    usage: "<sample files...>",
    run: async (a, deps) => extractStyle(await files(a.positional), deps),
  },
  ingestMaterials: {
    usage: "<files, URLs or topic-list .txt...>",
    run: async (a, deps) => ingestMaterials(await materialInputs(a.positional), deps),
  },
  planExam: {
    usage: "--style s.json --materials m.json [--version 1] [--seed x] [--questions n] [--minutes n]",
    run: async (a) =>
      planExam(StyleProfileSchema.parse(await json(a.flags.style, "style")), MaterialSetSchema.parse(await json(a.flags.materials, "materials")), {
        version: Number(a.flags.version ?? 1),
        seed: a.flags.seed ?? "cli",
        question_count: a.flags.questions ? Number(a.flags.questions) : undefined,
        time_limit_minutes: a.flags.minutes ? Number(a.flags.minutes) : undefined,
      }),
  },
  writeExam: {
    usage: "--blueprint b.json --style s.json --materials m.json",
    run: async (a, deps) =>
      writeExam(
        BlueprintSchema.parse(await json(a.flags.blueprint, "blueprint")),
        {
          style: StyleProfileSchema.parse(await json(a.flags.style, "style")),
          materials: MaterialSetSchema.parse(await json(a.flags.materials, "materials")),
          avoid: [],
        },
        deps,
      ),
  },
  renderExam: {
    usage: "--exam e.json --style s.json --pdf out.pdf",
    run: async (a) => {
      const style = StyleProfileSchema.parse(await json(a.flags.style, "style"));
      const result = await renderExam(ExamSchema.parse(await json(a.flags.exam, "exam")), style.layout);
      if (result.error !== null) return result;
      if (a.flags.pdf) await writeFile(a.flags.pdf, result.data.pdf);
      return { data: result.data.exam, error: null };
    },
  },
  readSubmission: {
    usage: "--exam rendered.json <page images or a scanned PDF...>",
    run: async (a, deps) => readSubmission(RenderedExamSchema.parse(await json(a.flags.exam, "exam")), await files(a.positional), deps),
  },
  gradeAttempt: {
    usage: "--exam rendered.json --key key.json --readings r.json [page images...]",
    run: async (a, deps) =>
      gradeAttempt(
        {
          attempt_id: a.flags.attempt ?? "cli",
          exam: RenderedExamSchema.parse(await json(a.flags.exam, "exam")),
          key: AnswerKeySchema.parse(await json(a.flags.key, "key")),
          readings: ReadingSetSchema.parse(await json(a.flags.readings, "readings")),
          pages: await files(a.positional),
          time_used_minutes: null,
          minutes_late: 0,
        },
        deps,
      ),
  },
};

async function main(): Promise<number> {
  const root = process.cwd();
  if (existsSync(path.join(root, ".env.local"))) process.loadEnvFile(path.join(root, ".env.local"));
  const [name, ...rest] = process.argv.slice(2);
  const stage = name ? STAGES[name] : undefined;
  if (!stage) {
    console.error("Usage: npm run stage -- <stage> [args] [--out file.json]\n");
    for (const [key, value] of Object.entries(STAGES)) console.error(`  ${key} ${value.usage}`);
    return 2;
  }
  const models = loadModelConfig();
  if (models.error !== null) {
    console.error(models.error);
    return 2;
  }
  const llm = createOpenRouterClient({ apiKey: process.env.OPENROUTER_KEY, cache: createFileCache(path.join(root, ".cache", "llm")) });
  const args = parseArgs(rest);
  const result = await stage.run(args, { llm, models: models.data });
  if (result.error !== null) {
    console.error(`${name} failed: ${result.error}`);
    return 1;
  }
  const output = JSON.stringify(result.data, null, 2);
  if (args.flags.out) await writeFile(args.flags.out, output + "\n");
  else console.log(output);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
