import { manifestSchema, type SimulationManifest } from "@/lib/simulation/manifest";
import { activitySchema, type Activity } from "@/lib/activity/schema";
import { lessonSchema, type Lesson } from "@/lib/lesson/schema";

import enzymeLab from "./simulations/enzyme-lab.json";
import geneticCode from "./simulations/genetic-code.json";
import ribosome3d from "./simulations/ribosome-3d.json";

import enzymeTemperatureG10 from "./activities/enzyme-temperature-g10.json";
import enzymePhInquiryG12 from "./activities/enzyme-ph-inquiry-g12.json";
import mutationTypesG10 from "./activities/mutation-types-g10.json";
import virusVariantsG10 from "./activities/virus-variants-g10.json";

import virusesIntro from "./lessons/viruses-intro.json";

/**
 * Prototype content registry. In the next phase this moves to the database;
 * the validation below stays the same.
 */
const rawManifests: unknown[] = [enzymeLab, geneticCode, ribosome3d];
const rawActivities: unknown[] = [enzymeTemperatureG10, enzymePhInquiryG12, mutationTypesG10, virusVariantsG10];
const rawLessons: unknown[] = [virusesIntro];

export const simulations: SimulationManifest[] = rawManifests.map((m) => manifestSchema.parse(m));
export const activities: Activity[] = rawActivities.map((a) => activitySchema.parse(a));
export const lessons: Lesson[] = rawLessons.map((l) => lessonSchema.parse(l));

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getActivity(id: string): Activity | undefined {
  return activities.find((a) => a.id === id);
}

export function getSimulation(id: string): SimulationManifest | undefined {
  return simulations.find((s) => s.id === id);
}

export function getActivitiesFor(simulationId: string): Activity[] {
  return activities.filter((a) => a.simulation.id === simulationId);
}

/**
 * An activity may use only what its simulation version declares (section 8.3).
 * Returns a list of problems; empty means compatible.
 */
export function checkActivityCompatibility(activity: Activity, manifest: SimulationManifest | undefined): string[] {
  if (!manifest) return [`simulation ${activity.simulation.id} not found`];
  const problems: string[] = [];
  if (manifest.version !== activity.simulation.version) {
    problems.push(`activity targets ${activity.simulation.version}, library has ${manifest.version}`);
  }
  const params = new Map(manifest.parameters.map((p) => [p.id, p]));
  const observables = new Set(manifest.observables.map((o) => o.id));
  const needsLevel3 = Object.keys(activity.config.params).length > 0 || activity.config.lockedParams.length > 0;
  if (needsLevel3 && manifest.protocol.capabilityLevel < 3) problems.push("activity needs capability level 3");

  for (const [id, value] of Object.entries(activity.config.params)) {
    const p = params.get(id);
    if (!p) problems.push(`unknown parameter ${id}`);
    else if (value < p.min || value > p.max) problems.push(`parameter ${id}=${value} outside [${p.min}, ${p.max}]`);
  }
  for (const id of activity.config.lockedParams) if (!params.has(id)) problems.push(`cannot lock unknown parameter ${id}`);
  for (const step of activity.steps) {
    if (step.kind !== "task") continue;
    for (const c of step.conditions) if (!observables.has(c.observable)) problems.push(`unknown observable ${c.observable}`);
  }
  return problems;
}

/**
 * A lesson references library items; it never copies them (section 9.1).
 * Every simulation block must point to an available simulation at the exact version,
 * and its activity (if any) must belong to that simulation version and be compatible with it.
 */
export function checkLessonReferences(lesson: Lesson): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const block of lesson.blocks) {
    if (ids.has(block.id)) problems.push(`duplicate block id ${block.id}`);
    ids.add(block.id);
    if (block.kind === "question" && !block.options.some((o) => o.id === block.correct)) {
      problems.push(`block ${block.id}: correct answer ${block.correct} is not an option`);
    }
    if (block.kind !== "simulation") continue;
    const sim = getSimulation(block.simulation.id);
    if (!sim || sim.status !== "available") {
      problems.push(`block ${block.id}: simulation ${block.simulation.id} not available`);
      continue;
    }
    if (sim.version !== block.simulation.version) {
      problems.push(`block ${block.id}: references ${block.simulation.version}, library has ${sim.version}`);
    }
    if (block.activityId) {
      const activity = getActivity(block.activityId);
      if (!activity) problems.push(`block ${block.id}: activity ${block.activityId} not found`);
      else {
        if (activity.simulation.id !== sim.id || activity.simulation.version !== block.simulation.version) {
          problems.push(`block ${block.id}: activity ${activity.id} belongs to another simulation version`);
        }
        problems.push(...checkActivityCompatibility(activity, sim).map((p) => `block ${block.id}: ${p}`));
      }
    }
  }
  return problems;
}
