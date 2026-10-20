"use client";

import { useEffect, useRef, useState } from "react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

/**
 * Trainingen per week als staven, met het geplande aantal als stippellijn.
 * Weken waarin het schema gehaald is, zijn donkergroen; de andere lichter.
 * Het getal staat op elke staaf, dus kleur is nooit de enige drager.
 */

export interface WorkoutWeek {
  label: string;
  value: number;
  detail?: string;
}

const C = { onPlan: "#1c7a48", below: "#9cbfa9", active: "#17623b", grid: "#ecebe4", text: "#4d6156", ink: "#10231a", ref: "#10231a" };

const copy = defineCopy({
  nl: {
    chart: "grafiek",
    planned: (n: number) => `Gepland: ${n} per week`,
    onPlan: "Schema gehaald",
    below: "Minder dan gepland",
    unit: (n: number): string => (n === 1 ? "training" : "trainingen"),
  },
  en: {
    chart: "chart",
    planned: (n: number) => `Planned: ${n} a week`,
    onPlan: "On plan",
    below: "Fewer than planned",
    unit: (n: number) => (n === 1 ? "workout" : "workouts"),
  },
});

export function WorkoutWeeksChart({
  weeks,
  planned,
  description,
  height = 200,
}: {
  weeks: WorkoutWeek[];
  planned: number | null;
  description: string;
  height?: number;
}) {
  const c = copy[useLocale()];
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
  const max = Math.max(...weeks.map((w) => w.value), planned ?? 0, 1) + 0.5;
  const band = plotW / Math.max(weeks.length, 1);
  const barW = Math.min(24, band * 0.55);
  const y = (v: number) => m.top + plotH - (v / max) * plotH;
  const bottom = m.top + plotH;

  function bar(i: number, v: number) {
    const cx = m.left + band * i + band / 2;
    const x0 = cx - barW / 2;
    const top = y(v);
    const r = Math.min(4, barW / 2, bottom - top);
    return `M${x0},${bottom}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${bottom}Z`;
  }

  const tip = active !== null ? weeks[active] : null;
  const tipX = active !== null ? m.left + band * active + band / 2 : 0;
  const onPlan = (v: number) => planned === null || v >= planned;

  return (
    <div>
      <div ref={wrap} className="relative" role="group" aria-roledescription={c.chart} aria-label={description}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto max-w-full overflow-visible" aria-hidden>
          <line x1={m.left} x2={m.left + plotW} y1={bottom} y2={bottom} stroke={C.grid} strokeWidth="1" />
          {weeks.map((w, i) => {
            const cx = m.left + band * i + band / 2;
            return (
              <g key={w.label}>
                {w.value > 0 && <path d={bar(i, w.value)} fill={active === i ? C.active : onPlan(w.value) ? C.onPlan : C.below} />}
                <text x={cx} y={y(w.value) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} className="tabular-nums">
                  {w.value}
                </text>
                <text x={cx} y={height - 6} textAnchor="middle" fontSize="11" fill={C.text}>
                  {w.label}
                </text>
              </g>
            );
          })}
          {planned !== null && (
            <line x1={m.left} x2={m.left + plotW} y1={y(planned)} y2={y(planned)} stroke={C.ref} strokeWidth="1.25" strokeDasharray="4 4" opacity="0.7" />
          )}
        </svg>
        <div className="absolute inset-0 flex" style={{ paddingLeft: m.left, paddingRight: m.right }}>
          {weeks.map((w, i) => (
            <button
              key={w.label}
              type="button"
              className="h-full flex-1 cursor-default rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
              aria-label={`${w.label}: ${w.value} ${c.unit(w.value)}${w.detail ? `, ${w.detail}` : ""}`}
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
            style={{ top: 0, left: Math.min(Math.max(tipX - 70, 0), width - 170) }}
          >
            <p className="text-xs text-muted">{tip.label}</p>
            <p>
              <strong className="tabular-nums">{tip.value}</strong> {c.unit(tip.value)}
            </p>
            {tip.detail && <p className="text-xs text-muted">{tip.detail}</p>}
          </div>
        )}
      </div>
      {planned !== null && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: C.onPlan }} aria-hidden /> {c.onPlan}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: C.below }} aria-hidden /> {c.below}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-4 border-t-[1.5px] border-dashed border-ink/70" aria-hidden /> {c.planned(planned)}
          </li>
        </ul>
      )}
    </div>
  );
}
