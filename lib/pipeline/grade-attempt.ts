import type { AnswerKey, GradeReport, ReadingSet, RenderedExam } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { InputFile, PipelineDeps, notImplemented } from "./types";

export type GradeInput = {
  attempt_id: string;
  exam: RenderedExam;
  key: AnswerKey;
  readings: ReadingSet;
  /** Normalized page images, for open-ended questions the grader should see as written. */
  pages: InputFile[];
  time_used_minutes: number | null;
  minutes_late: number;
};

export async function gradeAttempt(input: GradeInput, deps: PipelineDeps): Promise<Result<GradeReport>> {
  void input;
  void deps;
  return notImplemented("gradeAttempt", "M1");
}
