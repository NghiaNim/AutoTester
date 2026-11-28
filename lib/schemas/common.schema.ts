import { z } from "zod";

export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "matching",
  "fill_in",
  "numeric",
  "short_answer",
  "worked_problem",
  "essay",
  "code_reading",
] as const;

export const QuestionTypeSchema = z.enum(QUESTION_TYPES);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

const OBJECTIVE_TYPES: ReadonlySet<QuestionType> = new Set([
  "multiple_choice",
  "true_false",
  "matching",
  "fill_in",
  "numeric",
]);

export function isObjectiveType(type: QuestionType): boolean {
  return OBJECTIVE_TYPES.has(type);
}

export const DifficultySchema = z.enum(["recall", "apply", "analyze"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ProvenanceSchema = z.enum(["stated", "estimated"]);
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const PaperSizeSchema = z.enum(["letter", "a4"]);
export type PaperSize = z.infer<typeof PaperSizeSchema>;

export const AnswerSpaceSchema = z.object({
  kind: z.enum(["mark_option", "blank", "lines", "box", "full_page"]),
  lines: z.number().int().min(0).describe("Approximate ruled lines of writing room; 0 when the answer is marked on the option itself"),
});
export type AnswerSpace = z.infer<typeof AnswerSpaceSchema>;

export const SourceLocationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file"),
    file: z.string().min(1),
    page: z.number().int().positive().nullable(),
    slide: z.number().int().positive().nullable(),
  }),
  z.object({ kind: z.literal("url"), url: z.url() }),
  z.object({ kind: z.literal("topic_list") }),
]);
export type SourceLocation = z.infer<typeof SourceLocationSchema>;

export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
