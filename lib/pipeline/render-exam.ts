import type { AnswerKey, Exam, RenderedExam, StyleProfile } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { notImplemented } from "./types";

export type RenderedPdf = { pdf: Uint8Array; exam: RenderedExam };

/** Takes no AnswerKey, so the student PDF cannot leak one. */
export async function renderExam(exam: Exam, layout: StyleProfile["layout"]): Promise<Result<RenderedPdf>> {
  void exam;
  void layout;
  return notImplemented("renderExam", "M1");
}

export async function renderAnswerKey(exam: Exam, key: AnswerKey): Promise<Result<{ pdf: Uint8Array }>> {
  void exam;
  void key;
  return notImplemented("renderAnswerKey", "M4");
}
