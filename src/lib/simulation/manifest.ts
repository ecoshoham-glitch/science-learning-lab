import { z } from "zod";

/**
 * Simulation manifest, version 1.
 * The manifest is the only thing the platform knows about a simulation's insides.
 * The library, search and activity layer read the manifest; they never read simulation code.
 * See docs/SIMULATION_MANIFEST.md.
 */

const localizedText = z.object({ he: z.string().min(1), en: z.string().min(1) });
export type LocalizedText = z.infer<typeof localizedText>;

const numberParameter = z.object({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
  kind: z.literal("number"),
  label: localizedText,
  unit: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  default: z.number(),
});

const observable = z.object({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
  type: z.enum(["number", "string", "boolean", "string[]"]),
  label: localizedText,
  unit: z.string().optional(),
});

export const manifestSchema = z
  .object({
    manifestVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    title: localizedText,
    summary: localizedText,
    subject: z.string(),
    concepts: z.array(z.string()).min(1),
    grades: z.object({ from: z.number().int().min(1).max(12), to: z.number().int().min(1).max(12) }),
    difficulty: z.enum(["intro", "intermediate", "advanced"]),
    interaction: z.string(),
    languages: z.array(z.enum(["he", "en"])).min(1),
    status: z.enum(["available", "planned"]),
    /** Package entry relative to the site root. Absent for planned simulations. */
    entry: z.string().startsWith("/sims/").optional(),
    protocol: z.object({ version: z.literal(1), capabilityLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]) }),
    parameters: z.array(numberParameter),
    observables: z.array(observable),
    events: z.array(z.string()),
    device: z.object({ minWidth: z.number().int(), touch: z.boolean(), webgl: z.boolean() }),
    accessibility: localizedText,
    license: z.object({ id: z.string(), holder: z.string(), source: z.string() }),
    scientificModel: z.object({
      description: localizedText,
      assumptions: z.array(localizedText),
      kind: z.enum(["simplified-educational", "realistic"]),
    }),
    validation: z.object({
      status: z.enum(["draft", "automated-tests-passed", "teacher-approved", "reviewed"]),
      notes: z.string().optional(),
    }),
  })
  .superRefine((m, ctx) => {
    if (m.grades.from > m.grades.to) ctx.addIssue({ code: "custom", message: "grades.from must be <= grades.to" });
    if (m.status === "available" && !m.entry) ctx.addIssue({ code: "custom", message: "available simulations need an entry" });
    for (const p of m.parameters) {
      if (!(p.min <= p.default && p.default <= p.max)) {
        ctx.addIssue({ code: "custom", message: `parameter ${p.id}: default outside [min, max]` });
      }
    }
    if (m.protocol.capabilityLevel < 3 && m.parameters.length > 0) {
      ctx.addIssue({ code: "custom", message: "parameters require capability level 3" });
    }
  });

export type SimulationManifest = z.infer<typeof manifestSchema>;
export type NumberParameter = SimulationManifest["parameters"][number];
