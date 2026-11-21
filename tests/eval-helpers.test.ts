import { describe, expect, it } from "vitest";
import { StyleProfile, StyleProfileSchema } from "@/lib/schemas";
import { err, ok } from "@/lib/utils/result";
import { pagesWithinBar, structureProblems, wordsWithinBar } from "../evals/defs/e03-structure";
import { countWords, examWordCount } from "../evals/lib/exam-text";
import { factSurvives, squash } from "../evals/lib/facts";
import { RunSummary, passStreak, renderScoreboard } from "../evals/lib/scoreboard";
import { compareStyle } from "../evals/lib/style-compare";
import { Blocked, atLeast, atMost, every, need } from "../evals/lib/types";

describe("planted-fact matching", () => {
  it("ignores case, spacing and dash style", () => {
    expect(squash("N − 1")).toBe("n-1");
    expect(factSurvives({ needles: [["sample variance"], ["n - 1"]] }, "The Sample  Variance divides by n−1.")).toBe(true);
  });
  it("accepts any spelling within a group but needs every group", () => {
    const fact = { needles: [["ring of fire"], ["75%", "75 percent"]] };
    expect(factSurvives(fact, "The Ring of Fire has 75 percent of active volcanoes.")).toBe(true);
    expect(factSurvives(fact, "The Ring of Fire has many volcanoes.")).toBe(false);
  });
  it("needs the parts of a fact to be near each other", () => {
    const fact = { needles: [["hess"], ["1962"]] };
    expect(factSurvives(fact, `Hess studied the seafloor. ${"filler words ".repeat(200)} In 1962 something else happened.`)).toBe(false);
    expect(factSurvives(fact, `${"filler words ".repeat(200)} Hess proposed it in 1962.`)).toBe(true);
  });
  it("finds nothing in empty text", () => {
    expect(factSurvives({ needles: [["anything"]] }, "")).toBe(false);
  });
});

const base: StyleProfile = StyleProfileSchema.parse({
  schema_version: 1,
  name: "Quiz",
  time_limit: { minutes: 25, provenance: "stated" },
  total_points: { value: 30, provenance: "stated" },
  sections: [
    { id: "s1", title: "A", instructions: "", question_type: "multiple_choice", count: 20, points_per_question: Array(20).fill(1) },
    { id: "s2", title: "B", instructions: "", question_type: "short_answer", count: 2, points_per_question: [5, 5] },
  ],
  question_types: [
    { question_type: "multiple_choice", stem_words: { min: 5, max: 20 }, options: { count: 4, labels: ["A", "B", "C", "D"] }, sub_parts: null, answer_space: { kind: "mark_option", lines: 0 }, show_work: false },
    { question_type: "short_answer", stem_words: { min: 5, max: 20 }, options: null, sub_parts: null, answer_space: { kind: "lines", lines: 4 }, show_work: false },
  ],
  difficulty_mix: { recall: 1, apply: 0, analyze: 0 },
  voice_notes: [],
  exemplars: [],
  layout: { paper_size: "letter", columns: 1, numbering: "continuous", number_format: "1.", points_placement: "none" },
  not_reproduced: [],
  disagreements: [],
  source_samples: [],
});

describe("style comparison", () => {
  it("finds all six fields exact for an identical profile", () => {
    const fields = compareStyle(base, structuredClone(base));
    expect(fields).toHaveLength(6);
    expect(fields.every((f) => f.exact && f.off_by === 0)).toBe(true);
  });
  it("ignores wording differences that are not among the six fields", () => {
    const other = structuredClone(base);
    other.sections[0]!.title = "Part One";
    other.voice_notes = ["different"];
    expect(compareStyle(base, other).every((f) => f.exact)).toBe(true);
  });
  it("measures numeric fields by relative error", () => {
    const other = structuredClone(base);
    other.time_limit.minutes = 27;
    other.total_points.value = 40;
    const byField = Object.fromEntries(compareStyle(base, other).map((f) => [f.field, f]));
    expect(byField.time_limit!.off_by).toBeCloseTo(0.08);
    expect(byField.total_points!.off_by).toBeCloseTo(1 / 3);
    expect(byField.question_count!.exact).toBe(true);
  });
  it("treats a wrong section order or type set as fully off", () => {
    const other = structuredClone(base);
    other.sections.reverse();
    const byField = Object.fromEntries(compareStyle(base, other).map((f) => [f.field, f]));
    expect(byField.section_order!.off_by).toBe(1);
    expect(byField.question_types!.exact).toBe(true);
  });
  it("compares option counts per choice type", () => {
    const other = structuredClone(base);
    other.question_types[0]!.options = { count: 5, labels: ["A", "B", "C", "D", "E"] };
    const field = compareStyle(base, other).find((f) => f.field === "option_count")!;
    expect(field.exact).toBe(false);
    expect(field.off_by).toBeCloseTo(0.25);
  });
});

describe("structure checks", () => {
  const question = (number: number, section_id: string, type: string, points: number) => ({
    number, section_id, type, points, prompt_md: "Q", options: null, matching: null,
    answer_space: { kind: "blank", lines: 1 }, topic_id: "t", source_chunk_ids: [],
  });
  const matching = {
    sections: base.sections.map((s) => ({ id: s.id, title: s.title, instructions: s.instructions })),
    questions: [
      ...Array.from({ length: 20 }, (_, i) => question(i + 1, "s1", "multiple_choice", 1)),
      question(21, "s2", "short_answer", 5),
      question(22, "s2", "short_answer", 5),
    ],
    total_points: 30,
  } as unknown as Parameters<typeof structureProblems>[1];

  it("passes an exam that mirrors the profile", () => {
    expect(structureProblems(base, matching)).toEqual([]);
  });
  it("reports a missing question, a wrong type and wrong points", () => {
    const short = { ...matching, questions: matching.questions.slice(1), total_points: 29 };
    expect(structureProblems(base, short).join(" ")).toMatch(/expected 20 questions, got 19/);
    const wrong = structuredClone(matching);
    wrong.questions[21]!.type = "essay";
    wrong.questions[20]!.points = 4;
    wrong.questions[21]!.points = 6;
    const problems = structureProblems(base, wrong).join(" ");
    expect(problems).toMatch(/not short_answer/);
    expect(problems).toMatch(/points expected \[5,5\], got \[4,6\]/);
  });
  it("reports sections out of order", () => {
    const swapped = { ...matching, sections: [...matching.sections].reverse() };
    expect(structureProblems(base, swapped).join(" ")).toMatch(/section order/);
  });
  it("applies the page bar as one page or 15%, whichever is larger", () => {
    expect(pagesWithinBar(3, 4)).toBe(true);
    expect(pagesWithinBar(3, 5)).toBe(false);
    expect(pagesWithinBar(20, 23)).toBe(true);
    expect(pagesWithinBar(20, 24)).toBe(false);
  });
  it("applies the 20% word bar", () => {
    expect(wordsWithinBar(400, 480)).toBe(true);
    expect(wordsWithinBar(400, 319)).toBe(false);
  });
  it("counts the words a student reads", () => {
    expect(countWords("Find $x^2$ — now.")).toBe(3);
    expect(examWordCount({
      sections: [{ id: "s", title: "Part A", instructions: "Circle one." }],
      questions: [{ ...question(1, "s", "multiple_choice", 1), prompt_md: "Which is best?", options: [{ label: "A", text_md: "This one" }, { label: "B", text_md: "That" }] }],
    } as never)).toBe(10);
  });
});

describe("measures", () => {
  it("prints a count beside every percentage", () => {
    expect(atLeast("x", 37, 40, 90).value).toBe("92.5% (37/40)");
  });
  it("applies bars in the right direction", () => {
    expect(atLeast("x", 19, 20, 95).pass).toBe(true);
    expect(atLeast("x", 18, 20, 95).pass).toBe(false);
    expect(atMost("x", 3, 20, 15).pass).toBe(true);
    expect(atMost("x", 4, 20, 15).pass).toBe(false);
    expect(every("x", 20, 20).pass).toBe(true);
    expect(every("x", 19, 20).pass).toBe(false);
  });
  it("never passes on an empty set", () => {
    expect(atLeast("x", 0, 0, 0).pass).toBe(false);
    expect(atMost("x", 0, 0, 100).pass).toBe(false);
    expect(every("x", 0, 0).pass).toBe(false);
  });
  it("turns an unbuilt stage into a blocked eval, not a crash", () => {
    expect(need(ok(5), "stage")).toBe(5);
    expect(() => need(err("planExam is not implemented yet (M1)", 501), "planExam")).toThrow(Blocked);
    try {
      need(err("boom", 500), "planExam");
    } catch (e) {
      expect((e as Blocked).kind).toBe("stage_failed");
    }
  });
});

describe("scoreboard", () => {
  const run = (status: "pass" | "fail"): RunSummary => ({
    at: "2026-11-12T00:00:00.000Z", fixtures: "dev", fresh: false, spend_usd: 1.5, model_calls: 10, cached_calls: 4, results: { E1: status },
  });
  it("counts consecutive passes from the newest run back", () => {
    expect(passStreak([run("pass"), run("fail"), run("pass"), run("pass")], "E1")).toBe(2);
    expect(passStreak([run("pass"), run("fail")], "E1")).toBe(0);
    expect(passStreak([run("pass")], "E9")).toBe(0);
  });
  it("renders one row per eval with its measures and reason", () => {
    const text = renderScoreboard(
      [
        { id: "E1", title: "Ingestion", kind: "gate", status: "fail", reason: "below the pass bar", measures: [atLeast("facts | deck", 28, 30, 95)], failures: ["lost f03"], duration_ms: 5 },
      ],
      [run("fail")],
    );
    expect(text).toContain("| **E1** Ingestion | gate | FAIL | 0 |");
    expect(text).toContain("93.3% (28/30)");
    expect(text).toContain("facts \\| deck");
    expect(text).toContain("- lost f03");
    expect(text).toContain("Gates passing: 0/1");
  });
});
