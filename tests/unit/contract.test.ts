import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { activities, checkActivityCompatibility, getSimulation, simulations } from "@/content/registry";
import { concepts, interactions, subjects } from "@/content/taxonomy";
import { evaluateCondition } from "@/lib/activity/evaluate";
import { createRateLimiter, parseSimMessage } from "@/lib/simulation/protocol";
import { manifestSchema } from "@/lib/simulation/manifest";

describe("simulation manifests", () => {
  it("all manifests are valid and ids are unique", () => {
    expect(new Set(simulations.map((s) => s.id)).size).toBe(simulations.length);
  });

  it("every available simulation has its package files on disk", () => {
    for (const s of simulations.filter((x) => x.status === "available")) {
      const entry = path.join(process.cwd(), "public", s.entry!);
      expect(existsSync(entry), s.entry).toBe(true);
      expect(existsSync(path.join(path.dirname(entry), "sll-bridge.js"))).toBe(true);
      expect(s.entry).toContain(`/${s.id}/${s.version}/`);
    }
  });

  it("uses only taxonomy terms that exist", () => {
    for (const s of simulations) {
      expect(subjects[s.subject], s.subject).toBeDefined();
      expect(interactions[s.interaction], s.interaction).toBeDefined();
      for (const c of s.concepts) expect(concepts[c], c).toBeDefined();
    }
  });

  it("rejects a manifest whose default lies outside its range", () => {
    const bad = structuredClone(getSimulation("enzyme-lab")!);
    bad.parameters[0].default = 500;
    expect(manifestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("activities", () => {
  it("every activity is compatible with the simulation version it references", () => {
    for (const a of activities) expect(checkActivityCompatibility(a, getSimulation(a.simulation.id)), a.id).toEqual([]);
  });

  it("one simulation can carry several activities", () => {
    expect(activities.filter((a) => a.simulation.id === "enzyme-lab").length).toBeGreaterThanOrEqual(2);
  });

  it("detects an activity that relies on an observable the simulation does not declare", () => {
    const a = structuredClone(activities[0]);
    const task = a.steps.find((s) => s.kind === "task");
    if (task?.kind === "task") task.conditions.push({ op: "gte", observable: "doesNotExist", value: 1 });
    expect(checkActivityCompatibility(a, getSimulation(a.simulation.id))).toContain("unknown observable doesNotExist");
  });

  it("curriculum mappings are labelled as suggestions until verified", () => {
    for (const a of activities) expect(a.curriculum.status).toBe("suggested");
  });
});

describe("activity conditions", () => {
  it("evaluates numbers, ranges and lists", () => {
    expect(evaluateCondition({ op: "gte", observable: "n", value: 5 }, { n: 5 })).toBe(true);
    expect(evaluateCondition({ op: "between", observable: "t", min: 33, max: 41 }, { t: 37 })).toBe(true);
    expect(evaluateCondition({ op: "between", observable: "t", min: 33, max: 41 }, { t: 45 })).toBe(false);
    expect(evaluateCondition({ op: "includesAll", observable: "f", values: ["a", "b"] }, { f: ["b", "a", "c"] })).toBe(true);
  });

  it("never passes on missing or wrong-typed values", () => {
    expect(evaluateCondition({ op: "gte", observable: "n", value: 1 }, {})).toBe(false);
    expect(evaluateCondition({ op: "gte", observable: "n", value: 1 }, { n: "9" })).toBe(false);
    expect(evaluateCondition({ op: "includesAll", observable: "f", values: ["a"] }, { f: "a" })).toBe(false);
  });
});

describe("protocol messages from simulations", () => {
  it("accepts valid messages", () => {
    expect(parseSimMessage({ sll: 1, type: "observables", payload: { values: { n: 3, f: ["a"] } } })).not.toBeNull();
    expect(parseSimMessage({ sll: 1, type: "ready", payload: { simId: "x", version: "1.0.0", capabilityLevel: 3 } })).not.toBeNull();
  });

  it("rejects malformed or unknown messages", () => {
    expect(parseSimMessage(null)).toBeNull();
    expect(parseSimMessage("hello")).toBeNull();
    expect(parseSimMessage({ sll: 2, type: "ready", payload: {} })).toBeNull();
    expect(parseSimMessage({ sll: 1, type: "navigate", payload: { url: "https://evil.example" } })).toBeNull();
    expect(parseSimMessage({ sll: 1, type: "resize", payload: { height: 1e9 } })).toBeNull();
    expect(parseSimMessage({ sll: 1, type: "observables", payload: { values: { n: { nested: true } } } })).toBeNull();
  });

  it("rate limiter blocks floods", () => {
    const allow = createRateLimiter(10);
    let allowed = 0;
    for (let i = 0; i < 100; i++) if (allow()) allowed++;
    expect(allowed).toBeLessThanOrEqual(11);
  });
});

describe("lessons", () => {
  it("every lesson references available simulations and compatible activities", async () => {
    const { lessons, checkLessonReferences } = await import("@/content/registry");
    expect(lessons.length).toBeGreaterThan(0);
    for (const l of lessons) expect(checkLessonReferences(l), l.id).toEqual([]);
  });

  it("detects a lesson that points to a simulation version the library does not have", async () => {
    const { lessons, checkLessonReferences } = await import("@/content/registry");
    const l = structuredClone(lessons[0]);
    const block = l.blocks.find((b) => b.kind === "simulation");
    if (block?.kind === "simulation") block.simulation.version = "9.9.9";
    expect(checkLessonReferences(l).join(" ")).toContain("library has 1.0.0");
  });

  it("transcript-based lessons store a fingerprint, never the transcript, and stay unreviewed until a person reviews them", async () => {
    const { lessons } = await import("@/content/registry");
    for (const l of lessons.filter((x) => x.provenance.source === "transcript")) {
      expect(l.provenance.transcript?.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.stringify(l)).not.toContain("transcriptText");
      expect(l.provenance.pipeline.privacy.status).toBe("done");
      const aiBlocks = l.blocks.filter((b) => b.origin === "ai-generated");
      if (l.provenance.pipeline.teacherReview.status !== "done") expect(aiBlocks.every((b) => !b.reviewed)).toBe(true);
    }
  });

  it("lesson concepts exist in the taxonomy", async () => {
    const { lessons } = await import("@/content/registry");
    for (const l of lessons) for (const c of l.keyConcepts) expect(concepts[c], c).toBeDefined();
  });
});

describe("activity checklists", () => {
  it("each checklist line corresponds to exactly one condition", () => {
    for (const a of activities)
      for (const s of a.steps)
        if (s.kind === "task" && s.checklist) expect(s.checklist.length, `${a.id}`).toBe(s.conditions.length);
  });
});
