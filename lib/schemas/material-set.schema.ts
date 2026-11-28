import { z } from "zod";
import { SourceLocationSchema } from "./common.schema";

export const MaterialChunkSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  source: SourceLocationSchema,
});

export const MaterialTopicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().min(0),
  chunk_ids: z.array(z.string()),
  excluded: z.boolean(),
});

export const MaterialSetSchema = z
  .object({
    schema_version: z.literal(1),
    id: z.string().min(1),
    chunks: z.array(MaterialChunkSchema),
    topics: z.array(MaterialTopicSchema).min(1),
    topic_list_only: z.boolean(),
  })
  .superRefine((set, ctx) => {
    const chunkIds = new Set(set.chunks.map((c) => c.id));
    if (chunkIds.size !== set.chunks.length) {
      ctx.addIssue({ code: "custom", message: "chunk ids must be unique", path: ["chunks"] });
    }
    if (new Set(set.topics.map((t) => t.id)).size !== set.topics.length) {
      ctx.addIssue({ code: "custom", message: "topic ids must be unique", path: ["topics"] });
    }
    if (!set.topic_list_only && set.chunks.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "a material set with no chunks is only valid for topic-list-only input",
        path: ["chunks"],
      });
    }
    for (const [i, topic] of set.topics.entries()) {
      for (const id of topic.chunk_ids) {
        if (!chunkIds.has(id)) {
          ctx.addIssue({ code: "custom", message: `unknown chunk ${id}`, path: ["topics", i, "chunk_ids"] });
        }
      }
    }
  });

export type MaterialChunk = z.infer<typeof MaterialChunkSchema>;
export type MaterialTopic = z.infer<typeof MaterialTopicSchema>;
export type MaterialSet = z.infer<typeof MaterialSetSchema>;
