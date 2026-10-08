"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SimulationManifest } from "@/lib/simulation/manifest";
import type { Activity } from "@/lib/activity/schema";
import type { ObservableValues } from "@/lib/simulation/protocol";
import { SimulationHost } from "./SimulationHost";
import { ActivityPanel } from "./ActivityPanel";

const FREE = "__free__";
const NO_LOCKS: string[] = [];

/** One simulation, several activities: switching activity re-initializes the same package with new configuration. */
export function SimulationWorkspace({
  manifest,
  activities,
  locale,
}: {
  manifest: SimulationManifest;
  activities: Activity[];
  locale: "he" | "en";
}) {
  const t = useTranslations("sim");
  const [selected, setSelected] = useState<string>(activities[0]?.id ?? FREE);
  const [observables, setObservables] = useState<ObservableValues>({});
  const activity = activities.find((a) => a.id === selected);

  const defaults = Object.fromEntries(manifest.parameters.map((p) => [p.id, p.default]));
  const params = activity ? { ...defaults, ...activity.config.params } : defaults;
  const locked = activity ? activity.config.lockedParams : NO_LOCKS;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
      <div className="min-w-0">
        <SimulationHost
          // A new key gives the activity a fresh simulation run with its own configuration.
          key={`${selected}:${locale}`}
          entry={manifest.entry!}
          title={manifest.title[locale]}
          locale={locale}
          params={params}
          lockedParams={locked}
          onObservables={setObservables}
        />
      </div>

      <aside className="bg-surface border border-line rounded-2xl p-5 lg:sticky lg:top-4" aria-labelledby="activities-title">
        <h2 id="activities-title" className="text-lg font-semibold m-0">{t("activitiesTitle")}</h2>
        <p className="text-sm text-muted mt-1 mb-3">{t("chooseActivity")}</p>
        <div role="radiogroup" aria-labelledby="activities-title" className="grid gap-2 mb-5">
          {[...activities.map((a) => ({ id: a.id, title: a.title[locale], audience: a.audience[locale] })), { id: FREE, title: t("freeExplore"), audience: "" }].map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected === o.id}
              onClick={() => { setSelected(o.id); setObservables({}); }}
              className={"text-start p-3 rounded-xl border min-h-11 " + (selected === o.id ? "border-leaf bg-leaf-tint" : "border-line hover:bg-paper")}
            >
              <span className="block font-semibold">{o.title}</span>
              {o.audience && <span className="block text-sm text-muted">{o.audience}</span>}
            </button>
          ))}
        </div>
        {activity && <ActivityPanel key={activity.id} activity={activity} locale={locale} observables={observables} />}
      </aside>
    </div>
  );
}
