/**
 * Pure helpers for topic maps: rows, structural checks and arrow geometry.
 * No React here, so it can be unit tested.
 */

type NodeLike = { id: string; rank: number };
type EdgeLike = { from: string; to: string };
export type Rect = { x: number; y: number; width: number; height: number };

/** Nodes grouped into rows by rank, keeping data order within a row. Empty ranks are skipped. */
export function rows<N extends NodeLike>(nodes: readonly N[]): N[][] {
  const ranks = [...new Set(nodes.map((n) => n.rank))].sort((a, b) => a - b);
  return ranks.map((r) => nodes.filter((n) => n.rank === r));
}

/** Structural problems: unknown ids, duplicate nodes/edges, arrows that skip or climb rows, rows too wide. */
export function checkMapStructure(nodes: readonly NodeLike[], edges: readonly EdgeLike[], maxPerRow = 3): string[] {
  const problems: string[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (byId.size !== nodes.length) problems.push("duplicate node ids");
  const seen = new Set<string>();
  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) {
      problems.push(`edge ${e.from}->${e.to} uses an unknown node`);
      continue;
    }
    if (e.from === e.to) problems.push(`edge ${e.from}->${e.to} points to itself`);
    const key = `${e.from}->${e.to}`;
    if (seen.has(key) || seen.has(`${e.to}->${e.from}`)) problems.push(`edge ${key} is duplicated or reversed`);
    seen.add(key);
    const step = b.rank - a.rank;
    if (step !== 0 && step !== 1) problems.push(`edge ${key} must go one row down or stay in its row (goes ${step})`);
  }
  for (const row of rows(nodes)) if (row.length > maxPerRow) problems.push(`row ${row[0].rank} has ${row.length} nodes (max ${maxPerRow})`);
  const linked = new Set(edges.flatMap((e) => [e.from, e.to]));
  for (const n of nodes) if (!linked.has(n.id)) problems.push(`node ${n.id} is not connected`);
  return problems;
}

/**
 * SVG path for an arrow between two boxes (coordinates relative to the chart).
 * Down: bottom centre to top centre, a smooth S-curve. Same row: facing sides, a straight line.
 * Returns the path and the label position.
 */
export function arrowPath(from: Rect, to: Rect, gap = 6): { d: string; labelX: number; labelY: number; sameRow: boolean; span: number } {
  const sameRow = Math.abs(from.y - to.y) < Math.min(from.height, to.height) / 2;
  if (sameRow) {
    const y = from.y + from.height / 2;
    const leftToRight = from.x < to.x;
    const x1 = leftToRight ? from.x + from.width + gap : from.x - gap;
    const x2 = leftToRight ? to.x - gap : to.x + to.width + gap;
    const y2 = to.y + to.height / 2;
    // The label sits in the gap between the two boxes, just above the arrow (`span` = room available).
    return { d: `M ${x1} ${y} L ${x2} ${y2}`, labelX: (x1 + x2) / 2, labelY: y - 6, sameRow: true, span: Math.abs(x2 - x1) };
  }
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height + gap;
  const x2 = to.x + to.width / 2;
  const y2 = to.y - gap;
  const my = (y1 + y2) / 2;
  return { d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`, labelX: (x1 + x2) / 2, labelY: my, sameRow: false, span: Infinity };
}

/** Horizontal position for a popover under a node, kept inside the chart. */
export function popoverLeft(node: Rect, popoverWidth: number, chartWidth: number, margin = 8): number {
  const centred = node.x + node.width / 2 - popoverWidth / 2;
  return Math.max(margin, Math.min(chartWidth - popoverWidth - margin, centred));
}
