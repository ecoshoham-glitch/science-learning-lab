import { z } from "zod";

/**
 * Topic map, version 1: a flowchart of a topic's written content, shown at the top of the topic.
 * Each box is a key idea with a short summary; its expansion (details + optional link to the lesson or
 * simulation where it is taught) opens on hover, focus or tap. Layout is data: every node has a `rank`
 * (row, top to bottom); arrows go one row down, or sideways within a row. See docs/TOPIC_MAPS.md.
 */
const localizedText = z.object({ he: z.string().min(1), en: z.string().min(1) });
const id = z.string().regex(/^[a-z0-9-]+$/);

export const topicMapSchema = z.object({
  mapVersion: z.literal(1),
  topic: id,
  origin: z.enum(["ai-generated", "teacher"]),
  reviewed: z.boolean(),
  nodes: z
    .array(
      z.object({
        id,
        rank: z.number().int().min(0).max(9),
        title: localizedText,
        summary: localizedText,
        details: z.array(localizedText).min(1),
        link: z.object({ kind: z.enum(["lesson", "simulation"]), id }).optional(),
      }),
    )
    .min(2),
  edges: z.array(z.object({ from: id, to: id, label: localizedText.optional() })),
});

export type TopicMap = z.infer<typeof topicMapSchema>;
export type TopicMapNode = TopicMap["nodes"][number];
