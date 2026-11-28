import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AnswerKey, Blueprint, MaterialSet, RenderedExam, StyleProfile } from "@/lib/schemas";
import {
  MaterialInput,
  PipelineDeps,
  extractStyle,
  ingestMaterials,
  planExam,
  renderExam,
  writeExam,
} from "@/lib/pipeline";
import { startFixtureServer } from "./fixture-server";
import { Pack, loadFile } from "./packs";
import { need } from "./types";

export const MATERIAL_FORMS = ["deck", "web", "topic_list"] as const;
export type MaterialForm = (typeof MATERIAL_FORMS)[number];

export const GENERATIONS_PER_FORM = 2;

export type ExamSetEntry = {
  pack: Pack;
  form: MaterialForm;
  generation: number;
  style: StyleProfile;
  materials: MaterialSet;
  blueprint: Blueprint;
  exam: RenderedExam;
  key: AnswerKey;
  pdf: Uint8Array;
  regenerated_questions: number;
};

async function materialInput(pack: Pack, form: MaterialForm, snapshotUrl: string): Promise<MaterialInput> {
  const materials = pack.manifest.materials;
  if (form === "deck") return { kind: "file", file: await loadFile(path.join(pack.dir, materials.deck)) };
  if (form === "web") return { kind: "url", url: snapshotUrl };
  return { kind: "topic_list", text: await readFile(path.join(pack.dir, materials.topic_list), "utf8") };
}

/**
 * Two generations per pack per material form, from the profile the pipeline itself extracts
 * from the samples that are not held back. Shared by E3 to E7.
 */
export async function buildExamSet(packs: Pack[], deps: PipelineDeps): Promise<ExamSetEntry[]> {
  const routes = new Map(
    await Promise.all(
      packs.map(async (pack) => {
        const body = await readFile(path.join(pack.dir, pack.manifest.materials.web.snapshot), "utf8");
        return [`/${pack.manifest.id}/page.html`, { status: 200, body, contentType: "text/html; charset=utf-8" }] as const;
      }),
    ),
  );
  const server = await startFixtureServer(routes);
  try {
    const entries: ExamSetEntry[] = [];
    for (const pack of packs) {
      const samples = await Promise.all(
        pack.manifest.samples.filter((s) => !s.held_back).map((s) => loadFile(path.join(pack.dir, s.file))),
      );
      const style = need(await extractStyle(samples, deps), "extractStyle");
      for (const form of MATERIAL_FORMS) {
        const input = await materialInput(pack, form, server.url(`/${pack.manifest.id}/page.html`));
        const materials = need(await ingestMaterials([input], deps), "ingestMaterials");
        const earlier: string[] = [];
        for (let generation = 1; generation <= GENERATIONS_PER_FORM; generation++) {
          const seed = `${pack.manifest.id}/${form}/${generation}`;
          const blueprint = need(planExam(style, materials, { version: generation, seed }), "planExam");
          const written = need(await writeExam(blueprint, { style, materials, avoid: [...earlier] }, deps), "writeExam");
          const rendered = need(await renderExam(written.exam, style.layout), "renderExam");
          earlier.push(...written.exam.questions.map((q) => q.prompt_md));
          entries.push({
            pack,
            form,
            generation,
            style,
            materials,
            blueprint,
            exam: rendered.exam,
            key: written.key,
            pdf: rendered.pdf,
            regenerated_questions: written.regenerated_questions,
          });
        }
      }
    }
    return entries;
  } finally {
    await server.close();
  }
}
