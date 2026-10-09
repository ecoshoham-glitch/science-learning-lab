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

/*
 * Game blocks. Each is a short, scored interaction with immediate feedback. Items are shuffled
 * deterministically (by block id) when shown; the data always holds the solution.
 */
const gameFeedback = z.object({ correct: localizedText, incorrect: localizedText });
const itemId = z.string().regex(/^[a-z0-9-]+$/);

/** Put items in order. The solution is the order of `items` in the data. */
const sequenceBlock = z.object({
  ...blockMeta,
  kind: z.literal("sequence"),
  title: localizedText,
  prompt: localizedText,
  items: z.array(z.object({ id: itemId, text: localizedText, detail: localizedText.optional() })).min(3),
  feedback: gameFeedback,
});

/** Match each left item with its right item. Each pair in the data is a correct match. */
const matchBlock = z.object({
  ...blockMeta,
  kind: z.literal("match"),
  title: localizedText,
  prompt: localizedText,
  pairs: z.array(z.object({ id: itemId, left: localizedText, right: localizedText })).min(2),
  feedback: gameFeedback,
});

/** Sort items into categories (for example true / false). */
const categorizeBlock = z.object({
  ...blockMeta,
  kind: z.literal("categorize"),
  title: localizedText,
  prompt: localizedText,
  categories: z.array(z.object({ id: itemId, label: localizedText })).min(2),
  items: z
    .array(z.object({ id: itemId, text: localizedText, category: itemId, explanation: localizedText.optional() }))
    .min(2),
  feedback: gameFeedback,
});

/**
 * An integrative timeline: events grouped into stages of progress and into parallel tracks
 * (for example tools vs ideas), so students see how one drives the other. Events are in year order.
 * `fromSource: false` marks content added beyond the source material, for the teacher's review.
 */
const timelineBlock = z.object({
  ...blockMeta,
  kind: z.literal("timeline"),
  title: localizedText,
  intro: localizedText,
  stages: z.array(z.object({ id: itemId, title: localizedText })).min(1),
  tracks: z.array(z.object({ id: itemId, label: localizedText })).min(1),
  events: z
    .array(
      z.object({
        id: itemId,
        year: z.number().int(),
        /** Shown instead of the bare year when the date is approximate (e.g. "~1590"). */
        yearLabel: localizedText.optional(),
        stage: itemId,
        track: itemId,
        title: localizedText,
        text: localizedText,
        /** Optional picture from the media library (e.g. a portrait of the person who made the discovery). */
        media: z.union([itemId, z.array(itemId).min(1).max(3)]).optional(),
        /** Optional library simulation (e.g. a 3D model) the card can open in place. */
        simulation: z.object({ id: itemId, version: z.string() }).optional(),
        fromSource: z.boolean(),
      }),
    )
    .min(2),
});

/** Media ids of a timeline event, whether written as one id or a list. */
export function eventMedia(e: { media?: string | string[] }): string[] {
  return e.media === undefined ? [] : Array.isArray(e.media) ? e.media : [e.media];
}

/**
 * Worksheet: students fill a table. Each row has a given cue (e.g. a year) and one cell per column.
 * `accept` (short answers such as names) is checked automatically and tolerantly; otherwise the
 * student compares with the model `answer` after trying (self-assessment).
 */
const fillTableBlock = z.object({
  ...blockMeta,
  kind: z.literal("fill-table"),
  title: localizedText,
  prompt: localizedText,
  columns: z.array(z.object({ id: itemId, label: localizedText, long: z.boolean() })).min(1).max(4),
  rows: z
    .array(
      z.object({
        id: itemId,
        cue: localizedText,
        hint: localizedText.optional(),
        cells: z.record(
          itemId,
          z.object({ answer: localizedText, accept: z.array(z.string().min(2)).optional() }),
        ),
      }),
    )
    .min(1),
});

/** An open question with no single right answer (e.g. "what was new to you?"). Not graded. */
const reflectionBlock = z.object({
  ...blockMeta,
  kind: z.literal("reflection"),
  title: localizedText,
  prompt: localizedText,
  starters: z.array(localizedText).max(5),
  minChars: z.number().int().min(1).max(500),
  teacherNote: localizedText.optional(),
});

export const GAME_KINDS = ["sequence", "match", "categorize"] as const;

export const lessonBlockSchema = z.discriminatedUnion("kind", [
  explanationBlock,
  questionBlock,
  simulationBlock,
  discussionBlock,
  summaryBlock,
  sequenceBlock,
  matchBlock,
  categorizeBlock,
  timelineBlock,
  fillTableBlock,
  reflectionBlock,
]);
export type LessonBlock = z.infer<typeof lessonBlockSchema>;

const pipelineStep = z.object({
  status: z.enum(["done", "pending", "skipped-demo"]),
  note: localizedText,
});

export const lessonSchema = z.object({
  lessonVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** "assignment": a short task for students (shown with its own badge); default "lesson". */
  type: z.enum(["lesson", "assignment"]).default("lesson"),
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
