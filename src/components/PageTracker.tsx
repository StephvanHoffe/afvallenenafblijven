"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/** Mijn schema's en de schema's zelf horen niet bij de funnel. */
const SKIP = /^\/(en\/)?(account|schema)(\/|$)/;

/** Meet elke paginaweergave voor de funnel (anoniem, zie src/lib/track.ts). */
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!SKIP.test(pathname)) track("page_view");
  }, [pathname]);
  return null;
}
