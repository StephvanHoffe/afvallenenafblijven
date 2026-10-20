"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ververst Mijn schema's zodra een schema dat wordt gemaakt klaar is, zodat de
 * klant niet zelf hoeft te herladen.
 */
export function PlanStatusRefresher() {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/account/status", { cache: "no-store" });
        const { busy } = (await res.json()) as { busy: boolean };
        if (!busy && !stopped) {
          stopped = true;
          window.clearInterval(timer);
          router.refresh();
        }
      } catch {
        // Netwerkfout: volgende keer opnieuw proberen.
      }
    }, 8000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [router]);
  return null;
}
