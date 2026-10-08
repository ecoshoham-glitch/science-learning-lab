"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Lesson, LessonBlock } from "@/lib/lesson/schema";
import type { SimulationManifest } from "@/lib/simulation/manifest";
import type { Activity } from "@/lib/activity/schema";
import type { Media } from "@/lib/media/schema";
import type { ObservableValues } from "@/lib/simulation/protocol";
import { SimulationHost } from "@/components/SimulationHost";
import { ActivityPanel } from "@/components/ActivityPanel";
import { Game } from "@/components/lesson/GameBlocks";
import { TimelineBlock } from "@/components/lesson/TimelineBlock";

type Mode = "self-paced" | "teacher-led";

/**
 * Plays one lesson in either delivery mode (section 9.3). Both modes render the same blocks
 * from the same data; only pacing and answer visibility differ, as configured in `lesson.delivery`.
 */
export function LessonPlayer({
  lesson,
  locale,
  simulations,
  activities,
  media = {},
}: {
  lesson: Lesson;
  locale: "he" | "en";
  simulations: Record<string, SimulationManifest>;
  activities: Record<string, Activity>;
  media?: Record<string, Media>;
}) {
  const t = useTranslations("lessons");
  const [mode, setMode] = useState<Mode>(lesson.delivery.modes[0]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState<Record<string, string>>({});
  const total = lesson.blocks.length;
  const block = lesson.blocks[index];

  const isGame = block.kind === "sequence" || block.kind === "match" || block.kind === "categorize";
  const mustAnswer =
    mode === "self-paced" &&
    lesson.delivery.selfPaced.requireAnswerBeforeNext &&
    (block.kind === "question" || isGame) &&
    !answered[block.id];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (next >= total) {
          setFinished(true);
          return i;
        }
        return Math.max(0, next);
      });
    },
    [total],
  );

  // Teacher-led: arrow keys move between parts. "Forward" follows the reading direction.
  useEffect(() => {
    if (mode !== "teacher-led") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      const forward = locale === "he" ? "ArrowLeft" : "ArrowRight";
      const back = locale === "he" ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward || e.key === "PageDown") go(1);
      if (e.key === back || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, locale, go]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setFinished(false);
  };

  const teacher = mode === "teacher-led";

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span id="mode-label" className="font-semibold">{t("modeLabel")}</span>
        <div role="radiogroup" aria-labelledby="mode-label" className="inline-flex rounded-xl border border-line bg-surface p-1">
          {lesson.delivery.modes.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => switchMode(m)}
              className={"min-h-10 px-4 rounded-lg font-semibold " + (mode === m ? "bg-leaf text-white" : "text-ink hover:bg-paper")}
            >
              {m === "self-paced" ? t("selfPaced") : t("teacherLed")}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted">{teacher ? t("teacherLedHint") : t("selfPacedHint")}</span>
      </div>

      <section
        aria-label={t("part", { current: index + 1, total })}
        className={
          "bg-surface border border-line rounded-2xl " +
          (teacher ? "p-6 sm:p-10 min-h-[70vh] text-[1.2rem] sm:text-[1.35rem] leading-relaxed" : "p-5 sm:p-7")
        }
      >
        {finished ? (
          <div className="grid gap-4">
            <p className="text-2xl font-semibold m-0 text-leaf-dark">{t("done")}</p>
            <button
              type="button"
              onClick={() => { setIndex(0); setFinished(false); setAnswered({}); }}
              className="justify-self-start min-h-11 px-4 rounded-xl border border-line font-semibold hover:bg-paper"
            >
              {t("restart")}
            </button>
            {!teacher && <p className="text-sm text-muted m-0">{t("notSaved")}</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="m-0 text-sm text-muted">{t("part", { current: index + 1, total })}</p>
              <BlockOrigin block={block} />
            </div>
            <div className="h-1.5 rounded-full bg-paper border border-line overflow-hidden mb-6" aria-hidden="true">
              <div className="h-full bg-leaf" style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
            <Block
              key={`${mode}:${block.id}`}
              block={block}
              locale={locale}
              teacher={teacher}
              revealByTeacher={lesson.delivery.teacherLed.revealAnswersByTeacher}
              simulations={simulations}
              activities={activities}
              media={media}
              onAnswered={(id, option) => setAnswered((a) => ({ ...a, [id]: option }))}
            />
          </>
        )}
      </section>

      {!finished && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="min-h-12 px-5 rounded-xl border border-line bg-surface font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper"
          >
            {t("prev")}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={mustAnswer}
            aria-describedby={mustAnswer ? "must-answer" : undefined}
            className="min-h-12 px-5 rounded-xl bg-leaf text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-leaf-dark"
          >
            {t("next")}
          </button>
          {mustAnswer && <span id="must-answer" className="text-sm text-muted">{isGame ? t("answerFirstGame") : t("answerFirst")}</span>}
        </div>
      )}
    </div>
  );
}

function BlockOrigin({ block }: { block: LessonBlock }) {
  const t = useTranslations("lessons");
  if (block.origin === "ai-generated" && !block.reviewed) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warn-soft text-warn">{t("aiBlock")}</span>;
  }
  if (block.origin === "library") {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-leaf-tint text-leaf-dark">{t("libraryBlock")}</span>;
  }
  return null;
}

function Block({
  block,
  locale,
  teacher,
  revealByTeacher,
  simulations,
  activities,
  media,
  onAnswered,
}: {
  block: LessonBlock;
  locale: "he" | "en";
  teacher: boolean;
  revealByTeacher: boolean;
  simulations: Record<string, SimulationManifest>;
  activities: Record<string, Activity>;
  media: Record<string, Media>;
  onAnswered: (blockId: string, option: string) => void;
}) {
  const t = useTranslations("lessons");
  switch (block.kind) {
    case "explanation":
      return (
        <div className="grid gap-4 max-w-[68ch]">
          <h2 className={"m-0 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{block.title[locale]}</h2>
          {block.body.map((p, i) => <p key={i} className="m-0">{p[locale]}</p>)}
        </div>
      );
    case "question":
      return teacher && revealByTeacher ? (
        <TeacherQuestion block={block} locale={locale} />
      ) : (
        <StudentQuestion block={block} locale={locale} onAnswered={onAnswered} />
      );
    case "simulation": {
      const sim = simulations[block.simulation.id];
      const activity = block.activityId ? activities[block.activityId] : undefined;
      return <SimulationBlock intro={block.intro[locale]} sim={sim} activity={activity} locale={locale} />;
    }
    case "discussion":
      return (
        <div className="grid gap-4 max-w-[68ch]">
          <p className="m-0 text-sm font-semibold text-leaf-dark">{t("discussion")}</p>
          <p className={"m-0 font-semibold " + (teacher ? "text-3xl leading-snug" : "text-xl")}>{block.prompt[locale]}</p>
          {teacher && block.teacherNote && (
            <aside className="bg-paper border border-line rounded-xl p-4 text-base">
              <strong>{t("teacherNote")}: </strong>
              {block.teacherNote[locale]}
            </aside>
          )}
        </div>
      );
    case "sequence":
    case "match":
    case "categorize":
      return <Game block={block} locale={locale} teacher={teacher} onChecked={(id) => onAnswered(id, "checked")} />;
    case "timeline":
      return <TimelineBlock block={block} locale={locale} teacher={teacher} media={media} simulations={simulations} />;
    case "summary":
      return (
        <div className="grid gap-4 max-w-[68ch]">
          <h2 className={"m-0 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{t("summary")}</h2>
          <ul className="m-0 ps-6 grid gap-2">
            {block.points.map((p, i) => <li key={i}>{p[locale]}</li>)}
          </ul>
          {block.next && (
            <p className="m-0 text-muted"><strong className="text-ink">{t("next_lesson")}: </strong>{block.next[locale]}</p>
          )}
        </div>
      );
  }
}

type QuestionBlock = Extract<LessonBlock, { kind: "question" }>;

function StudentQuestion({
  block,
  locale,
  onAnswered,
}: {
  block: QuestionBlock;
  locale: "he" | "en";
  onAnswered: (blockId: string, option: string) => void;
}) {
  const t = useTranslations("lessons");
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === block.correct;
  const label = block.purpose === "prediction" ? t("prediction") : t("checkpoint");

  return (
    <fieldset className="border-0 p-0 m-0 grid gap-3 max-w-[68ch]">
      <legend className="mb-3">
        <span className="block text-sm font-semibold text-leaf-dark mb-1">{label}</span>
        <span className="block text-xl font-semibold">{block.prompt[locale]}</span>
      </legend>
      {block.options.map((o) => (
        <label
          key={o.id}
          className={"flex items-start gap-3 min-h-12 p-3 rounded-xl border cursor-pointer " + (selected === o.id ? "border-leaf bg-leaf-tint" : "border-line bg-surface")}
        >
          <input
            type="radio"
            name={block.id}
            value={o.id}
            checked={selected === o.id}
            onChange={() => { setSelected(o.id); setChecked(false); }}
            className="mt-1.5 accent-[var(--leaf)]"
          />
          <span>{o.text[locale]}</span>
        </label>
      ))}
      <button
        type="button"
        disabled={!selected}
        onClick={() => { setChecked(true); if (selected) onAnswered(block.id, selected); }}
        className="justify-self-start min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-leaf-tint"
      >
        {t("check")}
      </button>
      <div aria-live="polite">
        {checked && selected && (
          <div className={"p-4 rounded-xl grid gap-2 " + (correct ? "bg-leaf-tint text-leaf-dark" : "bg-signal-soft text-ink")}>
            <p className="m-0">{correct ? block.feedback.correct[locale] : block.feedback.incorrect[locale]}</p>
            {!correct && block.purpose === "checkpoint" && block.misconception && (
              <p className="m-0 text-sm"><strong>{t("misconception")}: </strong>{block.misconception[locale]}</p>
            )}
          </div>
        )}
      </div>
    </fieldset>
  );
}

/** Classroom display: options are shown large; the answer appears only when the teacher reveals it. */
function TeacherQuestion({ block, locale }: { block: QuestionBlock; locale: "he" | "en" }) {
  const t = useTranslations("lessons");
  const [revealed, setRevealed] = useState(false);
  const label = block.purpose === "prediction" ? t("prediction") : t("checkpoint");
  const letters = locale === "he" ? ["א", "ב", "ג", "ד", "ה"] : ["A", "B", "C", "D", "E"];

  return (
    <div className="grid gap-5">
      <div>
        <p className="m-0 text-base font-semibold text-leaf-dark mb-2">{label}</p>
        <p className="m-0 text-3xl sm:text-4xl font-semibold leading-snug">{block.prompt[locale]}</p>
      </div>
      <ol className="list-none p-0 m-0 grid gap-3">
        {block.options.map((o, i) => {
          const isCorrect = revealed && o.id === block.correct;
          return (
            <li
              key={o.id}
              className={"flex items-start gap-4 p-4 rounded-2xl border-2 " + (isCorrect ? "border-leaf bg-leaf-tint" : "border-line")}
            >
              <span aria-hidden="true" className={"inline-grid place-items-center w-10 h-10 shrink-0 rounded-full font-bold " + (isCorrect ? "bg-leaf text-white" : "bg-paper border border-line")}>
                {letters[i]}
              </span>
              <span>
                {o.text[locale]}
                {isCorrect && <span className="sr-only"> – {t("correctAnswer")}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          className="min-h-12 px-5 rounded-xl border-2 border-leaf text-leaf-dark text-base font-semibold hover:bg-leaf-tint"
        >
          {revealed ? t("hide") : t("reveal")}
        </button>
      </div>
      <div aria-live="polite">
        {revealed && (
          <div className="grid gap-2 text-lg">
            <p className="m-0">{block.feedback.correct[locale]}</p>
            {block.misconception && (
              <p className="m-0 text-muted"><strong className="text-ink">{t("misconception")}: </strong>{block.misconception[locale]}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SimulationBlock({
  intro,
  sim,
  activity,
  locale,
}: {
  intro: string;
  sim: SimulationManifest | undefined;
  activity: Activity | undefined;
  locale: "he" | "en";
}) {
  const t = useTranslations("lessons");
  const [observables, setObservables] = useState<ObservableValues>({});
  if (!sim?.entry) return null;
  const defaults = Object.fromEntries(sim.parameters.map((p) => [p.id, p.default]));
  const params = activity ? { ...defaults, ...activity.config.params } : defaults;

  return (
    <div className="grid gap-4">
      <div>
        <p className="m-0 text-sm font-semibold text-leaf-dark">{t("simulation")}: {sim.title[locale]}</p>
        <p className="m-0 mt-1 text-base">{intro}</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] items-start text-base">
        <div className="min-w-0">
          <SimulationHost
            entry={sim.entry}
            title={sim.title[locale]}
            locale={locale}
            params={params}
            lockedParams={activity?.config.lockedParams ?? []}
            onObservables={setObservables}
          />
        </div>
        {activity && (
          <div className="bg-paper border border-line rounded-2xl p-4">
            <p className="m-0 mb-3 font-semibold">{activity.title[locale]}</p>
            <ActivityPanel activity={activity} locale={locale} observables={observables} />
          </div>
        )}
      </div>
    </div>
  );
}
