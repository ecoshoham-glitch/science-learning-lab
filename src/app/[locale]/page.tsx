import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { heroCurvePoints } from "@/lib/hero-curve";
import { simulations, getActivitiesFor } from "@/content/registry";
import { SimulationCard } from "@/components/SimulationCard";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <section className="bg-surface border-b border-line">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 grid gap-10 md:grid-cols-[1fr_1.1fr] items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight m-0">{t("title")}</h1>
            <p className="text-lg text-muted mt-4 max-w-[38ch]">{t("lead")}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                href="/simulations/enzyme-lab"
                className="inline-flex items-center min-h-12 px-5 rounded-xl bg-leaf text-white font-semibold no-underline hover:bg-leaf-dark"
              >
                {t("ctaTry")}
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center min-h-12 px-5 rounded-xl border border-line text-ink font-semibold no-underline hover:bg-paper"
              >
                {t("ctaLibrary")}
              </Link>
            </div>
          </div>
          <HeroCurve
            title={t("curveTitle")}
            caption={t("curveCaption")}
            axisX={t("curveAxisX")}
            axisY={t("curveAxisY")}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold m-0 mb-6">{t("howTitle")}</h2>
        <ol className="grid gap-6 md:grid-cols-3 list-none p-0 m-0">
          {[t("howSims"), t("howActivities"), t("howTeachers")].map((text, i) => (
            <li key={i} className="border-s-4 border-leaf ps-4">
              <p className="m-0 text-ink">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-4" aria-labelledby="featured-title">
        <h2 id="featured-title" className="text-2xl font-semibold m-0 mb-6">{t("featuredTitle")}</h2>
        <ul className="grid gap-4 list-none p-0 m-0">
          {simulations
            .filter((s) => s.status === "available")
            .map((s) => (
              <li key={s.id}>
                <SimulationCard manifest={s} activityCount={getActivitiesFor(s.id).length} locale={locale as "he" | "en"} />
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}

/** Enzyme rate vs temperature, drawn from the same model the simulation uses. Always left-to-right, like any graph. */
function HeroCurve({ title, caption, axisX, axisY }: { title: string; caption: string; axisX: string; axisY: string }) {
  const W = 520, H = 300, L = 52, R = 16, T = 20, B = 48;
  const pts = heroCurvePoints(1);
  const sx = (t: number) => L + (t / 70) * (W - L - R);
  const sy = (r: number) => H - B - (r / 100) * (H - T - B);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.t).toFixed(1)} ${sy(p.rate).toFixed(1)}`).join(" ");
  const sample = [10, 20, 30, 37, 45, 55];

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="hero-curve-title hero-curve-caption" className="w-full h-auto" style={{ direction: "ltr" }}>
        <title id="hero-curve-title">{title}</title>
        {[0, 25, 50, 75, 100].map((y) => (
          <g key={y}>
            <line x1={L} x2={W - R} y1={sy(y)} y2={sy(y)} stroke="var(--line)" />
            <text x={L - 8} y={sy(y) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{y}</text>
          </g>
        ))}
        {[0, 10, 20, 30, 40, 50, 60, 70].map((x) => (
          <text key={x} x={sx(x)} y={H - B + 18} textAnchor="middle" fontSize="12" fill="var(--muted)">{x}</text>
        ))}
        <line x1={L} x2={W - R} y1={sy(0)} y2={sy(0)} stroke="var(--muted)" />
        <line x1={L} x2={L} y1={T} y2={sy(0)} stroke="var(--muted)" />
        <line x1={sx(37)} x2={sx(37)} y1={sy(100)} y2={sy(0)} stroke="var(--leaf)" strokeDasharray="4 4" />
        <text x={sx(37) + 10} y={sy(100) + 36} fontSize="13" fill="var(--leaf-dark)" fontWeight="600">37°C</text>
        <path
          d={d}
          fill="none"
          stroke="var(--leaf)"
          strokeWidth="3"
          strokeLinecap="round"
          className="hero-curve-path"
          style={{ ["--curve-length" as string]: "900" }}
          pathLength={900}
        />
        {sample.map((x) => (
          <circle key={x} cx={sx(x)} cy={sy(pts[x].rate)} r="5" fill="var(--signal)" stroke="#fff" strokeWidth="1.5" />
        ))}
        <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--ink)" fontWeight="600">{axisX}</text>
        <text x={14} y={(T + H - B) / 2} textAnchor="middle" fontSize="13" fill="var(--ink)" fontWeight="600" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>{axisY}</text>
      </svg>
      <figcaption id="hero-curve-caption" className="text-sm text-muted mt-2">
        <strong className="text-ink font-semibold">{title}. </strong>
        {caption}
      </figcaption>
    </figure>
  );
}
