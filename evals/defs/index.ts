import type { EvalDef } from "../lib/types";
import { e01 } from "./e01-ingestion";
import { e02 } from "./e02-style-extraction";
import { e03 } from "./e03-structure";
import { pendingGates, reported } from "./pending";

export const EVALS: EvalDef[] = [e01, e02, e03, ...pendingGates, ...reported];
