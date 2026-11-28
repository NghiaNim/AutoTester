import type { Blueprint, MaterialSet, StyleProfile } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { notImplemented } from "./types";

export type PlanOptions = {
  version: number;
  seed: string;
  /** Scale the test to this many questions instead of the style's own count. */
  question_count?: number;
  time_limit_minutes?: number;
};

export function planExam(style: StyleProfile, materials: MaterialSet, options: PlanOptions): Result<Blueprint> {
  void style;
  void materials;
  void options;
  return notImplemented("planExam", "M1");
}
