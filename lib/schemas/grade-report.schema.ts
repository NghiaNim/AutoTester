import { z } from "zod";
import { QuestionTypeSchema } from "./common.schema";
import { LevelNameSchema } from "./rubric.schema";

export const CriterionGradeSchema = z.object({
  criterion_name: z.string().min(1),
  level: LevelNameSchema.nullable().describe("Null for step marks, which have no levels"),
  points_earned: z.number().min(0),
  points_possible: z.number().positive(),
  reasoning: z.string(),
});

export const QuestionGradeSchema = z
  .object({
    number: z.number().int().positive(),
    type: QuestionTypeSchema,
    topic_id: z.string().min(1),
    points: z.number().min(0),
    max_points: z.number().positive(),
    graded_by: z.enum(["code", "model"]),
    criteria: z.array(CriterionGradeSchema),
    feedback: z.string(),
    correct_solution_md: z.string(),
    confidence: z.number().min(0).max(1),
  })
  .refine((q) => q.points <= q.max_points, { message: "points must not exceed max_points", path: ["points"] });

export const BreakdownRowSchema = z.object({
  key: z.string().min(1),
  points: z.number().min(0),
  max_points: z.number().min(0),
});

const TOLERANCE = 1e-9;

export const GradeReportSchema = z
  .object({
    schema_version: z.literal(1),
    exam_id: z.string().min(1),
    attempt_id: z.string().min(1),
    questions: z.array(QuestionGradeSchema).min(1),
    total_points: z.number().min(0),
    max_points: z.number().positive(),
    by_topic: z.array(BreakdownRowSchema),
    by_type: z.array(BreakdownRowSchema),
    time_used_minutes: z.number().min(0).nullable(),
    minutes_late: z.number().min(0),
  })
  .superRefine((report, ctx) => {
    const points = report.questions.reduce((sum, q) => sum + q.points, 0);
    const max = report.questions.reduce((sum, q) => sum + q.max_points, 0);
    if (Math.abs(points - report.total_points) > TOLERANCE) {
      ctx.addIssue({ code: "custom", message: "total_points must equal the sum of question points", path: ["total_points"] });
    }
    if (Math.abs(max - report.max_points) > TOLERANCE) {
      ctx.addIssue({ code: "custom", message: "max_points must equal the sum of question maxima", path: ["max_points"] });
    }
    for (const field of ["by_topic", "by_type"] as const) {
      const rows = report[field];
      const rowPoints = rows.reduce((sum, r) => sum + r.points, 0);
      const rowMax = rows.reduce((sum, r) => sum + r.max_points, 0);
      if (Math.abs(rowPoints - points) > TOLERANCE || Math.abs(rowMax - max) > TOLERANCE) {
        ctx.addIssue({ code: "custom", message: `${field} must add up to the totals`, path: [field] });
      }
    }
  });

export type CriterionGrade = z.infer<typeof CriterionGradeSchema>;
export type QuestionGrade = z.infer<typeof QuestionGradeSchema>;
export type GradeReport = z.infer<typeof GradeReportSchema>;
