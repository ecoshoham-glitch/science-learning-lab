/**
 * Pure helpers for the lesson `timeline` block: gaps between events, stage ranges and the
 * year-to-position scale of the overview strip. No React here, so it can be unit tested.
 */

export type TimelineEventLike = { id: string; year: number; stage: string; track: string };

/** Long silences between consecutive events (at least `minYears`), keyed by the later event. */
export function timelineGaps(events: readonly TimelineEventLike[], minYears: number): Record<string, number> {
  const gaps: Record<string, number> = {};
  for (let i = 1; i < events.length; i++) {
    const years = events[i].year - events[i - 1].year;
    if (years >= minYears) gaps[events[i].id] = years;
  }
  return gaps;
}

/** First and last year of each stage, in stage order. Stages without events are left out. */
export function stageRanges(
  stageIds: readonly string[],
  events: readonly TimelineEventLike[],
): { id: string; index: number; from: number; to: number }[] {
  const out: { id: string; index: number; from: number; to: number }[] = [];
  stageIds.forEach((id, index) => {
    const years = events.filter((e) => e.stage === id).map((e) => e.year);
    if (years.length) out.push({ id, index, from: Math.min(...years), to: Math.max(...years) });
  });
  return out;
}

/** Linear position of a year on a strip of `width` units between `from` and `to` (clamped). */
export function scaleYear(year: number, from: number, to: number, width: number): number {
  if (to <= from) throw new RangeError("timeline range must be increasing");
  const t = (year - from) / (to - from);
  return Math.min(width, Math.max(0, t * width));
}

/** Round range for the overview strip: whole half-centuries around the events. */
export function overviewRange(events: readonly TimelineEventLike[]): { from: number; to: number } {
  const years = events.map((e) => e.year);
  return { from: Math.floor(Math.min(...years) / 50) * 50, to: Math.ceil(Math.max(...years) / 50) * 50 };
}
