import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { lessons, simulations } from "@/content/registry";
import { subjects, topicsFor } from "@/content/taxonomy";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "subjects" });
  return { title: t("title") };
}

export default async function SubjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as "he" | "en";
  const t = await getTranslations("subjects");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-semibold m-0">{t("title")}</h1>
      <p className="text-muted mt-2 mb-8 max-w-[70ch]">{t("lead")}</p>
      <ul className="grid gap-4 sm:grid-cols-2 list-none p-0 m-0">
        {Object.entries(subjects).map(([id, name]) => {
          const sims = simulations.filter((s) => s.subject === id && s.status === "available").length;
          const less = lessons.filter((l) => l.subject === id).length;
          const active = sims + less > 0;
          return (
            <li key={id}>
              <article className={"h-full rounded-2xl border p-5 grid gap-2 " + (active ? "bg-surface border-line" : "bg-paper border-dashed border-line")}>
                <h2 className="text-2xl font-semibold m-0">
                  {active ? (
                    <Link href={`/subjects/${id}`} className="text-ink no-underline hover:underline">{name[locale]}</Link>
                  ) : (
                    <span className="text-muted">{name[locale]}</span>
                  )}
                </h2>
                {active ? (
                  <>
                    <p className="m-0 text-muted">{t("items", { lessons: less, sims })}</p>
                    <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                      {topicsFor(id).map((topic) => (
                        <li key={topic.id} className="text-sm px-2.5 py-0.5 rounded-full bg-leaf-tint text-leaf-dark">{topic.title[locale]}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="m-0 text-sm text-muted">{t("soon")}</p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
