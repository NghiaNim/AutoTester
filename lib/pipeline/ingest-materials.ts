import type { MaterialSet } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { MaterialInput, PipelineDeps, notImplemented } from "./types";

export async function ingestMaterials(inputs: MaterialInput[], deps: PipelineDeps): Promise<Result<MaterialSet>> {
  void inputs;
  void deps;
  return notImplemented("ingestMaterials", "M1");
}
