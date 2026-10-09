import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getActivitiesFor, getTopicMap, lessons, simulations } from "@/content/registry";
import { inTopic, subjects, topicsFor } from "@/content/taxonomy";
import { SimulationCard } from "@/components/SimulationCard";
import { TopicMap } from "@/components/TopicMap";

type Params = Promise<{ locale: string; subject: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => Object.keys(subjects).map((subject) => ({ locale, subject })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, subject } = await params;
  return { title: subjects[subject]?.[locale as "he" | "en"] };
}

export default async function SubjectPage({ params }: { params: Params }) {
  const { locale: raw, subject } = await params;
  setRequestLocale(raw);
  const locale = raw as "he" | "en";
  const name = subjects[subject];
  if (!name) notFound();
  const t = await getTranslations("subjects");
  const tl = await getTranslations("lessons");

  const subjectSims = simulations.filter((s) => s.subject === subject);
  const subjectLessons = lessons.filter((l) => l.subject === subject);
  const topics = topicsFor(subject);
  // Titles for links inside topic maps (lesson and simulation ids → names in this language).
  const titles = Object.fromEntries([...lessons, ...simulations].map((x) => [x.id, x.title[locale]]));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="m-0 mb-3">
        <Link href="/subjects" className="text-leaf-dark font-semibold">{t("back")}</Link>
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold m-0">{name[locale]}</h1>
      <p className="text-muted mt-2 mb-8">{t("items", { lessons: subjectLessons.length, sims: subjectSims.filter((s) => s.status === "available").length })}</p>

      {topics.length === 0 ? (
        <p className="bg-surface border border-dashed border-line rounded-2xl p-6 text-muted">{t("soon")}</p>
      ) : (
        <div className="grid gap-10">
          <h2 className="sr-only">{t("topicsTitle", { subject: name[locale] })}</h2>
          {topics.map((topic) => {
            const tLessons = subjectLessons.filter((l) => inTopic(topic, l.keyConcepts));
            const tSims = subjectSims.filter((s) => inTopic(topic, s.concepts));
            return (
              <section key={topic.id} aria-labelledby={`topic-${topic.id}`} className="grid gap-4">
                <div className="border-s-4 border-leaf ps-4">
                  <h3 id={`topic-${topic.id}`} className="text-2xl font-semibold m-0">{topic.title[locale]}</h3>
                  <p className="m-0 mt-1 text-muted">{topic.description[locale]}</p>
                </div>
                {(() => {
                  const map = getTopicMap(topic.id);
                  return map ? <TopicMap map={map} locale={locale} titles={titles} /> : null;
                })()}
                {tLessons.length + tSims.length === 0 && <p className="m-0 text-muted">{t("emptyTopic")}</p>}
                {tLessons.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold m-0 mb-2">{t("lessonsHeading")}</h4>
                    <ul className="grid gap-3 list-none p-0 m-0">
                      {tLessons.map((l) => (
                        <li key={l.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <span>
                            {l.type === "assignment" && (
                              <span className="inline-block me-2 mb-1 text-xs font-bold px-2.5 py-1 rounded-full bg-leaf text-white">{tl("assignment")}</span>
                            )}
                            <Link href={`/lessons/${l.id}`} className="font-semibold text-ink no-underline hover:underline">{l.title[locale]}</Link>
                            <span className="block text-sm text-muted">{l.audience[locale]}</span>
                          </span>
                          {l.provenance.pipeline.contentReview.status !== "done" && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warn-soft text-warn">{tl("notReviewed")}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tSims.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold m-0 mb-2">{t("simsHeading")}</h4>
                    <ul className="grid gap-3 list-none p-0 m-0">
                      {tSims.map((s) => (
                        <li key={s.id}>
                          <SimulationCard manifest={s} activityCount={getActivitiesFor(s.id).length} locale={locale} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
