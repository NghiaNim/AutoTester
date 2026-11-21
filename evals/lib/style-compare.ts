import { StyleProfile, styleQuestionCount } from "@/lib/schemas";

export const STYLE_FIELDS = [
  "question_count",
  "section_order",
  "question_types",
  "total_points",
  "time_limit",
  "option_count",
] as const;
export type StyleField = (typeof STYLE_FIELDS)[number];

export type FieldComparison = {
  field: StyleField;
  exact: boolean;
  /** Relative error for numeric fields. Structural fields that differ count as fully off. */
  off_by: number;
  expected: string;
  actual: string;
};

function relative(expected: number, actual: number): number {
  if (expected === actual) return 0;
  if (expected === 0) return 1;
  return Math.abs(actual - expected) / Math.abs(expected);
}

function numeric(field: StyleField, expected: number, actual: number): FieldComparison {
  return { field, exact: expected === actual, off_by: relative(expected, actual), expected: String(expected), actual: String(actual) };
}

function structural(field: StyleField, expected: string, actual: string): FieldComparison {
  return { field, exact: expected === actual, off_by: expected === actual ? 0 : 1, expected, actual };
}

function sectionOrder(profile: StyleProfile): string {
  return profile.sections.map((s) => `${s.question_type}x${s.count}`).join(" > ");
}

function questionTypes(profile: StyleProfile): string {
  return [...new Set(profile.sections.map((s) => s.question_type))].sort().join(", ");
}

function optionCounts(profile: StyleProfile): Map<string, number> {
  const used = new Set(profile.sections.map((s) => s.question_type));
  return new Map(
    profile.question_types
      .filter((t) => used.has(t.question_type) && t.options !== null)
      .map((t) => [t.question_type, t.options!.count]),
  );
}

function compareOptionCounts(expected: StyleProfile, actual: StyleProfile): FieldComparison {
  const want = optionCounts(expected);
  const got = optionCounts(actual);
  const describe = (m: Map<string, number>) =>
    m.size === 0 ? "none" : [...m].sort().map(([type, count]) => `${type}:${count}`).join(", ");
  const sameTypes = want.size === got.size && [...want.keys()].every((type) => got.has(type));
  const offBy = sameTypes ? Math.max(0, ...[...want].map(([type, count]) => relative(count, got.get(type)!))) : 1;
  return { field: "option_count", exact: offBy === 0, off_by: offBy, expected: describe(want), actual: describe(got) };
}

export function compareStyle(expected: StyleProfile, actual: StyleProfile): FieldComparison[] {
  return [
    numeric("question_count", styleQuestionCount(expected), styleQuestionCount(actual)),
    structural("section_order", sectionOrder(expected), sectionOrder(actual)),
    structural("question_types", questionTypes(expected), questionTypes(actual)),
    numeric("total_points", expected.total_points.value, actual.total_points.value),
    numeric("time_limit", expected.time_limit.minutes, actual.time_limit.minutes),
    compareOptionCounts(expected, actual),
  ];
}
