"use client";

// Autonomy heartbeat · runs the Executive Brain cycle:
//   1. once when the app loads (after both stores hydrate)
//   2. every 5 minutes while the app stays open
//   3. debounced after business-data changes (new supplier, quote…)
//
// Honest constraint: this is a local-first app with no server cron —
// autonomy runs while a browser tab is open on any device. In cloud
// mode every device shares the same data, so one open tab anywhere
// keeps the organization working.

import { useI18n } from "@/lib/i18n/provider";
import { useStore } from "@/lib/store";
import { useOsStore } from "@/lib/os/osStore";
import { useEffect, useRef } from "react";

const CYCLE_INTERVAL_MS = 5 * 60_000;
const DATA_DEBOUNCE_MS = 4_000;

export function AutonomyRunner() {
  const { lang } = useI18n();
  const hydrated = useStore((s) => s.hydrated);
  const osHydrated = useOsStore((s) => s.osHydrated);
  const hydrateOs = useOsStore((s) => s.hydrateOs);
  const runCycle = useOsStore((s) => s.runCycle);
  const autonomyEnabled = useOsStore((s) => s.autonomyEnabled);

  const langRef = useRef(lang);
  langRef.current = lang;

  // Hydrate the OS state alongside the app.
  useEffect(() => {
    hydrateOs();
  }, [hydrateOs]);

  // First cycle + steady heartbeat.
  useEffect(() => {
    if (!hydrated || !osHydrated || !autonomyEnabled) return;
    // Give the UI a beat to paint before the first cycle.
    const boot = window.setTimeout(() => runCycle(langRef.current), 1_200);
    const tick = window.setInterval(() => runCycle(langRef.current), CYCLE_INTERVAL_MS);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(tick);
    };
  }, [hydrated, osHydrated, autonomyEnabled, runCycle]);

  // React to business-data changes — new information triggers thinking.
  useEffect(() => {
    if (!hydrated || !osHydrated || !autonomyEnabled) return;
    let timer: number | undefined;
    let last = "";
    const unsub = useStore.subscribe((s) => {
      // Cheap change fingerprint over entity counts + latest update.
      const fp = [
        s.suppliers.length, s.quotes.length, s.samples.length,
        s.materials.length, s.events.length, s.files.length,
        s.suppliers[0]?.updatedAt ?? "",
      ].join("|");
      if (fp === last) return;
      last = fp;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => runCycle(langRef.current), DATA_DEBOUNCE_MS);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [hydrated, osHydrated, autonomyEnabled, runCycle]);

  return null;
}
