"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/** Switches language on the same page. usePathname returns the current path without the locale prefix. */
export function LanguageSwitch({ label, text }: { label: string; text: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "he" ? "en" : "he";
  return (
    <Link
      href={pathname}
      locale={other}
      lang={other}
      aria-label={label}
      className="inline-flex items-center min-h-11 px-3 rounded-lg border border-line text-ink no-underline font-semibold hover:bg-paper"
    >
      {text}
    </Link>
  );
}
