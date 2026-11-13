import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { QuestionTypeSchema, StyleProfile, StyleProfileSchema } from "@/lib/schemas";
import type { InputFile } from "@/lib/pipeline";

export const PackManifestSchema = z.object({
  id: z.string().min(1),
  split: z.enum(["dev", "holdout"]),
  description: z.string(),
  covers: z.array(QuestionTypeSchema).min(1),
  sample_subject: z.string(),
  samples: z
    .array(
      z.object({
        file: z.string(),
        held_back: z.boolean(),
        authoring_tool: z.string(),
        pages: z.number().int().positive(),
        words: z.number().int().positive(),
      }),
    )
    .min(2),
  materials: z.object({
    subject: z.string(),
    deck: z.string(),
    web: z.object({ live_url: z.url().nullable(), snapshot: z.string() }),
    topic_list: z.string(),
  }),
});

export const PlantedFactSchema = z.object({
  id: z.string().min(1),
  fact: z.string().min(1),
  /** Every group must appear near the others; a group matches if any one of its spellings does. */
  needles: z.array(z.array(z.string().min(1)).min(1)).min(1),
  deck_image_only: z.boolean(),
});

export const TopicSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });

export type PackManifest = z.infer<typeof PackManifestSchema>;
export type PlantedFact = z.infer<typeof PlantedFactSchema>;

export type Pack = {
  dir: string;
  manifest: PackManifest;
  style: StyleProfile;
  plantedFacts: PlantedFact[];
  topics: z.infer<typeof TopicSchema>[];
};

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".html": "text/html",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".heic": "image/heic",
};

export function mimeFor(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

export async function loadFile(file: string): Promise<InputFile> {
  return { name: path.basename(file), mime: mimeFor(file), bytes: new Uint8Array(await readFile(file)) };
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function loadPack(dir: string): Promise<Pack> {
  const manifest = PackManifestSchema.parse(await readJson(path.join(dir, "pack.json")));
  if (manifest.samples.filter((s) => s.held_back).length !== 1) {
    throw new Error(`${manifest.id}: exactly one sample must be held back as the real reference`);
  }
  const plantedFacts = z.array(PlantedFactSchema).parse(await readJson(path.join(dir, "planted_facts.json")));
  if (plantedFacts.length < 15) throw new Error(`${manifest.id}: needs 15 planted facts, has ${plantedFacts.length}`);
  return {
    dir,
    manifest,
    style: StyleProfileSchema.parse(await readJson(path.join(dir, "style.json"))),
    plantedFacts,
    topics: z.array(TopicSchema).min(1).parse(await readJson(path.join(dir, "topics.json"))),
  };
}

export async function loadPacks(root: string, includeHoldout: boolean): Promise<Pack[]> {
  const base = path.join(root, "fixtures", "packs");
  const entries = await readdir(base, { withFileTypes: true }).catch(() => []);
  const packs: Pack[] = [];
  for (const entry of entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const pack = await loadPack(path.join(base, entry.name));
    if (pack.manifest.split === "dev" || includeHoldout) packs.push(pack);
  }
  return packs;
}
