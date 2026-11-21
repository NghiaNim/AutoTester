import { describe, expect, it } from "vitest";
import { MODEL_ROLES, loadModelConfig, modelFamily } from "@/lib/config/models";

describe("model config", () => {
  it("has one model per role by default, with solver and judge outside the writer's family", () => {
    const config = loadModelConfig({});
    expect(config.error).toBeNull();
    for (const role of MODEL_ROLES) expect(config.data![role].model).toMatch(/.+\/.+/);
    expect(modelFamily(config.data!.solve.model)).not.toBe(modelFamily(config.data!.write.model));
    expect(modelFamily(config.data!.judge.model)).not.toBe(modelFamily(config.data!.write.model));
  });
  it("lets each role be overridden from the environment", () => {
    const config = loadModelConfig({ MODEL_READ: "openai/some-vision-model" });
    expect(config.data!.read.model).toBe("openai/some-vision-model");
  });
  it("refuses a solver or judge from the writer's family", () => {
    expect(loadModelConfig({ MODEL_WRITE: "openai/a", MODEL_SOLVE: "openai/b", MODEL_JUDGE: "google/c" }).error).toMatch(/solve/);
    expect(loadModelConfig({ MODEL_WRITE: "google/a", MODEL_SOLVE: "openai/b", MODEL_JUDGE: "google/c" }).error).toMatch(/judge/);
  });
  it("refuses a malformed model ID", () => {
    expect(loadModelConfig({ MODEL_GRADE: "just-a-name" }).error).toMatch(/MODEL_GRADE/);
  });
  it("grades at a low temperature", () => {
    expect(loadModelConfig({}).data!.grade.temperature).toBeLessThanOrEqual(0.2);
  });
});
