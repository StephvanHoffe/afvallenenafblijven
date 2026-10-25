"use client";

import { useLocale } from "@/i18n/client";
import { openCookieSettings } from "@/lib/consent";

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  const l = useLocale();
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      {l === "en" ? "Cookie settings" : "Cookie-instellingen"}
    </button>
  );
}
