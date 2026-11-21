import { z } from "zod";

export const LEVEL_NAMES = ["Excellent", "Good", "Developing", "Beginning"] as const;
export const LevelNameSchema = z.enum(LEVEL_NAMES);
export type LevelName = z.infer<typeof LevelNameSchema>;

export const CriterionLevelSchema = z.object({
  name: LevelNameSchema,
  description: z.string(),
  percentage: z.number().min(0).max(100),
});

export const CriterionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  points: z.number().positive(),
  levels: z.array(CriterionLevelSchema).length(4),
});

export const StepMarkSchema = z.object({
  description: z.string().min(1),
  points: z.number().positive(),
});

export const RubricSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("criteria"), criteria: z.array(CriterionSchema).min(1) }),
  z.object({ kind: z.literal("steps"), steps: z.array(StepMarkSchema).min(1) }),
]);

export type CriterionLevel = z.infer<typeof CriterionLevelSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type StepMark = z.infer<typeof StepMarkSchema>;
export type Rubric = z.infer<typeof RubricSchema>;

export function rubricMaxPoints(rubric: Rubric): number {
  const parts = rubric.kind === "criteria" ? rubric.criteria : rubric.steps;
  return parts.reduce((sum, part) => sum + part.points, 0);
}
