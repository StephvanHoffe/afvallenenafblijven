"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ververst de pagina zolang er iets op de achtergrond gebeurt (bijv. een Instagram-post die wordt gemaakt). */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [router, seconds]);
  return null;
}
