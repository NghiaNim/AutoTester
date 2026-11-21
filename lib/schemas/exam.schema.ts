import { z } from "zod";
import { AnswerSpaceSchema, PaperSizeSchema, QuestionTypeSchema } from "./common.schema";

export const ExamOptionSchema = z.object({
  label: z.string().min(1),
  text_md: z.string().min(1),
});

export const ExamQuestionSchema = z.object({
  number: z.number().int().positive(),
  section_id: z.string().min(1),
  type: QuestionTypeSchema,
  prompt_md: z.string().min(1).describe("Markdown with LaTeX"),
  options: z.array(ExamOptionSchema).nullable(),
  matching: z
    .object({ left: z.array(ExamOptionSchema).min(2), right: z.array(ExamOptionSchema).min(2) })
    .nullable(),
  points: z.number().positive(),
  answer_space: AnswerSpaceSchema,
  topic_id: z.string().min(1),
  source_chunk_ids: z.array(z.string()),
});

export const ExamSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  instructions: z.string(),
});

export const AnswerBoxSchema = z.object({
  part: z.string().nullable(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const LayoutPageSchema = z.object({
  page: z.number().int().positive(),
  qr_payload: z.string().min(1),
  questions: z.array(
    z.object({ number: z.number().int().positive(), answer_boxes: z.array(AnswerBoxSchema) }),
  ),
});

export const LayoutManifestSchema = z
  .object({
    paper_size: PaperSizeSchema,
    unit: z.literal("pt").describe("PDF points from the top-left corner of the page"),
    page_count: z.number().int().positive(),
    pages: z.array(LayoutPageSchema).min(1),
  })
  .refine((m) => m.pages.length === m.page_count && m.pages.every((p, i) => p.page === i + 1), {
    message: "pages must be listed 1..page_count in order",
    path: ["pages"],
  });

const examShape = {
  schema_version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.number().int().positive(),
  general_knowledge: z.boolean().describe("True when written from a topic list instead of the user's materials"),
  time_limit_minutes: z.number().positive(),
  total_points: z.number().positive(),
  sections: z.array(ExamSectionSchema).min(1),
  questions: z.array(ExamQuestionSchema).min(1),
};

type ExamCore = {
  total_points: number;
  sections: { id: string }[];
  questions: { number: number; section_id: string; type: string; points: number; options: unknown[] | null; matching: unknown | null }[];
};

function checkExam(exam: ExamCore, ctx: z.RefinementCtx): void {
  const sectionIds = new Set(exam.sections.map((s) => s.id));
  exam.questions.forEach((q, i) => {
    if (q.number !== i + 1) {
      ctx.addIssue({ code: "custom", message: "questions must be numbered 1..n in order", path: ["questions", i, "number"] });
    }
    if (!sectionIds.has(q.section_id)) {
      ctx.addIssue({ code: "custom", message: `unknown section ${q.section_id}`, path: ["questions", i, "section_id"] });
    }
    const needsOptions = q.type === "multiple_choice" || q.type === "true_false";
    if (needsOptions !== (q.options !== null)) {
      ctx.addIssue({ code: "custom", message: "options are required for, and only for, choice questions", path: ["questions", i, "options"] });
    }
    if ((q.type === "matching") !== (q.matching !== null)) {
      ctx.addIssue({ code: "custom", message: "matching lists are required for, and only for, matching questions", path: ["questions", i, "matching"] });
    }
  });
  const sum = exam.questions.reduce((total, q) => total + q.points, 0);
  if (Math.abs(sum - exam.total_points) > 1e-9) {
    ctx.addIssue({ code: "custom", message: `total_points (${exam.total_points}) must equal the sum of question points (${sum})`, path: ["total_points"] });
  }
}

/** The test without answers, as writeExam produces it. Strict, so key fields cannot ride along. */
export const ExamSchema = z.strictObject(examShape).superRefine(checkExam);

/** The exam after renderExam has added where everything sits on paper. */
export const RenderedExamSchema = z
  .strictObject({ ...examShape, layout_manifest: LayoutManifestSchema })
  .superRefine(checkExam);

export type ExamOption = z.infer<typeof ExamOptionSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type LayoutManifest = z.infer<typeof LayoutManifestSchema>;
export type Exam = z.infer<typeof ExamSchema>;
export type RenderedExam = z.infer<typeof RenderedExamSchema>;
