import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("sim");
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-semibold m-0">404</h1>
      <p className="mt-4">
        <Link href="/library" className="text-leaf-dark font-semibold">{t("back")}</Link>
      </p>
    </div>
  );
}
