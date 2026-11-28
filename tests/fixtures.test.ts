import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { styleQuestionCount, styleSectionPointsSum } from "@/lib/schemas";
import { EVALS } from "../evals/defs";
import { factSurvives } from "../evals/lib/facts";
import { loadPacks } from "../evals/lib/packs";

const root = path.resolve(import.meta.dirname, "..");
const packs = await loadPacks(root, true);

async function deckText(file: string): Promise<string> {
  const zip = await JSZip.loadAsync(await readFile(file));
  const slides = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  const texts = await Promise.all(slides.map((name) => zip.file(name)!.async("string")));
  return texts
    .flatMap((xml) => [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]!))
    .join("\n")
    .replace(/&amp;/g, "&");
}

function htmlText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
}

describe("style packs", () => {
  it("has at least two dev packs", () => {
    expect(packs.filter((p) => p.manifest.split === "dev").length).toBeGreaterThanOrEqual(2);
  });

  for (const pack of packs) {
    describe(pack.manifest.id, () => {
      it("has a gold profile whose stated total matches its sections", () => {
        expect(styleSectionPointsSum(pack.style)).toBe(pack.style.total_points.value);
        expect(styleQuestionCount(pack.style)).toBeGreaterThan(0);
        expect(pack.style.sections.map((s) => s.question_type)).toEqual(expect.arrayContaining(pack.manifest.covers));
      });

      it("has every listed file", async () => {
        const files = [...pack.manifest.samples.map((s) => s.file), pack.manifest.materials.deck, pack.manifest.materials.web.snapshot, pack.manifest.materials.topic_list];
        for (const file of files) expect((await readFile(path.join(pack.dir, file))).length).toBeGreaterThan(0);
      });

      it("plants every fact in the web snapshot", async () => {
        const text = htmlText(await readFile(path.join(pack.dir, pack.manifest.materials.web.snapshot), "utf8"));
        const lost = pack.plantedFacts.filter((f) => !factSurvives(f, text)).map((f) => f.id);
        expect(lost).toEqual([]);
      });

      it("plants every text fact in the deck, and keeps image-only facts out of its text", async () => {
        const text = await deckText(path.join(pack.dir, pack.manifest.materials.deck));
        const textFacts = pack.plantedFacts.filter((f) => !f.deck_image_only);
        const imageFacts = pack.plantedFacts.filter((f) => f.deck_image_only);
        expect(textFacts.filter((f) => !factSurvives(f, text)).map((f) => f.id)).toEqual([]);
        expect(imageFacts.length).toBeGreaterThan(0);
        expect(imageFacts.filter((f) => factSurvives(f, text)).map((f) => f.id)).toEqual([]);
      });

      it("lists one topic per line of the topic list", async () => {
        const lines = (await readFile(path.join(pack.dir, pack.manifest.materials.topic_list), "utf8")).split("\n").filter((l) => l.trim());
        expect(lines).toEqual(pack.topics.map((t) => t.name));
      });
    });
  }
});

describe("eval registry", () => {
  it("defines every gate E1 to E13 once, plus the reported numbers", () => {
    const gates = EVALS.filter((e) => e.kind === "gate").map((e) => e.id);
    expect(gates).toEqual(Array.from({ length: 13 }, (_, i) => `E${i + 1}`));
    expect(EVALS.filter((e) => e.kind === "reported")).toHaveLength(5);
    expect(new Set(EVALS.map((e) => e.id)).size).toBe(EVALS.length);
  });
});
