import { z } from "zod";
import { DifficultySchema, QuestionTypeSchema } from "./common.schema";

export const BlueprintSlotSchema = z.object({
  number: z.number().int().positive(),
  section_id: z.string().min(1),
  type: QuestionTypeSchema,
  points: z.number().positive(),
  difficulty: DifficultySchema,
  topic_id: z.string().min(1),
  chunk_ids: z.array(z.string()),
});

export const BlueprintSchema = z
  .object({
    schema_version: z.literal(1),
    id: z.string().min(1),
    style_name: z.string().min(1),
    material_set_id: z.string().min(1),
    version: z.number().int().positive(),
    general_knowledge: z.boolean(),
    time_limit_minutes: z.number().positive(),
    slots: z.array(BlueprintSlotSchema).min(1),
  })
  .superRefine((bp, ctx) => {
    bp.slots.forEach((slot, i) => {
      if (slot.number !== i + 1) {
        ctx.addIssue({ code: "custom", message: "slots must be numbered 1..n in order", path: ["slots", i, "number"] });
      }
      if (!bp.general_knowledge && slot.chunk_ids.length === 0) {
        ctx.addIssue({ code: "custom", message: "a grounded slot needs source chunks", path: ["slots", i, "chunk_ids"] });
      }
    });
  });

export type BlueprintSlot = z.infer<typeof BlueprintSlotSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
