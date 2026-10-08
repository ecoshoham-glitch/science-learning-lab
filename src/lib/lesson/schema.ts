import { z } from "zod";

/**
 * Lesson definition, version 1 (Project Instructions §9, docs/LESSON_MODEL.md).
 * A lesson is data: an ordered list of editable blocks. Simulations are referenced by
 * id + version (and optionally an activity), never copied. Delivery mode (teacher-led or
 * self-paced) is configuration, not a separate copy of the lesson.
 */

const localizedText = z.object({ he: z.string().min(1), en: z.string().min(1) });

/** Every block records whether it was AI-generated and whether a person has reviewed it. */
const blockMeta = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  origin: z.enum(["ai-generated", "teacher", "library"]),
  reviewed: z.boolean(),
};

const explanationBlock = z.object({
  ...blockMeta,
  kind: z.literal("explanation"),
  title: localizedText,
  /** Paragraphs. */
  body: z.array(localizedText).min(1),
});

const questionBlock = z.object({
  ...blockMeta,
  kind: z.literal("question"),
  /** prediction: no right answer is revealed until after the related content. checkpoint: formative assessment. */
  purpose: z.enum(["prediction", "checkpoint"]),
  prompt: localizedText,
  options: z.array(z.object({ id: z.string(), text: localizedText })).min(2),
  correct: z.string(),
  feedback: z.object({ correct: localizedText, incorrect: localizedText }),
  /** Short explanation of the misconception the wrong options target. */
  misconception: localizedText.optional(),
});

const simulationBlock = z.object({
  ...blockMeta,
  kind: z.literal("simulation"),
  simulation: z.object({ id: z.string(), version: z.string() }),
  activityId: z.string().optional(),
  intro: localizedText,
});

const discussionBlock = z.object({
  ...blockMeta,
  kind: z.literal("discussion"),
  prompt: localizedText,
  teacherNote: localizedText.optional(),
});

const summaryBlock = z.object({
  ...blockMeta,
  kind: z.literal("summary"),
  points: z.array(localizedText).min(1),
  next: localizedText.optional(),
});

export const lessonBlockSchema = z.discriminatedUnion("kind", [
  explanationBlock,
  questionBlock,
  simulationBlock,
  discussionBlock,
  summaryBlock,
]);
export type LessonBlock = z.infer<typeof lessonBlockSchema>;

const pipelineStep = z.object({
  status: z.enum(["done", "pending", "skipped-demo"]),
  note: localizedText,
});

export const lessonSchema = z.object({
  lessonVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: localizedText,
  summary: localizedText,
  audience: localizedText,
  subject: z.string(),
  grades: z.object({ from: z.number().int(), to: z.number().int() }),
  durationMinutes: z.number().int().positive(),
  objectives: z.array(localizedText).min(1),
  keyConcepts: z.array(z.string()).min(1),
  misconceptions: z.array(localizedText),
  curriculum: z.object({ status: z.enum(["suggested", "verified"]), note: localizedText }),
  delivery: z.object({
    modes: z.array(z.enum(["self-paced", "teacher-led"])).min(1),
    selfPaced: z.object({ requireAnswerBeforeNext: z.boolean() }),
    teacherLed: z.object({ revealAnswersByTeacher: z.boolean() }),
  }),
  provenance: z.object({
    source: z.enum(["transcript", "teacher", "library"]),
    /** The transcript itself is never stored in the repository; only a fingerprint. */
    transcript: z
      .object({ label: localizedText, sha256: z.string().regex(/^[0-9a-f]{64}$/), characters: z.number().int() })
      .optional(),
    pipeline: z.object({
      rights: pipelineStep,
      privacy: pipelineStep,
      analysis: pipelineStep,
      outline: pipelineStep,
      generation: pipelineStep,
      teacherReview: pipelineStep,
      contentReview: pipelineStep,
    }),
  }),
  blocks: z.array(lessonBlockSchema).min(1),
});
export type Lesson = z.infer<typeof lessonSchema>;
