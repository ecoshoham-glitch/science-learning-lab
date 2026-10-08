import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitch } from "./LanguageSwitch";
import { NavLink } from "./NavLink";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="bg-surface border-b border-line">
      <p className="bg-warn-soft text-warn text-sm text-center px-4 py-1">{t("prototype")}</p>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-lg text-ink no-underline">
          <Logo />
          <span>{t("brand")}</span>
        </Link>
        <nav aria-label={t("brand")} className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <ul className="flex gap-1 sm:gap-2 list-none m-0 p-0">
            <li><NavLink href="/subjects">{t("subjects")}</NavLink></li>
            <li><NavLink href="/library">{t("library")}</NavLink></li>
            <li><NavLink href="/lessons">{t("lessons")}</NavLink></li>
            <li><NavLink href="/teachers">{t("teachers")}</NavLink></li>
          </ul>
        </nav>
        <div className="ms-auto">
          <LanguageSwitch label={t("switchLanguageLabel")} text={t("switchLanguage")} />
        </div>
      </div>
    </header>
  );
}

/** A small flask mark: the meniscus line doubles as a data curve. */
function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path d="M10 3h8M11.5 3v7L5 22a2.5 2.5 0 0 0 2.2 3.7h13.6A2.5 2.5 0 0 0 23 22l-6.5-12V3" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7.2 18.5c3-2.6 5.4 1.8 8.4-.6 1.6-1.3 3-1.4 5-.3" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
