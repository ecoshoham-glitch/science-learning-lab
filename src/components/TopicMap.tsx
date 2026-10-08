"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { TopicMap as TopicMapData } from "@/lib/topic-map/schema";
import { arrowPath, popoverLeft, rows, type Rect } from "@/lib/topic-map/layout";

type Locale = "he" | "en";
type Active = { id: string; pinned: boolean } | null;

const POPOVER_MAX = 360;
const WIDE = 560; // below this width the expansion opens under the chart instead of floating

/**
 * Flowchart of a topic's written content. Hovering or focusing a box previews its expansion;
 * clicking (or tapping) keeps it open. Escape or a click elsewhere closes it.
 * Arrows are decorative: each box also states in text which ideas it leads to.
 */
export function TopicMap({ map, locale, titles }: { map: TopicMapData; locale: Locale; titles: Record<string, string> }) {
  const t = useTranslations("subjects.map");
  const chartRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const closeTimer = useRef<number | null>(null);
  const [geo, setGeo] = useState<{ width: number; height: number; rects: Record<string, Rect> } | null>(null);
  const [active, setActive] = useState<Active>(null);

  const grid = useMemo(() => rows(map.nodes), [map.nodes]);
  const byId = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const ids = (suffix: string) => `map-${map.topic}-${suffix}`;

  // Measure the boxes so arrows can be drawn between them; re-measure whenever the chart resizes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || typeof ResizeObserver !== "function") return;
    const measure = () => {
      const base = chart.getBoundingClientRect();
      const rects: Record<string, Rect> = {};
      nodeRefs.current.forEach((el, id) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        rects[id] = { x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height };
      });
      setGeo({ width: base.width, height: base.height, rects });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(chart);
    return () => ro.disconnect();
  }, []);

  // A pinned expansion closes on a click outside the chart and the expansion.
  useEffect(() => {
    if (!active?.pinned) return;
    const onDown = (e: globalThis.PointerEvent) => {
      const target = e.target as Node;
      if (chartRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active?.pinned]);

  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActive((a) => (a?.pinned ? a : null)), 220);
  }, []);
  useEffect(() => () => { if (closeTimer.current !== null) window.clearTimeout(closeTimer.current); }, []);

  const preview = (id: string) => {
    cancelClose();
    setActive((a) => (a?.pinned ? a : { id, pinned: false }));
  };
  const onNodePointerEnter = (id: string) => (e: PointerEvent) => { if (e.pointerType === "mouse") preview(id); };
  const onNodePointerLeave = (e: PointerEvent) => { if (e.pointerType === "mouse") scheduleClose(); };
  const onNodeClick = (id: string) => {
    cancelClose();
    setActive((a) => (a?.id === id && a.pinned ? null : { id, pinned: true }));
  };
  const onNodeBlur = (e: FocusEvent) => {
    if (popRef.current?.contains(e.relatedTarget as Node | null)) return;
    setActive((a) => (a?.pinned ? a : null));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !active) return;
    const id = active.id;
    setActive(null);
    nodeRefs.current.get(id)?.focus();
  };

  const activeNode = active ? byId.get(active.id) : undefined;
  const wide = (geo?.width ?? 0) >= WIDE;
  const popWidth = Math.min(POPOVER_MAX, (geo?.width ?? POPOVER_MAX) - 16);
  const activeRect = active && geo ? geo.rects[active.id] : undefined;
  const linkHref = (n: NonNullable<typeof activeNode>) => (n.link ? `/${n.link.kind === "lesson" ? "lessons" : "simulations"}/${n.link.id}` : null);

  const expansion = activeNode && (
    <div
      ref={popRef}
      id={ids("expansion")}
      role="region"
      aria-labelledby={ids("expansion-title")}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") cancelClose(); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") scheduleClose(); }}
      onKeyDown={onKeyDown}
      data-testid="map-expansion"
      className={
        "z-20 bg-surface border-2 border-leaf rounded-2xl p-4 shadow-[0_10px_30px_rgba(20,37,43,0.18)] grid gap-2 text-[0.98rem] " +
        (wide && activeRect ? "absolute" : "mt-3")
      }
      style={wide && activeRect ? { top: activeRect.y + activeRect.height + 10, left: popoverLeft(activeRect, popWidth, geo!.width), width: popWidth } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <p id={ids("expansion-title")} className="m-0 font-semibold text-leaf-dark">{activeNode.title[locale]}</p>
        {active?.pinned && (
          <button
            type="button"
            onClick={() => { const id = activeNode.id; setActive(null); nodeRefs.current.get(id)?.focus(); }}
            aria-label={t("close")}
            className="shrink-0 w-9 h-9 -mt-1 -me-1 rounded-lg hover:bg-paper text-muted"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
      {activeNode.details.map((p, i) => <p key={i} className="m-0">{p[locale]}</p>)}
      {activeNode.link && (
        <Link href={linkHref(activeNode)!} className="justify-self-start font-semibold text-leaf-dark">
          {activeNode.link.kind === "lesson" ? t("toLesson", { title: titles[activeNode.link.id] ?? "" }) : t("toSimulation", { title: titles[activeNode.link.id] ?? "" })}
        </Link>
      )}
    </div>
  );

  return (
    <div className="grid gap-2" onKeyDown={onKeyDown}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h4 className="m-0 text-base font-semibold">{t("title")}</h4>
        {!map.reviewed && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warn-soft text-warn">{t("draft")}</span>}
        <span className="text-sm text-muted">{t("hint")}</span>
      </div>

      <div ref={chartRef} className="relative bg-surface border border-line rounded-2xl px-3 py-6 sm:px-6" data-testid={`map-${map.topic}`}>
        {geo && (
          <svg className="absolute inset-0 pointer-events-none overflow-visible" width={geo.width} height={geo.height} aria-hidden="true">
            <defs>
              <marker id={ids("arrow")} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-[var(--muted)]" />
              </marker>
              <marker id={ids("arrow-on")} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-[var(--leaf)]" />
              </marker>
            </defs>
            {map.edges.map((e) => {
              const a = geo.rects[e.from];
              const b = geo.rects[e.to];
              if (!a || !b) return null;
              const { d } = arrowPath(a, b);
              const on = active && (active.id === e.from || active.id === e.to);
              return (
                <g key={`${e.from}-${e.to}`}>
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={on ? 2.5 : 1.6}
                    className={on ? "stroke-[var(--leaf)]" : "stroke-[var(--muted)]"}
                    markerEnd={`url(#${ids(on ? "arrow-on" : "arrow")})`}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Arrow labels are HTML, so mixed Hebrew/English text and backgrounds render reliably. */}
        {geo &&
          map.edges.map((e) => {
            const a = geo.rects[e.from];
            const b = geo.rects[e.to];
            if (!e.label || !a || !b) return null;
            const { labelX, labelY, sameRow, span } = arrowPath(a, b);
            return (
              <span
                key={`label-${e.from}-${e.to}`}
                aria-hidden="true"
                className={
                  "absolute z-[5] -translate-x-1/2 text-xs px-1.5 py-1 rounded-md bg-surface border border-line text-ink pointer-events-none text-center " +
                  (sameRow ? "-translate-y-full leading-tight" : "-translate-y-1/2 whitespace-nowrap leading-none")
                }
                style={{ left: labelX, top: labelY, maxWidth: sameRow ? Math.max(60, span - 4) : undefined }}
              >
                {e.label[locale]}
              </span>
            );
          })}

        <ol className="relative list-none p-0 m-0 grid gap-12">
          {grid.map((row) => {
            // Rows with a sideways arrow get a wider gap, to fit the arrow and its label.
            const sideways = map.edges.some((e) => row.some((n) => n.id === e.from) && row.some((n) => n.id === e.to));
            return (
            <li key={row[0].rank}>
              <ul className={"list-none p-0 m-0 flex justify-center " + (sideways ? "gap-20 sm:gap-28" : "gap-6 sm:gap-10")}>
                {row.map((n) => {
                  const isActive = active?.id === n.id;
                  const targets = map.edges.filter((e) => e.from === n.id).map((e) => byId.get(e.to)!.title[locale]);
                  return (
                    <li key={n.id} className="flex-1 min-w-0 max-w-[15rem]">
                      <button
                        type="button"
                        ref={(el) => { nodeRefs.current.set(n.id, el); }}
                        aria-expanded={isActive}
                        aria-controls={isActive ? ids("expansion") : undefined}
                        onPointerEnter={onNodePointerEnter(n.id)}
                        onPointerLeave={onNodePointerLeave}
                        onFocus={() => preview(n.id)}
                        onBlur={onNodeBlur}
                        onClick={() => onNodeClick(n.id)}
                        data-testid={`map-node-${n.id}`}
                        className={
                          "relative w-full h-full text-center grid gap-1 content-center rounded-xl border-2 px-2.5 py-2.5 min-h-16 transition-colors " +
                          (isActive ? "border-leaf bg-leaf-tint" : "border-line bg-paper hover:border-leaf")
                        }
                      >
                        <span className="font-semibold leading-snug text-[0.95rem] sm:text-base">{n.title[locale]}</span>
                        <span className="text-xs sm:text-sm text-muted leading-snug">{n.summary[locale]}</span>
                        {targets.length > 0 && <span className="sr-only">{t("leadsTo", { targets: targets.join(", ") })}</span>}
                        <span aria-hidden="true" className="absolute top-1 end-1.5 text-xs font-bold text-leaf-dark">{isActive ? "−" : "+"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
            );
          })}
        </ol>

        {wide && expansion}
      </div>
      {!wide && expansion}
    </div>
  );
}
