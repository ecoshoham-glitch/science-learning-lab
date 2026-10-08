import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-muted flex flex-wrap gap-x-6 gap-y-1">
        <span className="ltr-island">{t("text")}</span>
        <span>{t("privacy")}</span>
      </div>
    </footer>
  );
}
