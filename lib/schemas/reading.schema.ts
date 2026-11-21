import { z } from "zod";

export const ReadingStateSchema = z.enum(["answered", "blank", "unreadable"]);

export const ReadingSchema = z
  .object({
    number: z.number().int().positive(),
    state: ReadingStateSchema,
    transcription: z.string().nullable(),
    selected_option: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    page: z.number().int().positive().nullable(),
  })
  .superRefine((reading, ctx) => {
    const hasContent = Boolean(reading.transcription?.trim()) || reading.selected_option !== null;
    if (reading.state === "answered" && !hasContent) {
      ctx.addIssue({ code: "custom", message: "an answered reading needs a transcription or a selected option", path: ["state"] });
    }
    if (reading.state !== "answered" && hasContent) {
      ctx.addIssue({ code: "custom", message: "a blank or unreadable reading must not carry an answer", path: ["state"] });
    }
  });

export const PageReportSchema = z.object({
  expected_pages: z.number().int().positive(),
  missing: z.array(z.number().int().positive()),
  duplicate: z.array(z.number().int().positive()),
  foreign: z.array(z.object({ upload_index: z.number().int().min(0), reason: z.string() })),
});

export const ReadingSetSchema = z
  .object({
    schema_version: z.literal(1),
    exam_id: z.string().min(1),
    page_report: PageReportSchema,
    readings: z.array(ReadingSchema),
  })
  .refine((set) => set.readings.every((r, i) => r.number === i + 1), {
    message: "readings must cover questions 1..n in order",
    path: ["readings"],
  });

export type Reading = z.infer<typeof ReadingSchema>;
export type PageReport = z.infer<typeof PageReportSchema>;
export type ReadingSet = z.infer<typeof ReadingSetSchema>;
