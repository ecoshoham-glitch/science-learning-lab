import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getActivity, getLesson, getMedia, getSimulation, lessons } from "@/content/registry";
import type { Media } from "@/lib/media/schema";
import type { SimulationManifest } from "@/lib/simulation/manifest";
import type { Activity } from "@/lib/activity/schema";
import type { Lesson } from "@/lib/lesson/schema";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

type Params = Promise<{ locale: string; id: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => lessons.map((l) => ({ locale, id: l.id })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const lesson = getLesson(id);
  return { title: lesson ? lesson.title[locale as "he" | "en"] : undefined };
}

const STEP_ORDER = ["rights", "privacy", "analysis", "outline", "generation", "teacherReview", "contentReview"] as const;

export default async function LessonPage({ params }: { params: Params }) {
  const { locale: raw, id } = await params;
  setRequestLocale(raw);
  const locale = raw as "he" | "en";
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const t = await getTranslations("lessons");

  // Resolve only the library items this lesson references.
  const simulations: Record<string, SimulationManifest> = {};
  const activities: Record<string, Activity> = {};
  const mediaById: Record<string, Media> = {};
  for (const b of lesson.blocks) {
    if (b.kind === "timeline") {
      for (const e of b.events) {
        const m = e.media ? getMedia(e.media) : undefined;
        if (m) mediaById[m.id] = m;
      }
    }
    if (b.kind !== "simulation") continue;
    const sim = getSimulation(b.simulation.id);
    if (sim) simulations[sim.id] = sim;
    const act = b.activityId ? getActivity(b.activityId) : undefined;
    if (act) activities[act.id] = act;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <p className="m-0 mb-3">
        <Link href="/lessons" className="text-leaf-dark font-semibold">{t("title")}</Link>
      </p>
      <header className="mb-6 grid gap-2">
        <h1 className="text-3xl sm:text-4xl font-semibold m-0 max-w-[30ch]">{lesson.title[locale]}</h1>
        <p className="text-muted m-0">{lesson.audience[locale]}</p>
        <div className="flex flex-wrap gap-2">
          {lesson.provenance.source === "transcript" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-leaf-tint text-leaf-dark">{t("fromTranscript")}</span>
          )}
          {lesson.provenance.pipeline.contentReview.status !== "done" && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warn-soft text-warn">{t("notReviewed")}</span>
          )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 items-start mb-8">
        <details className="bg-surface border border-line rounded-2xl p-4">
          <summary className="cursor-pointer font-semibold min-h-8">{t("objectives")}</summary>
          <ul className="mt-2 mb-0 ps-5">{lesson.objectives.map((o, i) => <li key={i}>{o[locale]}</li>)}</ul>
          <p className="text-sm font-semibold mt-4 mb-1">{t("misconceptions")}</p>
          <ul className="m-0 ps-5 text-sm">{lesson.misconceptions.map((m, i) => <li key={i}>{m[locale]}</li>)}</ul>
          <p className="text-sm text-muted mt-3 mb-0">{lesson.curriculum.note[locale]}</p>
        </details>
        <Provenance lesson={lesson} locale={locale} t={t} />
      </div>

      <LessonPlayer lesson={lesson} locale={locale} simulations={simulations} activities={activities} media={mediaById} />
    </div>
  );
}

function Provenance({
  lesson,
  locale,
  t,
}: {
  lesson: Lesson;
  locale: "he" | "en";
  t: Awaited<ReturnType<typeof getTranslations<"lessons">>>;
}) {
  const p = lesson.provenance;
  const tone = { done: "bg-leaf text-white border-leaf", pending: "bg-surface text-muted border-line", "skipped-demo": "bg-signal-soft text-ink border-signal" };
  const mark = { done: "✓", pending: "", "skipped-demo": "–" };
  return (
    <details className="bg-surface border border-line rounded-2xl p-4">
      <summary className="cursor-pointer font-semibold min-h-8">{t("howMade")}</summary>
      {p.transcript && (
        <p className="text-sm mt-2 mb-3">
          <strong>{t("transcript")}: </strong>{p.transcript.label[locale]}
          <br />
          <span className="text-muted">{t("transcriptNote")}</span>
        </p>
      )}
      <ol className="list-none p-0 m-0 grid gap-3">
        {STEP_ORDER.map((key) => {
          const step = p.pipeline[key];
          return (
            <li key={key} className="grid grid-cols-[1.75rem_1fr] gap-3 items-start">
              <span aria-hidden="true" className={"inline-grid place-items-center w-7 h-7 rounded-full border text-sm font-bold " + tone[step.status]}>
                {mark[step.status]}
              </span>
              <span className="text-sm">
                <span className="font-semibold">{t(`steps.${key}`)}</span>
                <span className="text-muted"> ({t(`status.${step.status}`)})</span>
                <span className="block text-muted">{step.note[locale]}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
