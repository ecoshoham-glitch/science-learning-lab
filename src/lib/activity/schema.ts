import { z } from "zod";

/**
 * Activity definition, version 1. An activity is data: it references one simulation version
 * and adds the pedagogy on top. It contains no simulation code.
 */

const localizedText = z.object({ he: z.string().min(1), en: z.string().min(1) });

/** A condition evaluated against observables reported by the simulation. */
export const conditionSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("gte"), observable: z.string(), value: z.number() }),
  z.object({ op: z.literal("between"), observable: z.string(), min: z.number(), max: z.number() }),
  z.object({ op: z.literal("includesAll"), observable: z.string(), values: z.array(z.string()).min(1) }),
]);
export type Condition = z.infer<typeof conditionSchema>;

const choiceStep = z.object({
  kind: z.literal("choice"),
  prompt: localizedText,
  options: z.array(z.object({ id: z.string(), text: localizedText })).min(2),
  correct: z.string(),
  feedback: z.object({ correct: localizedText, incorrect: localizedText }),
});

const taskStep = z.object({
  kind: z.literal("task"),
  prompt: localizedText,
  hint: localizedText.optional(),
  /** All conditions must hold for the task to be complete. */
  conditions: z.array(conditionSchema).min(1),
  /** Optional progress shown to the student, one line per condition. */
  checklist: z.array(localizedText).optional(),
  success: localizedText,
});

const reflectStep = z.object({
  kind: z.literal("reflect"),
  prompt: localizedText,
  sampleAnswer: localizedText,
});

export const stepSchema = z.discriminatedUnion("kind", [choiceStep, taskStep, reflectStep]);
export type ActivityStep = z.infer<typeof stepSchema>;

export const activitySchema = z.object({
  activityVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  simulation: z.object({ id: z.string(), version: z.string() }),
  title: localizedText,
  audience: localizedText,
  objectives: z.array(localizedText).min(1),
  /** Curriculum mapping is a suggestion until verified against official documents. */
  curriculum: z.object({ status: z.enum(["suggested", "verified"]), note: localizedText }),
  config: z.object({
    params: z.record(z.string(), z.number()),
    lockedParams: z.array(z.string()),
  }),
  steps: z.array(stepSchema).min(1),
});
export type Activity = z.infer<typeof activitySchema>;
