import type { PipelineDeps } from "@/lib/pipeline";
import type { Result } from "@/lib/utils/result";
import { NOT_IMPLEMENTED_STATUS } from "@/lib/pipeline";
import type { ExamSetEntry } from "./exam-set";
import type { Pack } from "./packs";

export type Measure = { name: string; pass: boolean; value: string; bar: string };

export type EvalOutcome = { measures: Measure[]; failures: string[] };

export type EvalContext = {
  root: string;
  fresh: boolean;
  includeHoldout: boolean;
  deps: PipelineDeps;
  packs: Pack[];
  /** Generated once per run and shared by E3 to E7. */
  examSet(): Promise<ExamSetEntry[]>;
};

export type EvalDef = {
  id: string;
  title: string;
  kind: "gate" | "reported";
  milestone: string;
  measure: string;
  bar: string;
  run(ctx: EvalContext): Promise<EvalOutcome>;
};

export type EvalStatus = "pass" | "fail" | "crash";

export type EvalRecord = {
  id: string;
  title: string;
  kind: "gate" | "reported";
  status: EvalStatus;
  reason: string | null;
  measures: Measure[];
  failures: string[];
  duration_ms: number;
};

export type BlockReason =
  | "stage_not_implemented"
  | "stage_failed"
  | "fixtures_missing"
  | "eval_not_built"
  | "awaiting_owner";

/** A gate that cannot run is a failed gate. This carries why, so the scoreboard can say so. */
export class Blocked extends Error {
  constructor(
    public readonly kind: BlockReason,
    message: string,
  ) {
    super(message);
    this.name = "Blocked";
  }
}

export function need<T>(result: Result<T>, stage: string): T {
  if (result.error === null) return result.data;
  if (result.status === NOT_IMPLEMENTED_STATUS) throw new Blocked("stage_not_implemented", result.error);
  throw new Blocked("stage_failed", `${stage} failed: ${result.error}`);
}

export function formatRatio(num: number, den: number): string {
  if (den === 0) return "n/a (0/0)";
  return `${((100 * num) / den).toFixed(1)}% (${num}/${den})`;
}

/** A share that must reach a minimum. An empty denominator never passes. */
export function atLeast(name: string, num: number, den: number, minPercent: number): Measure {
  return {
    name,
    pass: den > 0 && (100 * num) / den >= minPercent,
    value: formatRatio(num, den),
    bar: `at least ${minPercent}%`,
  };
}

/** A share that must stay under a maximum. */
export function atMost(name: string, num: number, den: number, maxPercent: number): Measure {
  return {
    name,
    pass: den > 0 && (100 * num) / den <= maxPercent,
    value: formatRatio(num, den),
    bar: `at most ${maxPercent}%`,
  };
}

/** Every case must pass. */
export function every(name: string, num: number, den: number): Measure {
  return { name, pass: den > 0 && num === den, value: formatRatio(num, den), bar: "every case" };
}
