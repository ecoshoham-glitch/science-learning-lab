/**
 * Pure logic for the lesson game blocks (sequence, match, categorize).
 * No React here, so it can be unit tested and reused by other front ends.
 */

/** FNV-1a hash of a string: a stable seed, so every student sees the same shuffle of a block. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic shuffle. With two or more items the result never equals the input order,
 * so a sequence game never starts already solved.
 */
export function shuffle<T>(items: readonly T[], seedText: string): T[] {
  const out = items.slice();
  const rand = mulberry32(hashSeed(seedText));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift() as T);
  return out;
}

/** Moves the item at `from` one place up (-1) or down (+1). Out-of-range moves return the same order. */
export function move<T>(order: readonly T[], from: number, delta: -1 | 1): T[] {
  const to = from + delta;
  if (from < 0 || from >= order.length || to < 0 || to >= order.length) return order.slice();
  const out = order.slice();
  [out[from], out[to]] = [out[to], out[from]];
  return out;
}

export type Score = { correct: number; total: number; perItem: Record<string, boolean> };

/** Sequence: an item is correct when it sits at its position in the solution. */
export function scoreSequence(order: readonly string[], solution: readonly string[]): Score {
  const perItem: Record<string, boolean> = {};
  solution.forEach((id) => { perItem[id] = order.indexOf(id) === solution.indexOf(id); });
  return summarize(perItem);
}

/** Match: `answers` maps a left-item id to the pair id the student chose for it. */
export function scoreMatch(answers: Record<string, string | undefined>, pairIds: readonly string[]): Score {
  const perItem: Record<string, boolean> = {};
  pairIds.forEach((id) => { perItem[id] = answers[id] === id; });
  return summarize(perItem);
}

/** Categorize: `answers` maps an item id to the chosen category id. */
export function scoreCategorize(
  answers: Record<string, string | undefined>,
  items: readonly { id: string; category: string }[],
): Score {
  const perItem: Record<string, boolean> = {};
  items.forEach((it) => { perItem[it.id] = answers[it.id] === it.category; });
  return summarize(perItem);
}

function summarize(perItem: Record<string, boolean>): Score {
  const values = Object.values(perItem);
  return { correct: values.filter(Boolean).length, total: values.length, perItem };
}
