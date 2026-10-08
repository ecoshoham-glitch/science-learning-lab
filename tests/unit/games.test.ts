import { describe, expect, it } from "vitest";
import { hashSeed, move, scoreCategorize, scoreMatch, scoreSequence, shuffle } from "@/lib/lesson/games";

describe("deterministic shuffle", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("is stable for the same seed and keeps every item", () => {
    expect(shuffle(items, "timeline")).toEqual(shuffle(items, "timeline"));
    expect([...shuffle(items, "timeline")].sort()).toEqual(items);
    expect(hashSeed("x")).toBe(hashSeed("x"));
  });

  it("never returns an already-solved order", () => {
    for (let i = 0; i < 500; i++) {
      expect(shuffle(["a", "b"], `seed-${i}`)).not.toEqual(["a", "b"]);
      expect(shuffle(items, `seed-${i}`)).not.toEqual(items);
    }
  });

  it("does not modify its input and handles tiny lists", () => {
    const copy = items.slice();
    shuffle(items, "s");
    expect(items).toEqual(copy);
    expect(shuffle([], "s")).toEqual([]);
    expect(shuffle(["only"], "s")).toEqual(["only"]);
  });
});

describe("move", () => {
  it("swaps with the neighbour and ignores moves past the edges", () => {
    expect(move(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(move(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(move(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(move(["a", "b", "c"], 2, 1)).toEqual(["a", "b", "c"]);
  });
});

describe("scoring", () => {
  it("sequence: counts items in their solution position", () => {
    const s = scoreSequence(["b", "a", "c"], ["a", "b", "c"]);
    expect(s).toMatchObject({ correct: 1, total: 3, perItem: { a: false, b: false, c: true } });
    expect(scoreSequence(["a", "b", "c"], ["a", "b", "c"]).correct).toBe(3);
  });

  it("match: a left item is correct only when paired with its own right side", () => {
    const s = scoreMatch({ x: "x", y: "z", z: undefined }, ["x", "y", "z"]);
    expect(s).toMatchObject({ correct: 1, total: 3 });
  });

  it("categorize: unanswered items count as wrong", () => {
    const items = [{ id: "p", category: "true" }, { id: "q", category: "false" }, { id: "r", category: "false" }];
    expect(scoreCategorize({ p: "true", q: "true" }, items)).toMatchObject({ correct: 1, total: 3, perItem: { p: true, q: false, r: false } });
  });
});
