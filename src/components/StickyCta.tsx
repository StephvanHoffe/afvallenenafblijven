"use client";

import Link from "@/i18n/Link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: { label: "Maak mijn persoonlijke plan" },
  en: { label: "Create my personal plan" },
});

/** Vaste knop onderin op mobiel, zichtbaar zodra de bezoeker voorbij de hero scrolt. */
export function StickyCta({ href = "/start", label }: { href?: string; label?: string }) {
  const c = copy[useLocale()];
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 650);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={`no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 p-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <Link href={href} className="btn-primary w-full" tabIndex={visible ? 0 : -1}>
        {label ?? c.label} <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
