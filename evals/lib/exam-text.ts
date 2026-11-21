import type { Exam } from "@/lib/schemas";

export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Words a student reads: instructions, prompts and options. */
export function examWordCount(exam: Pick<Exam, "sections" | "questions">): number {
  const parts: string[] = exam.sections.map((s) => `${s.title} ${s.instructions}`);
  for (const q of exam.questions) {
    parts.push(q.prompt_md);
    for (const option of q.options ?? []) parts.push(option.text_md);
    for (const item of [...(q.matching?.left ?? []), ...(q.matching?.right ?? [])]) parts.push(item.text_md);
  }
  return countWords(parts.join(" "));
}
