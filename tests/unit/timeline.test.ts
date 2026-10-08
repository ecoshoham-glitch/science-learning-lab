import { describe, expect, it } from "vitest";
import { overviewRange, scaleYear, stageRanges, timelineGaps } from "@/lib/lesson/timeline";

const events = [
  { id: "a", year: 1590, stage: "s1", track: "tools" },
  { id: "b", year: 1665, stage: "s2", track: "ideas" },
  { id: "c", year: 1676, stage: "s2", track: "ideas" },
  { id: "d", year: 1830, stage: "s3", track: "tools" },
];

describe("timeline helpers", () => {
  it("finds long silences between events", () => {
    expect(timelineGaps(events, 40)).toEqual({ b: 75, d: 154 });
    expect(timelineGaps(events, 200)).toEqual({});
  });

  it("computes each stage's first and last year in stage order, skipping empty stages", () => {
    expect(stageRanges(["s1", "s2", "empty", "s3"], events)).toEqual([
      { id: "s1", index: 0, from: 1590, to: 1590 },
      { id: "s2", index: 1, from: 1665, to: 1676 },
      { id: "s3", index: 3, from: 1830, to: 1830 },
    ]);
  });

  it("scales years linearly and clamps; rejects an empty range", () => {
    expect(scaleYear(1700, 1600, 1800, 1000)).toBe(500);
    expect(scaleYear(1500, 1600, 1800, 1000)).toBe(0);
    expect(scaleYear(1900, 1600, 1800, 1000)).toBe(1000);
    expect(() => scaleYear(1700, 1800, 1800, 1000)).toThrow(RangeError);
  });

  it("rounds the overview to half-centuries around the events", () => {
    expect(overviewRange(events)).toEqual({ from: 1550, to: 1850 });
  });
});
