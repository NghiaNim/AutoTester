import type { ModelConfig } from "@/lib/config/models";
import type { LlmClient } from "@/lib/openrouter/client";
import { Result, err } from "@/lib/utils/result";

export type InputFile = { name: string; mime: string; bytes: Uint8Array };

export type MaterialInput =
  | { kind: "file"; file: InputFile }
  | { kind: "url"; url: string }
  | { kind: "topic_list"; text: string };

export type PipelineDeps = {
  llm: LlmClient;
  models: ModelConfig;
  fetchImpl?: typeof fetch;
  /** Evals serve saved web snapshots from localhost. The app leaves this off. */
  allowPrivateHosts?: boolean;
};

export const NOT_IMPLEMENTED_STATUS = 501;

export function notImplemented<T>(stage: string, milestone: string): Result<T> {
  return err(`${stage} is not implemented yet (${milestone})`, NOT_IMPLEMENTED_STATUS);
}
