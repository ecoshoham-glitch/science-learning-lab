import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { SimulationManifest } from "@/lib/simulation/manifest";
import { concepts, difficulties, interactions, label, subjects } from "@/content/taxonomy";

/**
 * A library entry. Laid out like a specimen label: subject and grades on top,
 * title, summary, then the concepts it teaches.
 */
export function SimulationCard({
  manifest: m,
  activityCount,
  locale,
}: {
  manifest: SimulationManifest;
  activityCount: number;
  locale: "he" | "en";
}) {
  const t = useTranslations("library");
  const available = m.status === "available";

  return (
    <article className="bg-surface border border-line rounded-2xl p-5 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
      <div>
        <p className="m-0 text-sm text-muted">
          <span className="font-semibold text-leaf-dark">{label(subjects, m.subject, locale)}</span>
          <span aria-hidden="true"> | </span>
          {t("grades", { from: m.grades.from, to: m.grades.to })}
          <span aria-hidden="true"> | </span>
          {label(interactions, m.interaction, locale)}
          <span aria-hidden="true"> | </span>
          {label(difficulties, m.difficulty, locale)}
        </p>
        <h3 className="text-xl font-semibold mt-1 mb-2">
          {available ? (
            <Link href={`/simulations/${m.id}`} className="text-ink no-underline hover:underline">
              {m.title[locale]}
            </Link>
          ) : (
            m.title[locale]
          )}
        </h3>
        <p className="m-0 text-muted max-w-[70ch]">{m.summary[locale]}</p>
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0 mt-3" aria-label={t("subject")}>
          {m.concepts.map((c) => (
            <li key={c} className="text-sm px-2.5 py-0.5 rounded-full bg-leaf-tint text-leaf-dark">
              {label(concepts, c, locale)}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end gap-3">
        {available ? (
          <>
            <span className="text-sm text-muted">{t("activities", { count: activityCount })}</span>
            <Link
              href={`/simulations/${m.id}`}
              className="inline-flex items-center min-h-11 px-4 rounded-xl bg-leaf text-white font-semibold no-underline hover:bg-leaf-dark"
              aria-label={`${t("open")}: ${m.title[locale]}`}
            >
              {t("open")}
            </Link>
          </>
        ) : (
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-paper border border-line text-muted">{t("planned")}</span>
        )}
      </div>
    </article>
  );
}
