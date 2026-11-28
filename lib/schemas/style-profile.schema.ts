import { z } from "zod";
import {
  AnswerSpaceSchema,
  PaperSizeSchema,
  ProvenanceSchema,
  QuestionTypeSchema,
} from "./common.schema";

export const StyleSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    instructions: z.string(),
    question_type: QuestionTypeSchema,
    count: z.number().int().positive(),
    points_per_question: z.array(z.number().positive()).describe("One entry per question, in order"),
  })
  .refine((s) => s.points_per_question.length === s.count, {
    message: "points_per_question must have one entry per question",
    path: ["points_per_question"],
  });

export const QuestionTypeStyleSchema = z.object({
  question_type: QuestionTypeSchema,
  stem_words: z
    .object({ min: z.number().int().min(0), max: z.number().int().min(0) })
    .refine((r) => r.min <= r.max, { message: "min must not exceed max" }),
  options: z
    .object({ count: z.number().int().min(2), labels: z.array(z.string().min(1)).min(2) })
    .refine((o) => o.labels.length === o.count, { message: "one label per option" })
    .nullable(),
  sub_parts: z
    .object({
      pattern: z.string().describe("How parts are labelled, such as (a), (b), (c)"),
      typical_count: z.number().int().positive(),
    })
    .nullable(),
  answer_space: AnswerSpaceSchema,
  show_work: z.boolean(),
});

export const ExemplarSchema = z.object({
  question_type: QuestionTypeSchema,
  text: z.string().min(1),
  never_copy: z.literal(true),
});

export const DifficultyMixSchema = z
  .object({
    recall: z.number().min(0).max(1),
    apply: z.number().min(0).max(1),
    analyze: z.number().min(0).max(1),
  })
  .refine((m) => Math.abs(m.recall + m.apply + m.analyze - 1) < 0.01, {
    message: "difficulty mix must sum to 1",
  });

export const StyleLayoutSchema = z.object({
  paper_size: PaperSizeSchema,
  columns: z.number().int().min(1).max(3),
  numbering: z.enum(["continuous", "per_section"]),
  number_format: z.string().describe("How a question number is written, such as '1.' or 'Problem 1'"),
  points_placement: z.enum(["before_stem", "after_stem", "section_header", "margin", "none"]),
});

export const StyleDisagreementSchema = z.object({
  field: z.string().min(1),
  values: z.array(z.string()).min(2),
  resolution: z.string(),
});

export const StyleProfileSchema = z
  .object({
    schema_version: z.literal(1),
    name: z.string().min(1),
    time_limit: z.object({ minutes: z.number().positive(), provenance: ProvenanceSchema }),
    total_points: z.object({ value: z.number().positive(), provenance: ProvenanceSchema }),
    sections: z.array(StyleSectionSchema).min(1),
    question_types: z.array(QuestionTypeStyleSchema).min(1),
    difficulty_mix: DifficultyMixSchema,
    voice_notes: z.array(z.string()),
    exemplars: z.array(ExemplarSchema),
    layout: StyleLayoutSchema,
    not_reproduced: z.array(z.string()),
    disagreements: z.array(StyleDisagreementSchema),
    source_samples: z.array(z.string()),
  })
  .superRefine((profile, ctx) => {
    const described = new Set(profile.question_types.map((t) => t.question_type));
    if (described.size !== profile.question_types.length) {
      ctx.addIssue({ code: "custom", message: "question_types lists a type twice", path: ["question_types"] });
    }
    for (const [i, section] of profile.sections.entries()) {
      if (!described.has(section.question_type)) {
        ctx.addIssue({
          code: "custom",
          message: `section uses ${section.question_type} but question_types does not describe it`,
          path: ["sections", i, "question_type"],
        });
      }
    }
    const ids = new Set(profile.sections.map((s) => s.id));
    if (ids.size !== profile.sections.length) {
      ctx.addIssue({ code: "custom", message: "section ids must be unique", path: ["sections"] });
    }
    const sum = profile.sections.reduce(
      (total, s) => total + s.points_per_question.reduce((a, b) => a + b, 0),
      0,
    );
    if (profile.total_points.provenance === "stated") return;
    if (Math.abs(sum - profile.total_points.value) > 1e-9) {
      ctx.addIssue({
        code: "custom",
        message: `estimated total_points (${profile.total_points.value}) must equal the section sum (${sum})`,
        path: ["total_points"],
      });
    }
  });

export type StyleSection = z.infer<typeof StyleSectionSchema>;
export type QuestionTypeStyle = z.infer<typeof QuestionTypeStyleSchema>;
export type StyleProfile = z.infer<typeof StyleProfileSchema>;

export function styleQuestionCount(profile: StyleProfile): number {
  return profile.sections.reduce((n, s) => n + s.count, 0);
}

export function styleSectionPointsSum(profile: StyleProfile): number {
  return profile.sections.reduce(
    (total, s) => total + s.points_per_question.reduce((a, b) => a + b, 0),
    0,
  );
}
