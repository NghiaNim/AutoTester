import { z } from "zod";
import { RubricSchema } from "./rubric.schema";

export const CorrectAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("option"), label: z.string().min(1) }),
  z.object({
    kind: z.literal("numeric"),
    value: z.number(),
    tolerance: z.number().min(0),
    unit: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("accepted"),
    answers: z.array(z.string().min(1)).min(1),
    case_sensitive: z.boolean(),
  }),
  z.object({
    kind: z.literal("matching"),
    pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).min(2),
  }),
  z.object({ kind: z.literal("open") }).describe("Graded against the reference solution and rubric"),
]);

export const AnswerKeyEntrySchema = z
  .object({
    number: z.number().int().positive(),
    answer: CorrectAnswerSchema,
    reference_solution_md: z.string().min(1),
    rubric: RubricSchema.nullable(),
    common_mistakes: z.array(z.string()),
  })
  .refine((entry) => entry.answer.kind !== "open" || entry.rubric !== null, {
    message: "an open-ended question needs a rubric",
    path: ["rubric"],
  });

export const AnswerKeySchema = z
  .object({
    schema_version: z.literal(1),
    exam_id: z.string().min(1),
    entries: z.array(AnswerKeyEntrySchema).min(1),
  })
  .refine((key) => key.entries.every((entry, i) => entry.number === i + 1), {
    message: "entries must be numbered 1..n in order",
    path: ["entries"],
  });

export type CorrectAnswer = z.infer<typeof CorrectAnswerSchema>;
export type AnswerKeyEntry = z.infer<typeof AnswerKeyEntrySchema>;
export type AnswerKey = z.infer<typeof AnswerKeySchema>;
