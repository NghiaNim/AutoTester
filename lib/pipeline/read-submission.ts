import type { ReadingSet, RenderedExam } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { InputFile, PipelineDeps, notImplemented } from "./types";

export async function readSubmission(exam: RenderedExam, pages: InputFile[], deps: PipelineDeps): Promise<Result<ReadingSet>> {
  void exam;
  void pages;
  void deps;
  return notImplemented("readSubmission", "M1");
}
