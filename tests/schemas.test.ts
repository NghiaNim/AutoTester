import { describe, expect, it } from "vitest";
import {
  AnswerKeySchema,
  AttemptSchema,
  BlueprintSchema,
  ExamSchema,
  GradeReportSchema,
  MaterialSetSchema,
  ReadingSetSchema,
  RenderedExamSchema,
  StyleProfileSchema,
  isObjectiveType,
  rubricMaxPoints,
} from "@/lib/schemas";

const clone = <T>(value: T): T => structuredClone(value);

const style = {
  schema_version: 1,
  name: "Quiz",
  time_limit: { minutes: 20, provenance: "stated" },
  total_points: { value: 7, provenance: "estimated" },
  sections: [
    { id: "s1", title: "Part A", instructions: "Circle one.", question_type: "multiple_choice", count: 2, points_per_question: [1, 1] },
    { id: "s2", title: "Part B", instructions: "Answer briefly.", question_type: "short_answer", count: 1, points_per_question: [5] },
  ],
  question_types: [
    { question_type: "multiple_choice", stem_words: { min: 5, max: 20 }, options: { count: 4, labels: ["A", "B", "C", "D"] }, sub_parts: null, answer_space: { kind: "mark_option", lines: 0 }, show_work: false },
    { question_type: "short_answer", stem_words: { min: 8, max: 30 }, options: null, sub_parts: null, answer_space: { kind: "lines", lines: 4 }, show_work: false },
  ],
  difficulty_mix: { recall: 0.5, apply: 0.3, analyze: 0.2 },
  voice_notes: [],
  exemplars: [{ question_type: "multiple_choice", text: "Which ...?", never_copy: true }],
  layout: { paper_size: "letter", columns: 1, numbering: "continuous", number_format: "1.", points_placement: "after_stem" },
  not_reproduced: ["diagrams"],
  disagreements: [],
  source_samples: ["a.pdf"],
};

const exam = {
  schema_version: 1,
  id: "exam-1",
  title: "Quiz",
  version: 1,
  general_knowledge: false,
  time_limit_minutes: 20,
  total_points: 6,
  sections: [{ id: "s1", title: "Part A", instructions: "" }],
  questions: [
    {
      number: 1, section_id: "s1", type: "multiple_choice", prompt_md: "Pick one.",
      options: [{ label: "A", text_md: "x" }, { label: "B", text_md: "y" }], matching: null,
      points: 1, answer_space: { kind: "mark_option", lines: 0 }, topic_id: "t1", source_chunk_ids: ["c1"],
    },
    {
      number: 2, section_id: "s1", type: "short_answer", prompt_md: "Explain $x^2$.",
      options: null, matching: null,
      points: 5, answer_space: { kind: "lines", lines: 4 }, topic_id: "t2", source_chunk_ids: ["c1"],
    },
  ],
};

const levels = [
  { name: "Excellent", description: "", percentage: 100 },
  { name: "Good", description: "", percentage: 75 },
  { name: "Developing", description: "", percentage: 50 },
  { name: "Beginning", description: "", percentage: 25 },
];

const key = {
  schema_version: 1,
  exam_id: "exam-1",
  entries: [
    { number: 1, answer: { kind: "option", label: "B" }, reference_solution_md: "B, because.", rubric: null, common_mistakes: [] },
    {
      number: 2, answer: { kind: "open" }, reference_solution_md: "It is a square.",
      rubric: { kind: "criteria", criteria: [{ name: "Accuracy", description: "", points: 5, levels }] }, common_mistakes: ["confuses with 2x"],
    },
  ],
};

const report = {
  schema_version: 1,
  exam_id: "exam-1",
  attempt_id: "a1",
  questions: [
    { number: 1, type: "multiple_choice", topic_id: "t1", points: 1, max_points: 1, graded_by: "code", criteria: [], feedback: "Correct.", correct_solution_md: "B", confidence: 1 },
    {
      number: 2, type: "short_answer", topic_id: "t2", points: 2.5, max_points: 5, graded_by: "model",
      criteria: [{ criterion_name: "Accuracy", level: "Developing", points_earned: 2.5, points_possible: 5, reasoning: "Half right." }],
      feedback: "Partly.", correct_solution_md: "It is a square.", confidence: 0.8,
    },
  ],
  total_points: 3.5,
  max_points: 6,
  by_topic: [{ key: "t1", points: 1, max_points: 1 }, { key: "t2", points: 2.5, max_points: 5 }],
  by_type: [{ key: "multiple_choice", points: 1, max_points: 1 }, { key: "short_answer", points: 2.5, max_points: 5 }],
  time_used_minutes: 18,
  minutes_late: 0,
};

describe("StyleProfile", () => {
  it("accepts a consistent profile", () => {
    expect(StyleProfileSchema.safeParse(style).success).toBe(true);
  });
  it("rejects a section whose points do not match its count", () => {
    const bad = clone(style);
    bad.sections[0]!.points_per_question = [1];
    expect(StyleProfileSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects a section type that question_types does not describe", () => {
    const bad = clone(style);
    bad.sections[1]!.question_type = "essay";
    expect(StyleProfileSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects an estimated total that differs from the section sum", () => {
    const bad = clone(style);
    bad.total_points.value = 10;
    expect(StyleProfileSchema.safeParse(bad).success).toBe(false);
  });
  it("keeps a stated total even when the sections disagree, so the mismatch can be shown", () => {
    const stated = clone(style);
    stated.total_points = { value: 10, provenance: "stated" };
    expect(StyleProfileSchema.safeParse(stated).success).toBe(true);
  });
  it("rejects a difficulty mix that does not sum to 1", () => {
    const bad = clone(style);
    bad.difficulty_mix.recall = 0.9;
    expect(StyleProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("MaterialSet", () => {
  const set = {
    schema_version: 1, id: "m1",
    chunks: [{ id: "c1", text: "Fact.", source: { kind: "file", file: "deck.pptx", page: null, slide: 2 } }],
    topics: [{ id: "t1", name: "Topic", weight: 1, chunk_ids: ["c1"], excluded: false }],
    topic_list_only: false,
  };
  it("accepts grounded material", () => {
    expect(MaterialSetSchema.safeParse(set).success).toBe(true);
  });
  it("never accepts empty content unless it is a topic list", () => {
    expect(MaterialSetSchema.safeParse({ ...set, chunks: [], topics: [{ ...set.topics[0], chunk_ids: [] }] }).success).toBe(false);
    expect(MaterialSetSchema.safeParse({ ...set, chunks: [], topics: [{ ...set.topics[0], chunk_ids: [] }], topic_list_only: true }).success).toBe(true);
  });
  it("rejects a topic that cites an unknown chunk", () => {
    expect(MaterialSetSchema.safeParse({ ...set, topics: [{ ...set.topics[0], chunk_ids: ["nope"] }] }).success).toBe(false);
  });
});

describe("Blueprint", () => {
  const slot = { number: 1, section_id: "s1", type: "multiple_choice", points: 1, difficulty: "recall", topic_id: "t1", chunk_ids: ["c1"] };
  const bp = { schema_version: 1, id: "b1", style_name: "Quiz", material_set_id: "m1", version: 1, general_knowledge: false, time_limit_minutes: 20, slots: [slot] };
  it("accepts numbered, grounded slots", () => {
    expect(BlueprintSchema.safeParse(bp).success).toBe(true);
  });
  it("rejects misnumbered slots and ungrounded slots", () => {
    expect(BlueprintSchema.safeParse({ ...bp, slots: [{ ...slot, number: 2 }] }).success).toBe(false);
    expect(BlueprintSchema.safeParse({ ...bp, slots: [{ ...slot, chunk_ids: [] }] }).success).toBe(false);
    expect(BlueprintSchema.safeParse({ ...bp, general_knowledge: true, slots: [{ ...slot, chunk_ids: [] }] }).success).toBe(true);
  });
});

describe("Exam", () => {
  it("accepts a consistent exam", () => {
    expect(ExamSchema.safeParse(exam).success).toBe(true);
  });
  it("rejects any extra field, so answer-key data cannot ride along", () => {
    expect(ExamSchema.safeParse({ ...exam, answer_key: key }).success).toBe(false);
  });
  it("rejects a total that is not the sum of question points", () => {
    expect(ExamSchema.safeParse({ ...exam, total_points: 7 }).success).toBe(false);
  });
  it("requires options exactly for choice questions", () => {
    const bad = clone(exam);
    bad.questions[0]!.options = null as never;
    expect(ExamSchema.safeParse(bad).success).toBe(false);
  });
  it("requires a page-ordered layout manifest once rendered", () => {
    const page = (n: number) => ({ page: n, qr_payload: `exam-1/${n}`, questions: [] });
    const manifest = { paper_size: "letter", unit: "pt", page_count: 2, pages: [page(1), page(2)] };
    expect(RenderedExamSchema.safeParse({ ...exam, layout_manifest: manifest }).success).toBe(true);
    expect(RenderedExamSchema.safeParse({ ...exam, layout_manifest: { ...manifest, pages: [page(2), page(1)] } }).success).toBe(false);
    expect(RenderedExamSchema.safeParse(exam).success).toBe(false);
  });
});

describe("AnswerKey", () => {
  it("accepts objective and open entries", () => {
    expect(AnswerKeySchema.safeParse(key).success).toBe(true);
  });
  it("requires a rubric for open-ended questions", () => {
    const bad = clone(key);
    bad.entries[1]!.rubric = null as never;
    expect(AnswerKeySchema.safeParse(bad).success).toBe(false);
  });
  it("accepts step marks and sums rubric points", () => {
    const steps = { kind: "steps" as const, steps: [{ description: "Sets up", points: 2 }, { description: "Solves", points: 3 }] };
    const withSteps = clone(key);
    withSteps.entries[1]!.rubric = steps as never;
    expect(AnswerKeySchema.safeParse(withSteps).success).toBe(true);
    expect(rubricMaxPoints(steps)).toBe(5);
  });
});

describe("Attempt", () => {
  const attempt = {
    schema_version: 1, id: "a1", exam_id: "exam-1", status: "not_started", started_at: null,
    duration_minutes: 20, extra_time_factor: 1, submitted_at: null, minutes_late: 0, pages: [],
  };
  it("ties started_at and submitted_at to the status", () => {
    expect(AttemptSchema.safeParse(attempt).success).toBe(true);
    expect(AttemptSchema.safeParse({ ...attempt, status: "in_progress" }).success).toBe(false);
    expect(AttemptSchema.safeParse({ ...attempt, status: "in_progress", started_at: "2026-11-12T10:00:00Z" }).success).toBe(true);
    expect(AttemptSchema.safeParse({ ...attempt, status: "graded", started_at: "2026-11-12T10:00:00Z" }).success).toBe(false);
  });
  it("rejects an extra-time factor that would shorten the test", () => {
    expect(AttemptSchema.safeParse({ ...attempt, extra_time_factor: 0.5 }).success).toBe(false);
  });
});

describe("Reading", () => {
  const set = (reading: object) => ({
    schema_version: 1, exam_id: "exam-1",
    page_report: { expected_pages: 1, missing: [], duplicate: [], foreign: [] },
    readings: [{ number: 1, state: "answered", transcription: null, selected_option: "B", confidence: 0.9, page: 1, ...reading }],
  });
  it("accepts an answered reading", () => {
    expect(ReadingSetSchema.safeParse(set({})).success).toBe(true);
  });
  it("never lets a blank carry an answer", () => {
    expect(ReadingSetSchema.safeParse(set({ state: "blank" })).success).toBe(false);
    expect(ReadingSetSchema.safeParse(set({ state: "blank", selected_option: null })).success).toBe(true);
  });
  it("rejects an answered reading with nothing in it", () => {
    expect(ReadingSetSchema.safeParse(set({ selected_option: null, transcription: "  " })).success).toBe(false);
  });
});

describe("GradeReport", () => {
  it("accepts a report whose totals add up", () => {
    expect(GradeReportSchema.safeParse(report).success).toBe(true);
  });
  it("rejects a total that is not the sum of the questions", () => {
    expect(GradeReportSchema.safeParse({ ...report, total_points: 4 }).success).toBe(false);
  });
  it("rejects points outside zero to the maximum", () => {
    const over = clone(report);
    over.questions[0]!.points = 2;
    over.total_points = 4.5;
    expect(GradeReportSchema.safeParse(over).success).toBe(false);
    const under = clone(report);
    under.questions[0]!.points = -1;
    expect(GradeReportSchema.safeParse(under).success).toBe(false);
  });
  it("rejects a breakdown that does not add up to the total", () => {
    expect(GradeReportSchema.safeParse({ ...report, by_topic: [report.by_topic[0]] }).success).toBe(false);
  });
});

describe("question types", () => {
  it("separates objective from open-ended", () => {
    expect(isObjectiveType("multiple_choice")).toBe(true);
    expect(isObjectiveType("numeric")).toBe(true);
    expect(isObjectiveType("essay")).toBe(false);
    expect(isObjectiveType("worked_problem")).toBe(false);
  });
});
