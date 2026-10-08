"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import type { Activity, ActivityStep } from "@/lib/activity/schema";
import type { ObservableValues } from "@/lib/simulation/protocol";
import { evaluateAll } from "@/lib/activity/evaluate";

/**
 * Renders an activity (data) next to its simulation. Task steps are checked live
 * against the observables the simulation reports — never against the simulation's internals.
 */
export function ActivityPanel({
  activity,
  locale,
  observables,
}: {
  activity: Activity;
  locale: "he" | "en";
  observables: ObservableValues;
}) {
  const t = useTranslations("activity");
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const total = activity.steps.length;
  const step = activity.steps[index];

  if (finished) {
    return (
      <div className="grid gap-4">
        <p className="text-lg font-semibold m-0 text-leaf-dark">{t("done")}</p>
        <button
          type="button"
          onClick={() => { setIndex(0); setFinished(false); }}
          className="justify-self-start min-h-11 px-4 rounded-xl border border-line font-semibold hover:bg-paper"
        >
          {t("restart")}
        </button>
        <p className="text-sm text-muted m-0">{t("notSaved")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold min-h-8">{t("objectives")}</summary>
        <ul className="mt-2 mb-0 ps-5">
          {activity.objectives.map((o, i) => <li key={i}>{o[locale]}</li>)}
        </ul>
        <p className="text-muted mt-2 mb-0">{activity.curriculum.note[locale]}</p>
      </details>

      <div>
        <p className="text-sm text-muted m-0 mb-2">{t("step", { current: index + 1, total })}</p>
        <div className="h-1.5 rounded-full bg-paper border border-line overflow-hidden" aria-hidden="true">
          <div className="h-full bg-leaf" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      {/* Keyed by index so each step starts with fresh local state. */}
      <Step key={index} step={step} locale={locale} observables={observables} />

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="min-h-11 px-4 rounded-xl border border-line font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper"
        >
          {t("prev")}
        </button>
        <button
          type="button"
          onClick={() => (index === total - 1 ? setFinished(true) : setIndex((i) => i + 1))}
          className="min-h-11 px-4 rounded-xl bg-leaf text-white font-semibold hover:bg-leaf-dark"
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
}

function Step({ step, locale, observables }: { step: ActivityStep; locale: "he" | "en"; observables: ObservableValues }) {
  switch (step.kind) {
    case "choice":
      return <ChoiceStep step={step} locale={locale} />;
    case "task":
      return <TaskStep step={step} locale={locale} observables={observables} />;
    case "reflect":
      return <ReflectStep step={step} locale={locale} />;
  }
}

function ChoiceStep({ step, locale }: { step: Extract<ActivityStep, { kind: "choice" }>; locale: "he" | "en" }) {
  const t = useTranslations("activity");
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const name = useId();
  const correct = selected === step.correct;

  return (
    <fieldset className="border-0 p-0 m-0 grid gap-3">
      <legend className="font-semibold text-lg mb-2">{step.prompt[locale]}</legend>
      {step.options.map((o) => (
        <label key={o.id} className={"flex items-start gap-3 min-h-11 p-3 rounded-xl border cursor-pointer " + (selected === o.id ? "border-leaf bg-leaf-tint" : "border-line bg-surface")}>
          <input
            type="radio"
            name={name}
            value={o.id}
            checked={selected === o.id}
            onChange={() => { setSelected(o.id); setChecked(false); }}
            className="mt-1 accent-[var(--leaf)]"
          />
          <span>{o.text[locale]}</span>
        </label>
      ))}
      <button
        type="button"
        disabled={!selected}
        onClick={() => setChecked(true)}
        className="justify-self-start min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-leaf-tint"
      >
        {t("check")}
      </button>
      <div aria-live="polite">
        {checked && selected && (
          <p className={"m-0 p-3 rounded-xl " + (correct ? "bg-leaf-tint text-leaf-dark" : "bg-signal-soft text-ink")}>
            <strong>{correct ? t("correct") : t("tryAgain")}. </strong>
            {correct ? step.feedback.correct[locale] : step.feedback.incorrect[locale]}
          </p>
        )}
      </div>
    </fieldset>
  );
}

function TaskStep({
  step,
  locale,
  observables,
}: {
  step: Extract<ActivityStep, { kind: "task" }>;
  locale: "he" | "en";
  observables: ObservableValues;
}) {
  const t = useTranslations("activity");
  const results = evaluateAll(step.conditions, observables);
  const done = results.every(Boolean);

  return (
    <div className="grid gap-3">
      <p className="font-semibold text-lg m-0">{step.prompt[locale]}</p>
      {step.hint && (
        <details className="text-sm">
          <summary className="cursor-pointer min-h-8 font-semibold">{t("hint")}</summary>
          <p className="mt-1 mb-0">{step.hint[locale]}</p>
        </details>
      )}
      {step.checklist && (
        <ul className="list-none p-0 m-0 grid gap-2" aria-label={t("progress")}>
          {step.checklist.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={"inline-grid place-items-center w-6 h-6 rounded-full border text-sm " + (results[i] ? "bg-leaf border-leaf text-white" : "border-line text-transparent")}
              >
                ✓
              </span>
              <span className={results[i] ? "text-ink" : "text-muted"}>
                <span className="sr-only">{results[i] ? t("taskDone") : t("taskPending")}: </span>
                {c[locale]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p aria-live="polite" className={"m-0 p-3 rounded-xl " + (done ? "bg-leaf-tint text-leaf-dark font-semibold" : "bg-paper text-muted")}>
        {done ? step.success[locale] : t("taskPending")}
      </p>
    </div>
  );
}

function ReflectStep({ step, locale }: { step: Extract<ActivityStep, { kind: "reflect" }>; locale: "he" | "en" }) {
  const t = useTranslations("activity");
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  const id = useId();

  return (
    <div className="grid gap-3">
      <label htmlFor={id} className="font-semibold text-lg">{step.prompt[locale]}</label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t("yourAnswer")}
        className="rounded-xl border border-line bg-surface p-3 text-ink"
      />
      <button
        type="button"
        onClick={() => setShown(true)}
        className="justify-self-start min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold hover:bg-leaf-tint"
      >
        {t("showAnswer")}
      </button>
      {shown && <p className="m-0 p-3 rounded-xl bg-leaf-tint text-ink">{step.sampleAnswer[locale]}</p>}
    </div>
  );
}
