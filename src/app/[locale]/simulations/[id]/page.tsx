import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getActivitiesFor, getSimulation, simulations } from "@/content/registry";
import { concepts, label, subjects } from "@/content/taxonomy";
import { SimulationWorkspace } from "@/components/SimulationWorkspace";

type Params = Promise<{ locale: string; id: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    simulations.filter((s) => s.status === "available").map((s) => ({ locale, id: s.id })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const sim = getSimulation(id);
  return { title: sim ? sim.title[locale as "he" | "en"] : undefined };
}

export default async function SimulationPage({ params }: { params: Params }) {
  const { locale: rawLocale, id } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as "he" | "en";
  const sim = getSimulation(id);
  if (!sim || sim.status !== "available") notFound();
  const t = await getTranslations("sim");
  const reviewed = sim.validation.status === "reviewed";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <p className="m-0 mb-3">
        <Link href="/library" className="text-leaf-dark font-semibold">{t("back")}</Link>
      </p>
      <header className="mb-6">
        <p className="m-0 text-sm text-muted">
          <span className="font-semibold text-leaf-dark">{label(subjects, sim.subject, locale)}</span>
          <span aria-hidden="true"> | </span>
          <span className="ltr-island">{t("version", { version: sim.version })}</span>
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold mt-1 mb-2">{sim.title[locale]}</h1>
        <p className="text-muted m-0 max-w-[70ch]">{sim.summary[locale]}</p>
        {!reviewed && (
          <p className="inline-block mt-3 mb-0 text-sm font-semibold px-3 py-1 rounded-full bg-warn-soft text-warn">{t("notReviewed")}</p>
        )}
      </header>

      <SimulationWorkspace manifest={sim} activities={getActivitiesFor(sim.id)} locale={locale} />

      <section className="mt-10 grid gap-6 md:grid-cols-2" aria-labelledby="about-title">
        <h2 id="about-title" className="sr-only">{t("about")}</h2>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h3 className="text-lg font-semibold m-0 mb-2">{t("model")}</h3>
          <p className="m-0">{sim.scientificModel.description[locale]}</p>
          <h3 className="text-lg font-semibold mt-5 mb-2">{t("assumptions")}</h3>
          <ul className="m-0 ps-5">
            {sim.scientificModel.assumptions.map((a, i) => <li key={i}>{a[locale]}</li>)}
          </ul>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-5">
          <h3 className="text-lg font-semibold m-0 mb-2">{t("concepts")}</h3>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {sim.concepts.map((c) => (
              <li key={c} className="text-sm px-2.5 py-0.5 rounded-full bg-leaf-tint text-leaf-dark">{label(concepts, c, locale)}</li>
            ))}
          </ul>
          <p className="mt-5 mb-1 text-sm">{sim.accessibility[locale]}</p>
          <p className="m-0 text-sm text-muted ltr-island">{t("license", { license: sim.license.id })}</p>
        </div>
      </section>
    </div>
  );
}
