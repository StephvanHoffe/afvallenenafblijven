"use client";

import { useEffect, useState } from "react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    units: ["dagen", "uur", "min", "sec"],
    short: ["d", "u", "m", "s"],
    left: "Nog",
    ended: "Laatste kans",
  },
  en: {
    units: ["days", "hrs", "min", "sec"],
    short: ["d", "h", "m", "s"],
    left: "",
    ended: "Last chance",
  },
});

function parts(ms: number): number[] {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Aftelklok tot het einde van een actie. De tijd komt pas na het laden in
 * beeld (de klok van de server kan afwijken van die van de bezoeker); tot dan
 * staan er streepjes, zodat er niets verspringt.
 */
export function Countdown({
  endsAt,
  variant = "blocks",
  className = "",
}: {
  /** Einde van de actie (ISO). */
  endsAt: string;
  /** "blocks": vier vakjes; "inline": één regel, bijv. "Nog 3d 04u 12m 09s". */
  variant?: "blocks" | "inline";
  className?: string;
}) {
  const c = copy[useLocale()];
  const end = Date.parse(endsAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const values = now === null ? null : parts(end - now);
  const over = now !== null && now >= end;

  if (variant === "inline") {
    return (
      <span className={`tabular-nums ${className}`}>
        {over
          ? c.ended
          : `${c.left ? `${c.left} ` : ""}${values ? values.map((v, i) => `${i === 0 ? v : pad(v)}${c.short[i]}`).join(" ") : "–"}`}
      </span>
    );
  }
  return (
    <div className={`flex gap-2 ${className}`} role="timer" aria-live="off">
      {c.units.map((unit, i) => (
        <span key={unit} className="grid min-w-[3.25rem] place-items-center rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15">
          <span className="text-2xl leading-none font-extrabold tabular-nums">{values ? (i === 0 ? values[i] : pad(values[i])) : "--"}</span>
          <span className="mt-1 text-[0.6875rem] font-semibold tracking-wide text-white/60 uppercase">{unit}</span>
        </span>
      ))}
    </div>
  );
}
