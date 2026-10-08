import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** "/" goes to the default language. Hebrew-first; the language switch remembers nothing yet. */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
