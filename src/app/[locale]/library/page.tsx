import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { simulations, activities } from "@/content/registry";
import { LibraryBrowser } from "@/components/LibraryBrowser";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "library" });
  return { title: t("title") };
}

export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("library");

  const activityCounts = Object.fromEntries(
    simulations.map((s) => [s.id, activities.filter((a) => a.simulation.id === s.id).length]),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-semibold m-0">{t("title")}</h1>
      <p className="text-muted mt-2 mb-8">{t("lead")}</p>
      <LibraryBrowser simulations={simulations} activityCounts={activityCounts} />
    </div>
  );
}
