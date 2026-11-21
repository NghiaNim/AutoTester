import { access } from "node:fs/promises";
import path from "node:path";
import { Blocked, EvalContext, EvalDef } from "../lib/types";

/**
 * Evals whose scoring is written at the start of their milestone, before the code they test.
 * Each one still runs its real prerequisites, so it fails at the first thing that is truly missing.
 */

async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  );
}

async function needExamSet(ctx: EvalContext): Promise<void> {
  await ctx.examSet();
}

async function needSubmissions(ctx: EvalContext): Promise<void> {
  if (!(await exists(path.join(ctx.root, "fixtures", "submissions", "manifest.json")))) {
    throw new Blocked("fixtures_missing", "filled-in submission fixtures are not built yet (M4)");
  }
}

function pending(def: Omit<EvalDef, "run">, prerequisite: (ctx: EvalContext) => Promise<void>): EvalDef {
  return {
    ...def,
    async run(ctx) {
      await prerequisite(ctx);
      throw new Blocked("eval_not_built", `${def.id} scoring is not written yet; it is written at the start of ${def.milestone}`);
    },
  };
}

export const pendingGates: EvalDef[] = [
  pending(
    {
      id: "E4",
      title: "Style match",
      kind: "gate",
      milestone: "M3",
      measure: "A blind judge compares a generated test with real samples on six dimensions, 1 to 5, against a same-style ceiling and a cross-style floor.",
      bar: "Judge check first: ceiling minus floor at least 1.5. Then generated mean within 0.5 of the ceiling and no dimension more than 1.0 below it, over at least 40 comparisons.",
    },
    needExamSet,
  ),
  pending(
    {
      id: "E5",
      title: "Grounding and coverage",
      kind: "gate",
      milestone: "M3",
      measure: "(a) cited chunks support the keyed answer; (b) share of topics.json topics covered; (c) sample-only subjects or near-duplicates of sample questions; (d) near-duplicate share between two versions.",
      bar: "(a) at least 95%. (b) at least 90% when the test has as many questions as topics. (c) zero. (d) at most 15%.",
    },
    needExamSet,
  ),
  pending(
    {
      id: "E6",
      title: "Answer-key correctness",
      kind: "gate",
      milestone: "M3",
      measure: "Independent solver against the key on objective questions; judge flags for more than one, or no, defensible option; key position and longest-option shares.",
      bar: "Agreement at least 98%. Flags at most 2%. With 20 or more four-option questions, no position holds over 40% of keys and the longest option is correct under 40% of the time.",
    },
    needExamSet,
  ),
  pending(
    {
      id: "E7",
      title: "Print-ready PDF",
      kind: "gate",
      milestone: "M4",
      measure: "Page size; QR decodes from a 150 dpi image of every page; leftover markup; clipped, overlapping or split content; AnswerKey content in the student PDF or any API response before submission.",
      bar: "Every exam passes every check. Zero leaks.",
    },
    needExamSet,
  ),
  pending(
    {
      id: "E8",
      title: "Reading",
      kind: "gate",
      milestone: "M4",
      measure: "Page identification; missing, duplicate and foreign page detection; selected-option accuracy; changed answers; blank handling; short-answer transcription meaning.",
      bar: "Page ID 100% on scans and at least 98% on photos. Detection 100%. Options at least 99% on scans and 97% on photos. Changed answers at least 90%. No blank earns points; at most 1% of real answers read as blank. Transcription at least 95%.",
    },
    needSubmissions,
  ),
  pending(
    {
      id: "E9",
      title: "Grading accuracy",
      kind: "gate",
      milestone: "M5",
      measure: "Objective score given the reading; open-ended distance from gold and mean signed error; exam total against gold; the owner's real handwriting set.",
      bar: "Objective 100%. Open-ended within 25% of the question's points on at least 90%, exact on at least 65%, mean signed error within 5%. Total within 5 points on at least 90% of papers and never beyond 10. Real handwriting: total within 7 points on every paper.",
    },
    needSubmissions,
  ),
  pending(
    {
      id: "E10",
      title: "Trust",
      kind: "gate",
      milestone: "M5",
      measure: "(a) same paper graded three times; (b) answers with instructions to the grader against the same answers without, 20 pairs or more; (c) invariants; (d) wrong readings flagged and right readings flagged; (e) feedback agrees with score and rubric.",
      bar: "(a) total spread at most 2 points, at least 95% of questions identical. (b) identical scores on every pair. (c) always. (d) at least 80% caught, at most 15% false flags. (e) at least 95%.",
    },
    needSubmissions,
  ),
  pending(
    {
      id: "E11",
      title: "Timer",
      kind: "gate",
      milestone: "M6",
      measure: "Fake-clock tests: reload, close and reopen, second device, background tab across three hours, two tabs at zero, device clock changed, 1.5x extra time, upload after time.",
      bar: "Remaining time correct within one second in every case. Exactly one time-up transition. Late uploads stamped.",
    },
    async () => {},
  ),
  pending(
    {
      id: "E12",
      title: "End to end",
      kind: "gate",
      milestone: "M6",
      measure: "A headless browser runs the whole journey for every pack and all three material forms, cuts the model API mid-job, and checks cross-user reads.",
      bar: "Every run completes. Report total within the E9 tolerance. Failures show a readable error and resume. Cross-user reads are refused.",
    },
    async () => {},
  ),
  {
    id: "E13",
    title: "Owner acceptance",
    kind: "gate",
    milestone: "M7",
    measure: "The owner reviews three tests generated from their own samples and materials, then sits one on paper with a phone.",
    bar: "\"Would pass as one of my tests\" on all three. At most one key error per 40 questions. AI total within 7 points of the owner's own marking.",
    async run(ctx) {
      if (!(await exists(path.join(ctx.root, "owner_inputs", "signoff", "E13.json")))) {
        throw new Blocked("awaiting_owner", "no owner sign-off recorded at owner_inputs/signoff/E13.json");
      }
      throw new Blocked("eval_not_built", "E13 sign-off checking is written in M7");
    },
  },
];

const reportedNames: [string, string, string][] = [
  ["R1", "Time to generate and grade", "Time to generate and time to grade a 40-question test. Flag anything over five minutes."],
  ["R2", "Spend per cycle", "Spend per generate-and-grade cycle."],
  ["R3", "Regeneration share", "Share of questions regenerated during verification."],
  ["R4", "Review-flag rate", "Share of readings sent to review."],
  ["R5", "Exemplar ablation", "How often a judge prefers the full pipeline over the same blueprint written without style exemplars."],
];

export const reported: EvalDef[] = reportedNames.map(([id, title, measure]) =>
  pending({ id, title, kind: "reported", milestone: "M3-M5", measure, bar: "reported, not gating" }, needExamSet),
);
