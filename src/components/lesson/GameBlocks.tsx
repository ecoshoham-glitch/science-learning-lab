"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LessonBlock } from "@/lib/lesson/schema";
import { move, scoreCategorize, scoreMatch, scoreSequence, shuffle, type Score } from "@/lib/lesson/games";

type Locale = "he" | "en";
type SequenceBlock = Extract<LessonBlock, { kind: "sequence" }>;
type MatchBlock = Extract<LessonBlock, { kind: "match" }>;
type CategorizeBlock = Extract<LessonBlock, { kind: "categorize" }>;
export type GameBlock = SequenceBlock | MatchBlock | CategorizeBlock;

type GameProps<B> = {
  block: B;
  locale: Locale;
  teacher: boolean;
  /** Called every time the student checks the game. */
  onChecked: (blockId: string, score: Score) => void;
};

export function Game({ block, ...rest }: GameProps<GameBlock>) {
  switch (block.kind) {
    case "sequence":
      return <SequenceGame block={block} {...rest} />;
    case "match":
      return <MatchGame block={block} {...rest} />;
    case "categorize":
      return <CategorizeGame block={block} {...rest} />;
  }
}

/** Shared frame: label, title, prompt, the game, a check button and scored feedback. */
function GameFrame({
  block,
  locale,
  teacher,
  score,
  canCheck,
  onCheck,
  onShowSolution,
  solutionShown,
  children,
}: {
  block: GameBlock;
  locale: Locale;
  teacher: boolean;
  score: Score | null;
  canCheck: boolean;
  onCheck: () => void;
  onShowSolution: () => void;
  solutionShown: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("lessons");
  const all = score !== null && score.correct === score.total;
  return (
    <div className="grid gap-4">
      <div className="max-w-[68ch]">
        <p className="m-0 text-sm font-semibold text-leaf-dark">{t(`games.${block.kind}`)}</p>
        <h2 className={"m-0 mt-1 font-semibold " + (teacher ? "text-3xl sm:text-4xl" : "text-2xl")}>{block.title[locale]}</h2>
        <p className="m-0 mt-2">{block.prompt[locale]}</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCheck}
          disabled={!canCheck}
          className="min-h-11 px-4 rounded-xl border border-leaf text-leaf-dark font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-leaf-tint"
        >
          {t("check")}
        </button>
        {teacher && (
          <button
            type="button"
            onClick={onShowSolution}
            className="min-h-11 px-4 rounded-xl border border-line font-semibold hover:bg-paper"
          >
            {t("games.showSolution")}
          </button>
        )}
        {!canCheck && !score && <span className="text-sm text-muted">{t("games.unanswered")}</span>}
      </div>
      <div aria-live="polite">
        {score && (
          <div className={"p-4 rounded-xl grid gap-1 max-w-[68ch] " + (all ? "bg-leaf-tint text-leaf-dark" : "bg-signal-soft text-ink")}>
            <p className="m-0 font-semibold">
              {all && !solutionShown ? `${t("games.allCorrect")} ` : ""}
              {solutionShown ? t("games.solutionShown") : t("games.score", { correct: score.correct, total: score.total })}
            </p>
            <p className="m-0">
              {all ? block.feedback.correct[locale] : `${block.feedback.incorrect[locale]} ${t("games.tryAgain")}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Mark({ ok }: { ok: boolean }) {
  const t = useTranslations("lessons");
  return (
    <span
      className={"inline-grid place-items-center shrink-0 w-7 h-7 rounded-full text-sm font-bold " + (ok ? "bg-leaf text-white" : "bg-warn-soft text-warn")}
    >
      <span aria-hidden="true">{ok ? "✓" : "✗"}</span>
      <span className="sr-only">{ok ? t("games.right") : t("games.wrong")}</span>
    </span>
  );
}

// ---- Sequence -------------------------------------------------------------------

function SequenceGame({ block, locale, teacher, onChecked }: GameProps<SequenceBlock>) {
  const t = useTranslations("lessons");
  const solution = useMemo(() => block.items.map((i) => i.id), [block.items]);
  const byId = useMemo(() => new Map(block.items.map((i) => [i.id, i])), [block.items]);
  const [order, setOrder] = useState(() => shuffle(solution, block.id));
  const [score, setScore] = useState<Score | null>(null);
  const [solutionShown, setSolutionShown] = useState(false);
  const [announce, setAnnounce] = useState("");
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const focusNext = useRef<string | null>(null);

  // After a move, focus follows the moved item (the row was re-rendered in a new place).
  useEffect(() => {
    if (!focusNext.current) return;
    buttons.current.get(focusNext.current)?.focus();
    focusNext.current = null;
  }, [order]);

  const shift = (index: number, delta: -1 | 1) => {
    const id = order[index];
    const next = move(order, index, delta);
    const pos = next.indexOf(id);
    setOrder(next);
    setScore(null);
    setSolutionShown(false);
    setAnnounce(t("games.moved", { item: byId.get(id)!.text[locale], position: pos + 1, total: next.length }));
    // Keep focus on the moved item; at an edge, move it to the button that still works.
    const dir = pos === 0 ? "down" : pos === next.length - 1 ? "up" : delta < 0 ? "up" : "down";
    focusNext.current = `${id}:${dir}`;
  };

  const showDetails = solutionShown || (score !== null && score.correct === score.total);

  return (
    <GameFrame
      block={block}
      locale={locale}
      teacher={teacher}
      score={score}
      canCheck
      solutionShown={solutionShown}
      onCheck={() => {
        const s = scoreSequence(order, solution);
        setScore(s);
        setSolutionShown(false);
        onChecked(block.id, s);
      }}
      onShowSolution={() => {
        setOrder(solution);
        setScore(scoreSequence(solution, solution));
        setSolutionShown(true);
      }}
    >
      <ol className="list-none p-0 m-0 grid gap-2 max-w-[68ch]">
        {order.map((id, i) => {
          const item = byId.get(id)!;
          const text = item.text[locale];
          return (
            <li
              key={id}
              data-testid={`seq-item-${id}`}
              className={"flex items-center gap-3 p-2 ps-3 rounded-xl border bg-surface " + (score ? (score.perItem[id] ? "border-leaf" : "border-warn") : "border-line")}
            >
              <span className="inline-grid place-items-center shrink-0 w-8 h-8 rounded-full bg-paper border border-line font-bold text-sm" aria-hidden="true">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="sr-only">{t("games.position", { position: i + 1 })}: </span>
                <span className="font-semibold">{text}</span>
                {showDetails && item.detail && <span className="block text-sm text-muted">{item.detail[locale]}</span>}
              </span>
              {score && <Mark ok={score.perItem[id]} />}
              <span className="flex gap-1 shrink-0">
                <button
                  type="button"
                  ref={(b) => { buttons.current.set(`${id}:up`, b); }}
                  onClick={() => shift(i, -1)}
                  disabled={i === 0}
                  aria-label={t("games.moveUp", { item: text })}
                  className="w-11 h-11 rounded-lg border border-line bg-paper font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-leaf-tint"
                >
                  <span aria-hidden="true">↑</span>
                </button>
                <button
                  type="button"
                  ref={(b) => { buttons.current.set(`${id}:down`, b); }}
                  onClick={() => shift(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label={t("games.moveDown", { item: text })}
                  className="w-11 h-11 rounded-lg border border-line bg-paper font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-leaf-tint"
                >
                  <span aria-hidden="true">↓</span>
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </GameFrame>
  );
}

// ---- Match ------------------------------------------------------------------------

function MatchGame({ block, locale, teacher, onChecked }: GameProps<MatchBlock>) {
  const t = useTranslations("lessons");
  const ids = useMemo(() => block.pairs.map((p) => p.id), [block.pairs]);
  const rows = useMemo(() => shuffle(block.pairs, `${block.id}:left`), [block.pairs, block.id]);
  const choices = useMemo(() => shuffle(block.pairs, `${block.id}:right`), [block.pairs, block.id]);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [score, setScore] = useState<Score | null>(null);
  const [solutionShown, setSolutionShown] = useState(false);
  const complete = ids.every((id) => answers[id]);

  return (
    <GameFrame
      block={block}
      locale={locale}
      teacher={teacher}
      score={score}
      canCheck={complete}
      solutionShown={solutionShown}
      onCheck={() => {
        const s = scoreMatch(answers, ids);
        setScore(s);
        setSolutionShown(false);
        onChecked(block.id, s);
      }}
      onShowSolution={() => {
        const solved = Object.fromEntries(ids.map((id) => [id, id]));
        setAnswers(solved);
        setScore(scoreMatch(solved, ids));
        setSolutionShown(true);
      }}
    >
      <ul className="list-none p-0 m-0 grid gap-2 max-w-[68ch]">
        {rows.map((pair) => {
          const selectId = `${block.id}-${pair.id}`;
          return (
            <li
              key={pair.id}
              className={"grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] items-center p-3 rounded-xl border bg-surface " + (score ? (score.perItem[pair.id] ? "border-leaf" : "border-warn") : "border-line")}
            >
              <label htmlFor={selectId} className="font-semibold">{pair.left[locale]}</label>
              <select
                id={selectId}
                value={answers[pair.id] ?? ""}
                onChange={(e) => {
                  setAnswers((a) => ({ ...a, [pair.id]: e.target.value || undefined }));
                  setScore(null);
                  setSolutionShown(false);
                }}
                className="min-h-11 w-full rounded-lg border border-line bg-surface px-2 text-[1rem]"
              >
                <option value="">{t("games.choose")}</option>
                {choices.map((c) => <option key={c.id} value={c.id}>{c.right[locale]}</option>)}
              </select>
              {score ? <Mark ok={score.perItem[pair.id]} /> : <span className="hidden sm:block w-7" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </GameFrame>
  );
}

// ---- Categorize ---------------------------------------------------------------------

function CategorizeGame({ block, locale, teacher, onChecked }: GameProps<CategorizeBlock>) {
  const items = useMemo(() => shuffle(block.items, block.id), [block.items, block.id]);
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});
  const [score, setScore] = useState<Score | null>(null);
  const [solutionShown, setSolutionShown] = useState(false);
  const complete = block.items.every((i) => answers[i.id]);

  return (
    <GameFrame
      block={block}
      locale={locale}
      teacher={teacher}
      score={score}
      canCheck={complete}
      solutionShown={solutionShown}
      onCheck={() => {
        const s = scoreCategorize(answers, block.items);
        setScore(s);
        setSolutionShown(false);
        onChecked(block.id, s);
      }}
      onShowSolution={() => {
        const solved = Object.fromEntries(block.items.map((i) => [i.id, i.category]));
        setAnswers(solved);
        setScore(scoreCategorize(solved, block.items));
        setSolutionShown(true);
      }}
    >
      <ul className="list-none p-0 m-0 grid gap-2 max-w-[68ch]">
        {items.map((item) => {
          const ok = score?.perItem[item.id];
          return (
            <li
              key={item.id}
              className={"p-3 rounded-xl border bg-surface grid gap-2 " + (score ? (ok ? "border-leaf" : "border-warn") : "border-line")}
            >
              <fieldset className="border-0 p-0 m-0 grid gap-2">
                <legend className="font-semibold p-0 mb-1 flex items-start gap-2">
                  {score && <Mark ok={!!ok} />}
                  <span>{item.text[locale]}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {block.categories.map((c) => {
                    const checked = answers[item.id] === c.id;
                    return (
                      <label
                        key={c.id}
                        className={"inline-flex items-center gap-2 min-h-11 px-3 rounded-lg border cursor-pointer " + (checked ? "border-leaf bg-leaf-tint" : "border-line bg-paper")}
                      >
                        <input
                          type="radio"
                          name={`${block.id}-${item.id}`}
                          value={c.id}
                          checked={checked}
                          onChange={() => {
                            setAnswers((a) => ({ ...a, [item.id]: c.id }));
                            setScore(null);
                            setSolutionShown(false);
                          }}
                          className="accent-[var(--leaf)] w-4 h-4"
                        />
                        <span>{c.label[locale]}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {score && item.explanation && (solutionShown || !ok || score.correct === score.total) && (
                <p className="m-0 text-sm text-muted">{item.explanation[locale]}</p>
              )}
            </li>
          );
        })}
      </ul>
    </GameFrame>
  );
}
