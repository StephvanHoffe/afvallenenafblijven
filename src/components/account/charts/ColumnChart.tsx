"use client";

import { useEffect, useRef, useState } from "react";
import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

/**
 * Staafgrafiek met één reeks (bijv. het caloriedoel per periode). De staven
 * beginnen bij nul, met de waarde op de staaf; bij aanwijzen of focus zie je
 * de details.
 */

export interface Column {
  label: string;
  value: number;
  detail?: string;
}

const C = { bar: "#1c7a48", barActive: "#17623b", grid: "#ecebe4", text: "#4d6156", ink: "#10231a" };

const copy = defineCopy({
  nl: { chart: "grafiek" },
  en: { chart: "chart" },
});

function fmt(n: number, l: Locale) {
  return n.toLocaleString(intlLocale(l), { maximumFractionDigits: 0 });
}

export function ColumnChart({ columns, unit, description, height = 200 }: { columns: Column[]; unit: string; description: string; height?: number }) {
  const l = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.max(Math.round(entries[0].contentRect.width), 240)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = { top: 22, right: 8, bottom: 26, left: 8 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const max = Math.max(...columns.map((c) => c.value), 1);
  const band = plotW / Math.max(columns.length, 1);
  const barW = Math.min(24, band * 0.55);
  const y = (v: number) => m.top + plotH - (v / max) * plotH;

  function bar(i: number, v: number) {
    const cx = m.left + band * i + band / 2;
    const x0 = cx - barW / 2;
    const top = y(v);
    const bottom = m.top + plotH;
    const r = Math.min(4, barW / 2, bottom - top);
    // Afgeronde bovenkant, rechte onderkant op de basislijn.
    return `M${x0},${bottom}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${bottom}Z`;
  }

  const tip = active !== null ? columns[active] : null;
  const tipX = active !== null ? m.left + band * active + band / 2 : 0;

  return (
    <div ref={wrap} className="relative" role="group" aria-roledescription={copy[l].chart} aria-label={description}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto max-w-full overflow-visible" aria-hidden>
        <line x1={m.left} x2={m.left + plotW} y1={m.top + plotH} y2={m.top + plotH} stroke={C.grid} strokeWidth="1" />
        {columns.map((c, i) => {
          const cx = m.left + band * i + band / 2;
          return (
            <g key={c.label}>
              <path d={bar(i, c.value)} fill={active === i ? C.barActive : C.bar} />
              <text x={cx} y={y(c.value) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} className="tabular-nums">
                {fmt(c.value, l)}
              </text>
              <text x={cx} y={height - 6} textAnchor="middle" fontSize="11" fill={C.text}>
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Onzichtbare knoppen als vangvlak per staaf: groter dan de staaf zelf en met het toetsenbord bereikbaar. */}
      <div className="absolute inset-0 flex" style={{ paddingLeft: m.left, paddingRight: m.right }}>
        {columns.map((c, i) => (
          <button
            key={c.label}
            type="button"
            className="h-full flex-1 cursor-default rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
            aria-label={`${c.label}: ${fmt(c.value, l)} ${unit}${c.detail ? `, ${c.detail}` : ""}`}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          />
        ))}
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-line bg-white px-3 py-2 text-sm whitespace-nowrap shadow-[var(--shadow-lift)]"
          style={{ top: 0, left: Math.min(Math.max(tipX - 70, 0), width - 160) }}
        >
          <p className="text-xs text-muted">{tip.label}</p>
          <p>
            <strong className="tabular-nums">
              {fmt(tip.value, l)} {unit}
            </strong>
          </p>
          {tip.detail && <p className="text-xs text-muted">{tip.detail}</p>}
        </div>
      )}
    </div>
  );
}
