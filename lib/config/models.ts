import { Result, err, ok } from "@/lib/utils/result";

export const MODEL_ROLES = ["extract", "write", "solve", "read", "grade", "judge"] as const;
export type ModelRole = (typeof MODEL_ROLES)[number];

export type RoleConfig = { model: string; temperature: number };
export type ModelConfig = Record<ModelRole, RoleConfig>;

/**
 * Provisional until M3 picks each role by eval score (see DECISIONS.md).
 * Every ID was present in the OpenRouter catalogue on 2026-11-12.
 */
export const PROVISIONAL_MODELS: ModelConfig = {
  extract: { model: "google/gemini-4-carbon", temperature: 0 },
  write: { model: "anthropic/claude-sonnet-5.5", temperature: 0.7 },
  solve: { model: "openai/gpt-6.1-sol", temperature: 0 },
  read: { model: "google/gemini-4-carbon", temperature: 0 },
  grade: { model: "anthropic/claude-sonnet-5.5", temperature: 0.1 },
  judge: { model: "openai/gpt-6.1-sol", temperature: 0 },
};

export function modelFamily(modelId: string): string {
  return modelId.split("/")[0]?.toLowerCase() ?? "";
}

type Env = Record<string, string | undefined>;

export function loadModelConfig(env: Env = process.env): Result<ModelConfig> {
  const config = {} as ModelConfig;
  for (const role of MODEL_ROLES) {
    const override = env[`MODEL_${role.toUpperCase()}`]?.trim();
    const model = override || PROVISIONAL_MODELS[role].model;
    if (!/^[^/\s]+\/[^/\s]+$/.test(model)) {
      return err(`MODEL_${role.toUpperCase()} must look like "provider/model", got "${model}"`, 400);
    }
    config[role] = { model, temperature: PROVISIONAL_MODELS[role].temperature };
  }
  const writer = modelFamily(config.write.model);
  for (const role of ["solve", "judge"] as const) {
    if (modelFamily(config[role].model) === writer) {
      return err(
        `The ${role} model (${config[role].model}) must come from a different family than the writer (${config.write.model})`,
        400,
      );
    }
  }
  return ok(config);
}
