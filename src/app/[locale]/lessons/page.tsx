import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { lessons } from "@/content/registry";
import { label, subjects } from "@/content/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lessons" });
  return { title: t("title") };
}

export default async function LessonsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as "he" | "en";
  const t = await getTranslations("lessons");
  const tl = await getTranslations("library");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-semibold m-0">{t("title")}</h1>
      <p className="text-muted mt-2 mb-8 max-w-[70ch]">{t("lead")}</p>
      {lessons.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 list-none p-0 m-0">
          {lessons.map((l) => (
            <li key={l.id}>
              <article className="bg-surface border border-line rounded-2xl p-5 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
                <div>
                  <p className="m-0 text-sm text-muted">
                    <span className="font-semibold text-leaf-dark">{label(subjects, l.subject, locale)}</span>
                    <span aria-hidden="true"> | </span>
                    {tl("grades", { from: l.grades.from, to: l.grades.to })}
                    <span aria-hidden="true"> | </span>
                    {t("minutes", { count: l.durationMinutes })}
                    <span aria-hidden="true"> | </span>
                    {t("blocks", { count: l.blocks.length })}
                  </p>
                  <h2 className="text-xl font-semibold mt-1 mb-2">
                    <Link href={`/lessons/${l.id}`} className="text-ink no-underline hover:underline">{l.title[locale]}</Link>
                  </h2>
                  <p className="m-0 text-muted max-w-[70ch]">{l.summary[locale]}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {l.provenance.source === "transcript" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-leaf-tint text-leaf-dark">{t("fromTranscript")}</span>
                    )}
                    {l.provenance.pipeline.contentReview.status !== "done" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warn-soft text-warn">{t("notReviewed")}</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/lessons/${l.id}`}
                  className="inline-flex items-center min-h-11 px-4 rounded-xl bg-leaf text-white font-semibold no-underline hover:bg-leaf-dark"
                  aria-label={`${t("open")}: ${l.title[locale]}`}
                >
                  {t("open")}
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
