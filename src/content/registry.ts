import { manifestSchema, type SimulationManifest } from "@/lib/simulation/manifest";
import { activitySchema, type Activity } from "@/lib/activity/schema";

import enzymeLab from "./simulations/enzyme-lab.json";
import geneticCode from "./simulations/genetic-code.json";
import ribosome3d from "./simulations/ribosome-3d.json";

import enzymeTemperatureG10 from "./activities/enzyme-temperature-g10.json";
import enzymePhInquiryG12 from "./activities/enzyme-ph-inquiry-g12.json";
import mutationTypesG10 from "./activities/mutation-types-g10.json";

/**
 * Prototype content registry. In the next phase this moves to the database;
 * the validation below stays the same.
 */
const rawManifests: unknown[] = [enzymeLab, geneticCode, ribosome3d];
const rawActivities: unknown[] = [enzymeTemperatureG10, enzymePhInquiryG12, mutationTypesG10];

export const simulations: SimulationManifest[] = rawManifests.map((m) => manifestSchema.parse(m));
export const activities: Activity[] = rawActivities.map((a) => activitySchema.parse(a));

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
