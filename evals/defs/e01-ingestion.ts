import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { MaterialInput, NOT_IMPLEMENTED_STATUS, ingestMaterials, planExam } from "@/lib/pipeline";
import type { MaterialSet } from "@/lib/schemas";
import { factSurvives } from "../lib/facts";
import { Route, startFixtureServer } from "../lib/fixture-server";
import { loadFile } from "../lib/packs";
import { Blocked, EvalDef, atLeast, every, need } from "../lib/types";

const BadSourceSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("file"), file: z.string(), why: z.string() }),
  z.object({ id: z.string(), kind: z.literal("topic_list"), text: z.string(), why: z.string() }),
  z.object({
    id: z.string(),
    kind: z.literal("url"),
    status: z.number().int(),
    body: z.string(),
    content_type: z.string(),
    why: z.string(),
  }),
]);

function textOf(set: MaterialSet): string {
  return set.chunks.map((c) => c.text).join("\n\n");
}

export const e01: EvalDef = {
  id: "E1",
  title: "Ingestion",
  kind: "gate",
  milestone: "M2",
  measure: "Share of planted facts found in the extracted text, per input type. Behavior on blocked or empty sources.",
  bar: "At least 95% per type. Every bad source raises a visible error and blocks generation.",

  async run(ctx) {
    const badDir = path.join(ctx.root, "fixtures", "bad-sources");
    const badSources = z.array(BadSourceSchema).min(1).parse(JSON.parse(await readFile(path.join(badDir, "manifest.json"), "utf8")));

    const routes = new Map<string, Route>();
    for (const pack of ctx.packs) {
      const body = await readFile(path.join(pack.dir, pack.manifest.materials.web.snapshot), "utf8");
      routes.set(`/${pack.manifest.id}/page.html`, { status: 200, body, contentType: "text/html; charset=utf-8" });
    }
    for (const source of badSources) {
      if (source.kind === "url") routes.set(`/bad/${source.id}`, { status: source.status, body: source.body, contentType: source.content_type });
    }
    const server = await startFixtureServer(routes);

    const failures: string[] = [];
    const found = { deck: 0, web: 0 };
    const total = { deck: 0, web: 0 };
    let topicListsFlagged = 0;

    try {
      for (const pack of ctx.packs) {
        const { id, materials } = pack.manifest;
        const inputs: Record<"deck" | "web", MaterialInput> = {
          deck: { kind: "file", file: await loadFile(path.join(pack.dir, materials.deck)) },
          web: { kind: "url", url: server.url(`/${id}/page.html`) },
        };
        for (const form of ["deck", "web"] as const) {
          const text = textOf(need(await ingestMaterials([inputs[form]], ctx.deps), "ingestMaterials"));
          for (const fact of pack.plantedFacts) {
            total[form] += 1;
            if (factSurvives(fact, text)) found[form] += 1;
            else failures.push(`${id}/${form}: lost fact ${fact.id} — ${fact.fact}`);
          }
        }
        const listText = await readFile(path.join(pack.dir, materials.topic_list), "utf8");
        const listSet = need(await ingestMaterials([{ kind: "topic_list", text: listText }], ctx.deps), "ingestMaterials");
        if (listSet.topic_list_only && listSet.chunks.length === 0) topicListsFlagged += 1;
        else failures.push(`${id}/topic_list: not flagged as topic-list-only`);
      }

      let refused = 0;
      for (const source of badSources) {
        const input: MaterialInput =
          source.kind === "file"
            ? { kind: "file", file: await loadFile(path.join(badDir, source.file)) }
            : source.kind === "url"
              ? { kind: "url", url: server.url(`/bad/${source.id}`) }
              : { kind: "topic_list", text: source.text };
        const result = await ingestMaterials([input], ctx.deps);
        if (result.error !== null && result.status === NOT_IMPLEMENTED_STATUS) {
          throw new Blocked("stage_not_implemented", result.error);
        }
        if (result.error !== null && result.error.trim().length > 0) refused += 1;
        else failures.push(`bad source ${source.id} was accepted (${source.why})`);
      }

      const empty = { schema_version: 1, id: "empty", chunks: [], topics: [{ id: "t1", name: "Anything", weight: 1, chunk_ids: [], excluded: false }], topic_list_only: false } as MaterialSet;
      const style = ctx.packs[0]?.style;
      if (!style) throw new Blocked("fixtures_missing", "no style packs found under fixtures/packs");
      const plan = planExam(style, empty, { version: 1, seed: "empty" });
      if (plan.error !== null && plan.status === NOT_IMPLEMENTED_STATUS) throw new Blocked("stage_not_implemented", plan.error);
      const blocksGeneration = plan.error !== null;
      if (!blocksGeneration) failures.push("planExam produced a blueprint from empty materials");

      return {
        measures: [
          atLeast("planted facts found, slide deck", found.deck, total.deck, 95),
          atLeast("planted facts found, web page", found.web, total.web, 95),
          every("topic lists flagged as general knowledge", topicListsFlagged, ctx.packs.length),
          every("bad sources refused with an error", refused, badSources.length),
          every("empty materials block generation", blocksGeneration ? 1 : 0, 1),
        ],
        failures,
      };
    } finally {
      await server.close();
    }
  },
};
