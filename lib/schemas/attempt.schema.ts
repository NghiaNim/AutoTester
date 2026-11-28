import { z } from "zod";
import { IsoDateTimeSchema } from "./common.schema";

export const ATTEMPT_STATUSES = [
  "not_started",
  "in_progress",
  "time_up",
  "submitted",
  "reading",
  "needs_review",
  "grading",
  "graded",
] as const;

export const AttemptStatusSchema = z.enum(ATTEMPT_STATUSES);
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;

export const UploadedPageSchema = z.object({
  storage_path: z.string().min(1).describe("Reference into private storage, never the bytes"),
  uploaded_at: IsoDateTimeSchema,
  page_number: z.number().int().positive().nullable().describe("Null until the page has been identified"),
  minutes_late: z.number().min(0),
});

export const AttemptSchema = z
  .object({
    schema_version: z.literal(1),
    id: z.string().min(1),
    exam_id: z.string().min(1),
    status: AttemptStatusSchema,
    started_at: IsoDateTimeSchema.nullable(),
    duration_minutes: z.number().positive(),
    extra_time_factor: z.number().min(1),
    submitted_at: IsoDateTimeSchema.nullable(),
    minutes_late: z.number().min(0),
    pages: z.array(UploadedPageSchema),
  })
  .superRefine((attempt, ctx) => {
    if ((attempt.status === "not_started") !== (attempt.started_at === null)) {
      ctx.addIssue({ code: "custom", message: "started_at is set exactly when the attempt has started", path: ["started_at"] });
    }
    const afterSubmit = ATTEMPT_STATUSES.indexOf(attempt.status) >= ATTEMPT_STATUSES.indexOf("submitted");
    if (afterSubmit && attempt.submitted_at === null) {
      ctx.addIssue({ code: "custom", message: "submitted_at is required once submitted", path: ["submitted_at"] });
    }
  });

export type UploadedPage = z.infer<typeof UploadedPageSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
