import type { Exam, StyleProfile } from "@/lib/schemas";
import { examWordCount } from "../lib/exam-text";
import { EvalDef, every } from "../lib/types";

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** Section order, per-section type and count, and every question's points, all against the profile. */
export function structureProblems(style: StyleProfile, exam: Pick<Exam, "sections" | "questions" | "total_points">): string[] {
  const problems: string[] = [];
  const wantOrder = style.sections.map((s) => s.id).join(" > ");
  const gotOrder = exam.sections.map((s) => s.id).join(" > ");
  if (wantOrder !== gotOrder) problems.push(`section order: expected ${wantOrder}, got ${gotOrder}`);

  for (const section of style.sections) {
    const questions = exam.questions.filter((q) => q.section_id === section.id);
    if (questions.length !== section.count) {
      problems.push(`section ${section.id}: expected ${section.count} questions, got ${questions.length}`);
    }
    const wrongType = questions.filter((q) => q.type !== section.question_type);
    if (wrongType.length > 0) {
      problems.push(`section ${section.id}: ${wrongType.length} questions are not ${section.question_type}`);
    }
    const wantPoints = section.points_per_question.join(",");
    const gotPoints = questions.map((q) => q.points).join(",");
    if (wantPoints !== gotPoints) problems.push(`section ${section.id}: points expected [${wantPoints}], got [${gotPoints}]`);
  }

  const numbers = exam.questions.map((q) => q.section_id);
  const firstSeen = [...new Set(numbers)].join(" > ");
  if (firstSeen !== wantOrder) problems.push(`questions are not grouped in section order (${firstSeen})`);

  const wantTotal = style.sections.reduce((t, s) => t + s.points_per_question.reduce((a, b) => a + b, 0), 0);
  if (exam.total_points !== wantTotal) problems.push(`total points: expected ${wantTotal}, got ${exam.total_points}`);
  return problems;
}

export function pagesWithinBar(samplePages: number, examPages: number): boolean {
  return Math.abs(examPages - samplePages) <= Math.max(1, 0.15 * samplePages);
}

export function wordsWithinBar(sampleWords: number, examWords: number): boolean {
  return Math.abs(examWords - sampleWords) <= 0.2 * sampleWords;
}

export const e03: EvalDef = {
  id: "E3",
  title: "Structure and length",
  kind: "gate",
  milestone: "M3",
  measure: "Generated exam against the profile, two generations per pack per material form.",
  bar: "Every exam: sections, order, count per type and total points exact. Page count within one page or 15% of the samples, whichever is larger. Word count within 20%.",

  async run(ctx) {
    const entries = await ctx.examSet();
    const failures: string[] = [];
    let structureOk = 0;
    let pagesOk = 0;
    let wordsOk = 0;

    for (const entry of entries) {
      const label = `${entry.pack.manifest.id}/${entry.form}/v${entry.generation}`;
      const problems = structureProblems(entry.style, entry.exam);
      if (problems.length === 0) structureOk += 1;
      failures.push(...problems.map((p) => `${label}: ${p}`));

      const samplePages = mean(entry.pack.manifest.samples.map((s) => s.pages));
      const examPages = entry.exam.layout_manifest.page_count;
      if (pagesWithinBar(samplePages, examPages)) pagesOk += 1;
      else failures.push(`${label}: ${examPages} pages against a sample mean of ${samplePages.toFixed(1)}`);

      const sampleWords = mean(entry.pack.manifest.samples.map((s) => s.words));
      const examWords = examWordCount(entry.exam);
      if (wordsWithinBar(sampleWords, examWords)) wordsOk += 1;
      else failures.push(`${label}: ${examWords} words against a sample mean of ${sampleWords.toFixed(0)}`);
    }

    return {
      measures: [
        every("exams with sections, order, counts and points exact", structureOk, entries.length),
        every("exams within the page-count bar", pagesOk, entries.length),
        every("exams within 20% of the sample word count", wordsOk, entries.length),
      ],
      failures,
    };
  },
};
