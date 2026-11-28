import path from "node:path";
import { extractStyle } from "@/lib/pipeline";
import { loadFile } from "../lib/packs";
import { compareStyle } from "../lib/style-compare";
import { EvalDef, atLeast, every, need } from "../lib/types";

const MAX_OFF_BY = 0.1;

export const e02: EvalDef = {
  id: "E2",
  title: "Style extraction",
  kind: "gate",
  milestone: "M2",
  measure:
    "Extracted profile against style.json on six fields: question count, section order, question types, total points, time limit, option count.",
  bar: "All six exact on at least 90% of samples. No field off by more than 10% on the rest.",

  async run(ctx) {
    const failures: string[] = [];
    let samples = 0;
    let allExact = 0;
    let withinTolerance = 0;

    for (const pack of ctx.packs) {
      for (const sample of pack.manifest.samples) {
        samples += 1;
        const file = await loadFile(path.join(pack.dir, sample.file));
        const profile = need(await extractStyle([file], ctx.deps), "extractStyle");
        const fields = compareStyle(pack.style, profile);
        const wrong = fields.filter((f) => !f.exact);
        if (wrong.length === 0) allExact += 1;
        if (wrong.every((f) => f.off_by <= MAX_OFF_BY)) withinTolerance += 1;
        for (const f of wrong) {
          failures.push(`${pack.manifest.id}/${sample.file}: ${f.field} expected ${f.expected}, got ${f.actual}`);
        }
      }
    }

    return {
      measures: [
        atLeast("samples with all six fields exact", allExact, samples, 90),
        every("samples with no field off by more than 10%", withinTolerance, samples),
      ],
      failures,
    };
  },
};
