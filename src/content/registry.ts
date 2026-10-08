import { manifestSchema, type SimulationManifest } from "@/lib/simulation/manifest";
import { activitySchema, type Activity } from "@/lib/activity/schema";
import { eventMedia, lessonSchema, type Lesson } from "@/lib/lesson/schema";
import { topicMapSchema, type TopicMap } from "@/lib/topic-map/schema";
import { checkMapStructure } from "@/lib/topic-map/layout";
import { topics } from "./taxonomy";
import { mediaSchema, type Media } from "@/lib/media/schema";
import rawPeople from "./media/people.json";

import enzymeLab from "./simulations/enzyme-lab.json";
import geneticCode from "./simulations/genetic-code.json";
import ribosome3d from "./simulations/ribosome-3d.json";
import microscopeLens from "./simulations/microscope-lens.json";
import leeuwenhoek3d from "./simulations/leeuwenhoek-microscope-3d.json";

import enzymeTemperatureG10 from "./activities/enzyme-temperature-g10.json";
import enzymePhInquiryG12 from "./activities/enzyme-ph-inquiry-g12.json";
import mutationTypesG10 from "./activities/mutation-types-g10.json";
import virusVariantsG10 from "./activities/virus-variants-g10.json";
import microscopeDiscoveryG10 from "./activities/microscope-discovery-g10.json";

import virusesIntro from "./lessons/viruses-intro.json";
import cellDiscovery from "./lessons/cell-discovery.json";

import mapTheCell from "./topic-maps/the-cell.json";
import mapCellAndProteins from "./topic-maps/cell-and-proteins.json";
import mapEnzymes from "./topic-maps/enzymes.json";
import mapVirusesImmunity from "./topic-maps/viruses-immunity.json";

/**
 * Prototype content registry. In the next phase this moves to the database;
 * the validation below stays the same.
 */
const rawManifests: unknown[] = [enzymeLab, geneticCode, microscopeLens, leeuwenhoek3d, ribosome3d];
const rawActivities: unknown[] = [enzymeTemperatureG10, enzymePhInquiryG12, mutationTypesG10, virusVariantsG10, microscopeDiscoveryG10];
const rawLessons: unknown[] = [cellDiscovery, virusesIntro];

export const simulations: SimulationManifest[] = rawManifests.map((m) => manifestSchema.parse(m));
export const activities: Activity[] = rawActivities.map((a) => activitySchema.parse(a));
export const lessons: Lesson[] = rawLessons.map((l) => lessonSchema.parse(l));

export const media: Media[] = (rawPeople as unknown[]).map((m) => mediaSchema.parse(m));

export function getMedia(id: string): Media | undefined {
  return media.find((m) => m.id === id);
}

const rawTopicMaps: unknown[] = [mapTheCell, mapCellAndProteins, mapEnzymes, mapVirusesImmunity];
export const topicMaps: TopicMap[] = rawTopicMaps.map((m) => topicMapSchema.parse(m));

export function getTopicMap(topicId: string): TopicMap | undefined {
  return topicMaps.find((m) => m.topic === topicId);
}

/** A topic map must belong to a known topic, be well formed, and link only to available content. */
export function checkTopicMap(map: TopicMap): string[] {
  const problems = checkMapStructure(map.nodes, map.edges).map((p) => `${map.topic}: ${p}`);
  if (!topics.some((t) => t.id === map.topic)) problems.push(`${map.topic}: unknown topic`);
  for (const n of map.nodes) {
    if (!n.link) continue;
    if (n.link.kind === "lesson" && !getLesson(n.link.id)) problems.push(`${map.topic}: node ${n.id} links to unknown lesson ${n.link.id}`);
    if (n.link.kind === "simulation" && getSimulation(n.link.id)?.status !== "available") {
      problems.push(`${map.topic}: node ${n.link.id} is not an available simulation`);
    }
  }
  return problems;
}

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
    if (block.kind === "sequence" || block.kind === "match" || block.kind === "categorize") {
      const itemIds = block.kind === "match" ? block.pairs.map((p) => p.id) : block.items.map((i) => i.id);
      if (new Set(itemIds).size !== itemIds.length) problems.push(`block ${block.id}: duplicate item ids`);
    }
    if (block.kind === "match") {
      const rights = block.pairs.map((p) => p.right.he);
      if (new Set(rights).size !== rights.length) problems.push(`block ${block.id}: two pairs share the same right side`);
    }
    if (block.kind === "categorize") {
      const cats = new Set(block.categories.map((c) => c.id));
      for (const item of block.items) {
        if (!cats.has(item.category)) problems.push(`block ${block.id}: item ${item.id} has unknown category ${item.category}`);
      }
      for (const c of cats) {
        if (!block.items.some((i) => i.category === c)) problems.push(`block ${block.id}: category ${c} has no items`);
      }
    }
    if (block.kind === "timeline") {
      const stages = new Set(block.stages.map((s) => s.id));
      const tracks = new Set(block.tracks.map((t) => t.id));
      const eventIds = block.events.map((e) => e.id);
      if (new Set(eventIds).size !== eventIds.length) problems.push(`block ${block.id}: duplicate event ids`);
      block.events.forEach((e, i) => {
        if (!stages.has(e.stage)) problems.push(`block ${block.id}: event ${e.id} has unknown stage ${e.stage}`);
        if (!tracks.has(e.track)) problems.push(`block ${block.id}: event ${e.id} has unknown track ${e.track}`);
        if (i > 0 && e.year < block.events[i - 1].year) problems.push(`block ${block.id}: event ${e.id} is out of year order`);
      });
      for (const e of block.events) {
        if (e.simulation) {
          const sim = getSimulation(e.simulation.id);
          if (!sim || sim.status !== "available") problems.push(`block ${block.id}: event ${e.id} opens unavailable simulation ${e.simulation.id}`);
          else if (sim.version !== e.simulation.version) problems.push(`block ${block.id}: event ${e.id} references ${e.simulation.version}, library has ${sim.version}`);
        }
        for (const id of eventMedia(e)) if (!getMedia(id)) problems.push(`block ${block.id}: event ${e.id} uses unknown media ${id}`);
      }
      for (const s of stages) if (!block.events.some((e) => e.stage === s)) problems.push(`block ${block.id}: stage ${s} has no events`);
      // Stages must follow each other in time: a stage cannot start before the previous one starts.
      let lastStage = -1;
      const order = block.stages.map((s) => s.id);
      for (const e of block.events) {
        const idx = order.indexOf(e.stage);
        if (idx < lastStage) problems.push(`block ${block.id}: event ${e.id} goes back to an earlier stage`);
        lastStage = Math.max(lastStage, idx);
      }
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
