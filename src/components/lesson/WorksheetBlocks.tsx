"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { LessonBlock } from "@/lib/lesson/schema";
import { hasEnoughText, matchesAccepted } from "@/lib/lesson/worksheet";

type Locale = "he" | "en";
type FillTable = Extract<LessonBlock, { kind: "fill-table" }>;
type Reflection = Extract<LessonBlock, { kind: "reflection" }>;

/** Answers are kept by the lesson player, so they survive moving between parts of the lesson. */
export type WorkStore = {
  get: (blockId: string, key: string) => string;
  set: (blockId: string, key: string, value: string) => void;
  /** Plain text of all worksheet answers in the lesson, for sending to the teacher. */
  exportText: () => string;
};

function CopyAnswers({ store }: { store: WorkStore }) {
  const t = useTranslations("lessons.worksheet");
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const text = store.exportText();
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setStatus("copied");
          } catch {
            setStatus("failed");
          }
        }}
        className="justify-self-start min-h-11 px-4 rounded-xl border border-line font-semibold hover:bg-paper"
      >
        {t("copy")}
      </button>
      <p aria-live="polite" className="m-0 text-sm text-muted">{status === "copied" ? t("copied") : status === "failed" ? t("copyFailed") : ""}</p>
      {status === "failed" && (
        <textarea readOnly value={text} rows={8} aria-label={t("copy")} className="w-full max-w-[68ch] rounded-xl border border-line p-3 text-sm" />
      )}
    </div>
  );
}

export function FillTableBlock({
  block,
  locale,
  teacher,
  store,
  onChecked,
}: {
  block: FillTable;
  locale: Locale;
  teacher: boolean;
  store: WorkStore;
  onChecked: (blockId: string) => void;
}) {
  const t = useTranslations("lessons.worksheet");
  const [checked, setChecked] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [, force] = useState(0);

  const auto = block.rows.flatMap((r) => block.columns.filter((c) => r.cells[c.id]?.accept).map((c) => ({ r, c })));
  const autoCorrect = auto.filter(({ r, c }) => matchesAccepted(store.get(block.id, `${r.id}.${c.id}`), r.cells[c.id].accept!)).length;
  const anyFilled = block.rows.some((r) => block.columns.some((c) => store.get(block.id, `${r.id}.${c.id}`).trim()));

  return (
    <div className="grid gap-5">
      <div className="max-w-[68ch]">
        <p className="m-0 text-sm font-semibold text-leaf-dark">{t("label")}</p>
        <h2 className={"m-0 mt-1 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{block.title[locale]}</h2>
        <p className="m-0 mt-2">{block.prompt[locale]}</p>
      </div>

      <ol className="list-none p-0 m-0 grid gap-4">
        {block.rows.map((r) => (
          <li key={r.id} data-testid={`row-${r.id}`}>
            <fieldset className="m-0 border border-line rounded-2xl bg-surface p-4 grid gap-3">
              <legend className="px-2 -mx-2 flex items-center gap-3">
                <span dir="ltr" className="font-bold text-xl text-leaf-dark"><bdi>{r.cue[locale]}</bdi></span>
              </legend>
              {r.hint && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    aria-expanded={!!hints[r.id]}
                    onClick={() => setHints((h) => ({ ...h, [r.id]: !h[r.id] }))}
                    className="min-h-10 px-3 rounded-lg border border-line text-sm font-semibold hover:bg-paper"
                  >
                    {hints[r.id] ? t("hideHint") : t("hint")}
                  </button>
                  {hints[r.id] && <p className="m-0 text-sm text-muted">{r.hint[locale]}</p>}
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
                {block.columns.map((c) => {
                  const key = `${r.id}.${c.id}`;
                  const id = `${block.id}-${r.id}-${c.id}`;
                  const cell = r.cells[c.id];
                  const value = store.get(block.id, key);
                  const ok = cell.accept ? matchesAccepted(value, cell.accept) : null;
                  // A model answer appears only after the student has tried this cell, so it can't be copied blindly.
                  const tried = value.trim().length > 0;
                  return (
                    <div key={c.id} className="grid gap-1 content-start">
                      <label htmlFor={id} className="text-sm font-semibold">{c.label[locale]}</label>
                      {c.long ? (
                        <textarea
                          id={id}
                          rows={3}
                          value={value}
                          onChange={(e) => { store.set(block.id, key, e.target.value); setChecked(false); force((n) => n + 1); }}
                          className="w-full rounded-xl border border-line bg-surface p-2.5 text-base"
                        />
                      ) : (
                        <input
                          id={id}
                          type="text"
                          value={value}
                          onChange={(e) => { store.set(block.id, key, e.target.value); setChecked(false); force((n) => n + 1); }}
                          className="w-full min-h-11 rounded-xl border border-line bg-surface px-2.5 text-base"
                        />
                      )}
                      {checked && tried && ok !== null && (
                        <p className={"m-0 text-sm font-semibold " + (ok ? "text-leaf-dark" : "text-warn")}>
                          {ok ? t("right") : t("notYet")}
                        </p>
                      )}
                      {(showModels || (checked && tried && (ok === null || !ok))) && (
                        <p className="m-0 text-sm bg-paper border border-line rounded-lg p-2">
                          <strong>{t("model")}: </strong>{cell.answer[locale]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!anyFilled}
          onClick={() => { setChecked(true); onChecked(block.id); }}
          className="min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-leaf-tint"
        >
          {t("check")}
        </button>
        {teacher && (
          <button type="button" onClick={() => setShowModels((s) => !s)} aria-pressed={showModels} className="min-h-11 px-4 rounded-xl border border-line font-semibold hover:bg-paper">
            {t("showModels")}
          </button>
        )}
        {!anyFilled && <span className="text-sm text-muted">{t("fillFirst")}</span>}
      </div>
      <div aria-live="polite">
        {checked && (
          <div className="p-4 rounded-xl bg-leaf-tint text-leaf-dark grid gap-1 max-w-[68ch]">
            {auto.length > 0 && <p className="m-0 font-semibold">{t("namesScore", { correct: autoCorrect, total: auto.length })}</p>}
            <p className="m-0">{t("compare")}</p>
          </div>
        )}
      </div>
      {!teacher && <CopyAnswers store={store} />}
    </div>
  );
}

export function ReflectionBlock({
  block,
  locale,
  teacher,
  store,
  onDone,
}: {
  block: Reflection;
  locale: Locale;
  teacher: boolean;
  store: WorkStore;
  onDone: (blockId: string) => void;
}) {
  const t = useTranslations("lessons.worksheet");
  const [, force] = useState(0);
  const [done, setDone] = useState(false);
  const value = store.get(block.id, "text");
  const enough = hasEnoughText(value, block.minChars);
  const id = `${block.id}-text`;

  const setValue = (v: string) => { store.set(block.id, "text", v); setDone(false); force((n) => n + 1); };

  return (
    <div className="grid gap-4 max-w-[72ch]">
      <div>
        <p className="m-0 text-sm font-semibold text-leaf-dark">{t("reflectionLabel")}</p>
        <h2 className={"m-0 mt-1 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{block.title[locale]}</h2>
      </div>
      <label htmlFor={id} className={"font-semibold " + (teacher ? "text-2xl" : "text-lg")}>{block.prompt[locale]}</label>
      {block.starters.length > 0 && (
        <div className="grid gap-2">
          <span className="text-sm text-muted">{t("starters")}</span>
          <div className="flex flex-wrap gap-2">
            {block.starters.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setValue((value.trim() ? value.replace(/\s*$/, "\n") : "") + s[locale] + " ")}
                className="min-h-10 px-3 rounded-full border border-line bg-paper text-sm hover:border-leaf"
              >
                {s[locale]}
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea
        id={id}
        rows={teacher ? 4 : 6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-xl border border-line bg-surface p-3 text-base"
      />
      {teacher && block.teacherNote && (
        <aside className="bg-paper border border-line rounded-xl p-4 text-base">
          <strong>{t("teacherNote")}: </strong>{block.teacherNote[locale]}
        </aside>
      )}
      {!teacher && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!enough}
              onClick={() => { setDone(true); onDone(block.id); }}
              className="min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-leaf-tint"
            >
              {t("done")}
            </button>
            {!enough && <span className="text-sm text-muted">{t("needMore")}</span>}
          </div>
          <p aria-live="polite" className="m-0 text-leaf-dark font-semibold">{done ? t("thanks") : ""}</p>
          <CopyAnswers store={store} />
        </>
      )}
    </div>
  );
}
