import { describe, expect, it } from "vitest";
import { arrowPath, checkMapStructure, popoverLeft, rows } from "@/lib/topic-map/layout";
import { checkTopicMap, topicMaps } from "@/content/registry";
import { topics } from "@/content/taxonomy";

const nodes = [
  { id: "a", rank: 0 }, { id: "b", rank: 1 }, { id: "c", rank: 1 }, { id: "d", rank: 2 },
];

describe("topic map layout", () => {
  it("groups nodes into rows by rank, keeping data order", () => {
    expect(rows(nodes).map((r) => r.map((n) => n.id))).toEqual([["a"], ["b", "c"], ["d"]]);
  });

  it("accepts arrows one row down or within a row", () => {
    expect(checkMapStructure(nodes, [{ from: "a", to: "b" }, { from: "b", to: "c" }, { from: "c", to: "d" }])).toEqual([]);
  });

  it("rejects skipped or upward arrows, unknown or unconnected nodes, duplicates and crowded rows", () => {
    const p = checkMapStructure(
      [...nodes, { id: "e", rank: 1 }, { id: "f", rank: 1 }],
      [{ from: "a", to: "d" }, { from: "d", to: "a" }, { from: "a", to: "zz" }, { from: "b", to: "c" }, { from: "c", to: "b" }],
    ).join(" | ");
    expect(p).toContain("a->d must go one row down");
    expect(p).toContain("d->a is duplicated or reversed");
    expect(p).toContain("unknown node");
    expect(p).toContain("c->b is duplicated or reversed");
    expect(p).toContain("row 1 has 4 nodes");
    expect(p).toContain("node e is not connected");
  });

  it("draws down-arrows from bottom centre to top centre, and side arrows between facing sides", () => {
    const top = { x: 0, y: 0, width: 100, height: 40 };
    const below = { x: 200, y: 100, width: 100, height: 40 };
    expect(arrowPath(top, below, 0).d).toBe("M 50 40 C 50 70, 250 70, 250 100");
    const right = { x: 200, y: 0, width: 100, height: 40 };
    expect(arrowPath(top, right, 0).d).toBe("M 100 20 L 200 20");
    expect(arrowPath(right, top, 0).d).toBe("M 200 20 L 100 20");
  });

  it("keeps the expansion inside the chart", () => {
    expect(popoverLeft({ x: 0, y: 0, width: 50, height: 20 }, 300, 800)).toBe(8);
    expect(popoverLeft({ x: 760, y: 0, width: 40, height: 20 }, 300, 800)).toBe(492);
    expect(popoverLeft({ x: 350, y: 0, width: 100, height: 20 }, 300, 800)).toBe(250);
  });
});

describe("topic map content", () => {
  it("every topic starts with a valid map that links only to available lessons and simulations", () => {
    for (const t of topics) expect(topicMaps.some((m) => m.topic === t.id), t.id).toBe(true);
    for (const m of topicMaps) expect(checkTopicMap(m), m.topic).toEqual([]);
  });

  it("detects a map that links to a planned simulation or an unknown lesson", () => {
    const m = structuredClone(topicMaps[0]);
    m.nodes[0].link = { kind: "simulation", id: "ribosome-3d" };
    m.nodes[1].link = { kind: "lesson", id: "nope" };
    const p = checkTopicMap(m).join(" | ");
    expect(p).toContain("ribosome-3d is not an available simulation");
    expect(p).toContain("unknown lesson nope");
  });

  it("AI-generated maps stay marked as not reviewed", () => {
    for (const m of topicMaps.filter((x) => x.origin === "ai-generated")) expect(m.reviewed).toBe(false);
  });
});
