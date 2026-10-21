"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ververst Mijn schema's zodra een schema dat wordt gemaakt klaarstaat, zodat de
 * klant niet zelf hoeft te herladen. De eerste minuten kijken we vaak (een
 * weegmoment is binnen een halve minuut klaar), daarna rustiger: een nieuw
 * schema staat binnen 2 uur klaar.
 */
export function PlanStatusRefresher() {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const started = Date.now();
    async function check() {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const { busy } = (await res.json()) as { busy: boolean };
        if (!busy && !stopped) {
          stopped = true;
          router.refresh();
          return;
        }
      } catch {
        // Netwerkfout: volgende keer opnieuw proberen.
      }
      if (!stopped) timer = window.setTimeout(check, Date.now() - started < 2 * 60 * 1000 ? 8000 : 30000);
    }
    timer = window.setTimeout(check, 8000);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [router]);
  return null;
}
