"use client";

import { useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SimulationManifest } from "@/lib/simulation/manifest";
import { concepts, interactions, label, subjects } from "@/content/taxonomy";
import { SimulationCard } from "./SimulationCard";

type Filters = { query: string; subject: string; grade: string; interaction: string };
const EMPTY: Filters = { query: "", subject: "", grade: "", interaction: "" };

/** Lower-case and strip Hebrew niqqud so "אנזים" and "אַנְזִים" match. */
function normalize(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[֑-ׇ]/g, "").trim();
}

export function LibraryBrowser({
  simulations,
  activityCounts,
}: {
  simulations: SimulationManifest[];
  activityCounts: Record<string, number>;
}) {
  const t = useTranslations("library");
  const locale = useLocale() as "he" | "en";
  const [f, setF] = useState<Filters>(EMPTY);
  const ids = { q: useId(), s: useId(), g: useId(), i: useId() };

  const subjectOptions = [...new Set(simulations.map((s) => s.subject))];
  const interactionOptions = [...new Set(simulations.map((s) => s.interaction))];
  const gradeOptions = [10, 11, 12];

  const results = useMemo(() => {
    const q = normalize(f.query);
    return simulations.filter((s) => {
      if (f.subject && s.subject !== f.subject) return false;
      if (f.interaction && s.interaction !== f.interaction) return false;
      if (f.grade && (Number(f.grade) < s.grades.from || Number(f.grade) > s.grades.to)) return false;
      if (!q) return true;
      // Search both languages, so a Hebrew interface still finds "ribosome".
      const haystack = [
        s.title.he, s.title.en, s.summary.he, s.summary.en,
        ...s.concepts.flatMap((c) => [concepts[c]?.he ?? c, concepts[c]?.en ?? c]),
      ].map(normalize).join(" ");
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [f, simulations]);

  const active = f.query || f.subject || f.grade || f.interaction;
  const selectClass = "min-h-11 rounded-lg border border-line bg-surface px-3 text-ink";

  return (
    <div>
      <form role="search" className="bg-surface border border-line rounded-2xl p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-1">
          <label htmlFor={ids.q} className="font-semibold text-sm">{t("search")}</label>
          <input
            id={ids.q}
            type="search"
            value={f.query}
            onChange={(e) => setF({ ...f, query: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-ink"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor={ids.s} className="font-semibold text-sm">{t("subject")}</label>
          <select id={ids.s} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={selectClass}>
            <option value="">{t("all")}</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{label(subjects, s, locale)}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor={ids.g} className="font-semibold text-sm">{t("grade")}</label>
          <select id={ids.g} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} className={selectClass}>
            <option value="">{t("all")}</option>
            {gradeOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor={ids.i} className="font-semibold text-sm">{t("interaction")}</label>
          <select id={ids.i} value={f.interaction} onChange={(e) => setF({ ...f, interaction: e.target.value })} className={selectClass}>
            <option value="">{t("all")}</option>
            {interactionOptions.map((i) => <option key={i} value={i}>{label(interactions, i, locale)}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setF(EMPTY)}
          disabled={!active}
          className="min-h-11 px-4 rounded-lg border border-line text-ink font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper"
        >
          {t("clear")}
        </button>
      </form>

      <p className="mt-6 mb-3 text-muted" role="status" aria-live="polite">{t("results", { count: results.length })}</p>

      {results.length === 0 ? (
        <p className="bg-surface border border-dashed border-line rounded-2xl p-6 text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 list-none p-0 m-0">
          {results.map((s) => (
            <li key={s.id}>
              <SimulationCard manifest={s} activityCount={activityCounts[s.id] ?? 0} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
