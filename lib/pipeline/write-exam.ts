import type { AnswerKey, Blueprint, Exam, MaterialSet, StyleProfile } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { PipelineDeps, notImplemented } from "./types";

export type WriteContext = {
  style: StyleProfile;
  materials: MaterialSet;
  /** Question texts that the new test must not near-duplicate: earlier versions and the sample tests. */
  avoid: string[];
};

export type WrittenExam = { exam: Exam; key: AnswerKey; regenerated_questions: number };

export async function writeExam(blueprint: Blueprint, context: WriteContext, deps: PipelineDeps): Promise<Result<WrittenExam>> {
  void blueprint;
  void context;
  void deps;
  return notImplemented("writeExam", "M1");
}
