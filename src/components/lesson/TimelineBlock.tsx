"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { LessonBlock } from "@/lib/lesson/schema";
import { overviewRange, scaleYear, stageRanges, timelineGaps } from "@/lib/lesson/timeline";

type Locale = "he" | "en";
type Timeline = Extract<LessonBlock, { kind: "timeline" }>;

/** Track shapes, so tracks never depend on colour alone. */
function Shape({ index, size = 14, className = "" }: { index: number; size?: number; className?: string }) {
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className={"shrink-0 " + className}>
      {index % 3 === 0 && <polygon points={`${h},1 ${size - 1},${h} ${h},${size - 1} 1,${h}`} />}
      {index % 3 === 1 && <circle cx={h} cy={h} r={h - 1} />}
      {index % 3 === 2 && <rect x={1.5} y={1.5} width={size - 3} height={size - 3} />}
    </svg>
  );
}

function OverviewShape({ index, x, y, r, selected }: { index: number; x: number; y: number; r: number; selected: boolean }) {
  const cls = selected ? "fill-[var(--leaf-dark)] stroke-[var(--signal)]" : "fill-[var(--leaf)] stroke-white";
  const sw = selected ? 3 : 1.5;
  if (index % 3 === 0) return <polygon className={cls} strokeWidth={sw} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} />;
  if (index % 3 === 1) return <circle className={cls} strokeWidth={sw} cx={x} cy={y} r={r * 0.85} />;
  return <rect className={cls} strokeWidth={sw} x={x - r * 0.75} y={y - r * 0.75} width={r * 1.5} height={r * 1.5} />;
}

export function TimelineBlock({ block, locale, teacher }: { block: Timeline; locale: Locale; teacher: boolean }) {
  const t = useTranslations("lessons");
  const [track, setTrack] = useState<string>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const trackIndex = useMemo(() => new Map(block.tracks.map((tr, i) => [tr.id, i])), [block.tracks]);
  const stageIndex = useMemo(() => new Map(block.stages.map((s, i) => [s.id, i])), [block.stages]);
  const range = useMemo(() => overviewRange(block.events), [block.events]);
  const bands = useMemo(() => stageRanges(block.stages.map((s) => s.id), block.events), [block.stages, block.events]);
  const visible = block.events.filter((e) => track === "all" || e.track === track);
  const gaps = timelineGaps(visible, 40);

  const yearText = (e: Timeline["events"][number]) => e.yearLabel?.[locale] ?? String(e.year);
  const toggle = (id: string) => {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
    setSelected(id);
  };

  // Overview strip geometry (SVG units). Always left-to-right, like any time axis.
  const W = 1000;
  const PAD = 24;
  const x = (year: number) => PAD + scaleYear(year, range.from, range.to, W - 2 * PAD);
  const rowY = (i: number) => 34 + i * 30;
  const axisY = rowY(block.tracks.length - 1) + 24;
  const H = axisY + 26;
  const ticks: number[] = [];
  for (let y = range.from; y <= range.to; y += 50) ticks.push(y);

  return (
    <div className="grid gap-5">
      <div className="max-w-[68ch]">
        <p className="m-0 text-sm font-semibold text-leaf-dark">{t("timeline.label")}</p>
        <h2 className={"m-0 mt-1 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{block.title[locale]}</h2>
        <p className="m-0 mt-2">{block.intro[locale]}</p>
      </div>

      <figure className="m-0 grid gap-2 min-w-0">
        {/* On narrow screens the strip keeps a readable size and scrolls sideways inside its frame. */}
        <div dir="ltr" className="overflow-x-auto rounded-xl" tabIndex={0} aria-label={t("timeline.label")} role="region">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ direction: "ltr" }}
          role="img"
          aria-label={t("timeline.overview", { from: range.from, to: range.to, count: block.events.length, stages: block.stages.length })}
          className="w-full min-w-[620px] h-auto bg-surface border border-line rounded-xl"
          data-testid="timeline-overview"
        >
          {bands.map((b) => {
            const x1 = x(b.from) - 10;
            const x2 = x(b.to) + 10;
            return (
              <g key={b.id}>
                <rect x={x1} y={8} width={x2 - x1} height={axisY - 8} rx={8} className={b.index % 2 ? "fill-[var(--signal-soft)]" : "fill-[var(--leaf-tint)]"} />
                <text x={(x1 + x2) / 2} y={22} textAnchor="middle" className="fill-[var(--ink)] text-[15px] font-bold">{b.index + 1}</text>
              </g>
            );
          })}
          <line x1={PAD} x2={W - PAD} y1={axisY} y2={axisY} className="stroke-[var(--muted)]" strokeWidth={1.5} />
          {ticks.map((y) => (
            <g key={y}>
              <line x1={x(y)} x2={x(y)} y1={axisY} y2={axisY + (y % 100 === 0 ? 8 : 4)} className="stroke-[var(--muted)]" />
              {y % 100 === 0 && <text x={x(y)} y={axisY + 22} textAnchor="middle" className="fill-[var(--muted)] text-[15px]">{y}</text>}
            </g>
          ))}
          {block.events.map((e) => {
            const ti = trackIndex.get(e.track) ?? 0;
            const dim = track !== "all" && e.track !== track;
            return (
              <g key={e.id} opacity={dim ? 0.2 : 1} className="cursor-pointer" onClick={() => toggle(e.id)}>
                <OverviewShape index={ti} x={x(e.year)} y={rowY(ti)} r={selected === e.id ? 11 : 8} selected={selected === e.id} />
              </g>
            );
          })}
        </svg>
        </div>
        <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <span className="sr-only">{t("timeline.legend")}: </span>
          {block.tracks.map((tr, i) => (
            <span key={tr.id} className="inline-flex items-center gap-1.5">
              <Shape index={i} className="fill-[var(--leaf)]" />
              {tr.label[locale]}
            </span>
          ))}
        </figcaption>
      </figure>

      <fieldset className="border-0 p-0 m-0 flex flex-wrap items-center gap-2">
        <legend className="font-semibold me-2 float-start">{t("timeline.filter")}</legend>
        {[{ id: "all", label: null as null | Record<Locale, string> }, ...block.tracks].map((tr) => {
          const checked = track === tr.id;
          return (
            <label
              key={tr.id}
              className={"inline-flex items-center gap-2 min-h-11 px-3 rounded-lg border cursor-pointer " + (checked ? "border-leaf bg-leaf-tint" : "border-line bg-surface")}
            >
              <input
                type="radio"
                name={`${block.id}-track`}
                value={tr.id}
                checked={checked}
                onChange={() => setTrack(tr.id)}
                className="accent-[var(--leaf)] w-4 h-4"
              />
              {tr.id !== "all" && <Shape index={trackIndex.get(tr.id) ?? 0} className="fill-[var(--leaf)]" />}
              <span>{tr.label ? tr.label[locale] : t("timeline.all")}</span>
            </label>
          );
        })}
      </fieldset>

      <ol className="list-none p-0 m-0 grid max-w-[72ch]" data-testid="timeline-list">
        {visible.map((e, i) => {
          const stage = stageIndex.get(e.stage) ?? 0;
          const newStage = i === 0 || visible[i - 1].stage !== e.stage;
          const ti = trackIndex.get(e.track) ?? 0;
          const isOpen = !!open[e.id];
          const panelId = `${block.id}-${e.id}-text`;
          return (
            <Fragment key={e.id}>
              {gaps[e.id] && (
                <li className="flex items-center gap-3 py-2 ps-1 text-sm text-muted" data-testid={`gap-${e.id}`}>
                  <span className="w-3 border-s-2 border-dashed border-line self-stretch ms-[7px]" aria-hidden="true" />
                  <span className="italic">{t("timeline.gap", { years: gaps[e.id] })}</span>
                </li>
              )}
              {newStage && (
                <li className="pt-4 pb-1">
                  <h3 className="m-0 text-base font-semibold text-leaf-dark flex items-center gap-2">
                    <span className={"inline-grid place-items-center w-7 h-7 rounded-full text-sm " + (stage % 2 ? "bg-signal-soft text-ink" : "bg-leaf-tint text-leaf-dark")} aria-hidden="true">{stage + 1}</span>
                    {block.stages[stage].title[locale]}
                  </h3>
                </li>
              )}
              <li className="relative ps-7 pb-2 border-s-2 border-line ms-[13px]" data-testid={`event-${e.id}`}>
                <span className="absolute -start-[9px] top-3 bg-paper rounded-full p-[1px]" aria-hidden="true">
                  <Shape index={ti} size={16} className={selected === e.id ? "fill-[var(--leaf-dark)]" : "fill-[var(--leaf)]"} />
                </span>
                <button
                  type="button"
                  onClick={() => toggle(e.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={"w-full text-start flex items-baseline gap-x-3 gap-y-1 min-h-11 p-2 rounded-xl border hover:bg-paper " + (selected === e.id ? "border-leaf bg-surface" : "border-transparent")}
                >
                  <span dir="ltr" className="font-bold text-leaf-dark tabular-nums min-w-[5.5ch]">
                    <bdi>{yearText(e)}</bdi>
                  </span>
                  <span className="font-semibold flex-1 min-w-[12ch]">{e.title[locale]}</span>
                  <span className="sr-only sm:not-sr-only text-xs text-muted">{block.tracks[ti].label[locale]}</span>
                  {teacher && !e.fromSource && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warn-soft text-warn">{t("timeline.added")}</span>
                  )}
                  <span aria-hidden="true" className="text-muted ms-auto">{isOpen ? "−" : "+"}</span>
                </button>
                <div id={panelId} hidden={!isOpen} className="px-2 pb-2">
                  <p className="m-0">{e.text[locale]}</p>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
