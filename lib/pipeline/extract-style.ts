import type { StyleProfile } from "@/lib/schemas";
import type { Result } from "@/lib/utils/result";
import { InputFile, PipelineDeps, notImplemented } from "./types";

export async function extractStyle(samples: InputFile[], deps: PipelineDeps): Promise<Result<StyleProfile>> {
  void samples;
  void deps;
  return notImplemented("extractStyle", "M1");
}
