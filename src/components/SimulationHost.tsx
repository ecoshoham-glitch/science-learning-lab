"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createRateLimiter,
  newSessionId,
  parseSimMessage,
  type HostToSimMessage,
  type ObservableValues,
} from "@/lib/simulation/protocol";

/**
 * Runs one simulation package in a sandboxed iframe and speaks protocol v1 with it.
 *
 * Isolation (section 8.9):
 *  - sandbox="allow-scripts" without allow-same-origin gives the frame an opaque origin:
 *    no access to platform cookies, storage or DOM.
 *  - The package is served with a CSP that blocks all network access (next.config.ts).
 *  - Messages are accepted only from this frame's window, only if they validate, and rate-limited.
 *  - Production will additionally serve packages from a separate domain (NEXT_PUBLIC_SIM_ORIGIN).
 */
const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_SIM_ORIGIN ?? "null";
const READY_TIMEOUT_MS = 10000;

export function SimulationHost({
  entry,
  title,
  locale,
  params,
  lockedParams,
  onObservables,
}: {
  entry: string;
  title: string;
  locale: "he" | "en";
  params: Record<string, number>;
  lockedParams: string[];
  onObservables: (values: ObservableValues) => void;
}) {
  const t = useTranslations("sim");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(640);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Keep the latest callback without re-running the effect (which would re-init the simulation).
  const onObservablesRef = useRef(onObservables);
  useEffect(() => {
    onObservablesRef.current = onObservables;
  }, [onObservables]);

  const initRef = useRef({ locale, params, lockedParams });
  useEffect(() => {
    initRef.current = { locale, params, lockedParams };
  }, [locale, params, lockedParams]);

  useEffect(() => {
    const sessionId = newSessionId();
    const allow = createRateLimiter(30);
    let ready = false;

    const send = (msg: HostToSimMessage) => {
      // A sandboxed (opaque-origin) frame can only be addressed with "*". Nothing secret is ever sent.
      frameRef.current?.contentWindow?.postMessage(msg, EXPECTED_ORIGIN === "null" ? "*" : EXPECTED_ORIGIN);
    };

    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      if (event.origin !== EXPECTED_ORIGIN) return;
      if (!allow()) return;
      const msg = parseSimMessage(event.data);
      if (!msg) return;

      switch (msg.type) {
        case "ready":
          // The bridge repeats "ready" until it gets "init"; initialize each run only once.
          if (ready) break;
          ready = true;
          setStatus("ready");
          send({
            sll: 1,
            type: "init",
            payload: {
              sessionId,
              locale: initRef.current.locale,
              params: initRef.current.params,
              lockedParams: initRef.current.lockedParams,
            },
          });
          break;
        case "resize":
          setHeight(Math.round(msg.payload.height));
          break;
        case "observables":
          if (ready) onObservablesRef.current(msg.payload.values);
          break;
        case "event":
          // Events are available for future analytics and activity logic; not stored in the prototype.
          break;
      }
    };

    window.addEventListener("message", onMessage);
    const timer = window.setTimeout(() => {
      if (!ready) setStatus("error");
    }, READY_TIMEOUT_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [entry]);

  return (
    <div className="relative">
      {status === "loading" && (
        <p className="absolute inset-x-0 top-6 text-center text-muted" role="status">{t("loading")}</p>
      )}
      {status === "error" && (
        <p className="bg-warn-soft text-warn rounded-xl p-4 mb-3" role="alert">{t("loadError")}</p>
      )}
      <iframe
        ref={frameRef}
        src={entry}
        title={t("frameTitle", { title })}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        allow="camera 'none'; microphone 'none'; geolocation 'none'"
        loading="eager"
        style={{ height }}
        className="w-full block rounded-2xl bg-surface"
      />
      <p className="text-sm text-muted mt-2">{t("sandboxNote")}</p>
    </div>
  );
}
