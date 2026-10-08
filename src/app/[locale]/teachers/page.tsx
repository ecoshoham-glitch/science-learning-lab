import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers" });
  return { title: t("title") };
}

const ITEMS = ["classes", "builder", "ai", "transcript", "import", "studio"] as const;

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("teachers");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-3xl sm:text-4xl font-semibold m-0">{t("title")}</h1>
      <p className="text-muted mt-2 mb-6">{t("lead")}</p>
      <p className="bg-leaf-tint border border-leaf rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <span>{t("exampleText")}</span>
        <Link href="/lessons/viruses-intro" className="font-semibold text-leaf-dark">{t("exampleLink")}</Link>
      </p>
      <ul className="list-none p-0 m-0 grid gap-3">
        {ITEMS.map((k) => (
          <li key={k} className="flex items-center justify-between gap-4 bg-surface border border-line rounded-2xl p-4">
            <span>{t(`items.${k}`)}</span>
            <span className="text-sm text-muted shrink-0">{t("status")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
