import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["he", "en"],
  defaultLocale: "he",
  // Hebrew-first platform: do not switch to English just because a browser is set to English.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Text direction per locale. Add new locales here when they are introduced. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};
