"use client";

import { useState } from "react";

/**
 * Grafieken voor het beheer. Eén reeks per grafiek (geen twee y-assen), één
 * kleur, een tooltip bij hover/focus en altijd een tabel als alternatief.
 */

const BAR = "#1c7a48";
const BAR_ACTIVE = "#2a955c";
const GRID = "#e5e4dc";
const INK_MUTED = "#4d6156";

export interface ColumnPoint {
  key: string;
  /** Korte as-label, bijv. "3 feb" of "okt". */
  label: string;
  /** Lange omschrijving in de tooltip en tabel, bijv. "maandag 3 februari". */
  longLabel: string;
  value: number;
}

function niceStep(max: number): number {
  if (max <= 5) return 1;
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const formatters = {
  number: (v: number) => v.toLocaleString("nl-NL"),
  /** Centen als euro's; grote bedragen zonder centen. */
  euro: (cents: number) =>
    cents >= 100_000
      ? `€ ${Math.round(cents / 100).toLocaleString("nl-NL")}`
      : (cents / 100).toLocaleString("nl-NL", { style: "currency", currency: "EUR" }),
};

/** Kolomgrafiek met één reeks. `format` bepaalt hoe waarden worden getoond. */
export function ColumnChart({
  points,
  unit,
  title,
  format: formatKind = "number",
  labelEvery,
}: {
  points: ColumnPoint[];
  /** Wat de waarde is, voor de tooltip en tabel, bijv. "bezoeken". */
  unit: string;
  title: string;
  format?: keyof typeof formatters;
  labelEvery?: number;
}) {
  const format = formatters[formatKind];
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 8, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const slot = innerW / Math.max(1, points.length);
  const barW = Math.max(2, Math.min(28, slot - 2));
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const every = labelEvery ?? Math.max(1, Math.ceil(points.length / 8));
  const hovered = active !== null ? points[active] : null;
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`${title}: ${format(total)} ${unit} in totaal`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={INK_MUTED} className="tabular-nums">
              {format(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, (p.value / top) * innerH);
          const r = Math.min(4, h / 2, barW / 2);
          const base = pad.top + innerH;
          const path =
            h <= 0
              ? ""
              : `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + barW - r} Q${x + barW},${base - h} ${x + barW},${base - h + r} V${base} Z`;
          return (
            <g key={p.key}>
              {path && <path d={path} fill={active === i ? BAR_ACTIVE : BAR} />}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${p.longLabel}: ${format(p.value)} ${unit}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none"
              />
            </g>
          );
        })}
        {points.map((p, i) =>
          i % every === 0 || i === points.length - 1 ? (
            <text key={`l-${p.key}`} x={pad.left + i * slot + slot / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={INK_MUTED}>
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-[var(--shadow-soft)]"
          style={{ left: `clamp(0px, calc(${((pad.left + active * slot + slot / 2) / width) * 100}% - 5rem), calc(100% - 10rem))` }}
        >
          <p className="text-lg leading-tight font-extrabold tabular-nums">{format(hovered.value)}</p>
          <p className="text-xs text-muted">
            {unit} · {hovered.longLabel}
          </p>
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-semibold text-muted">Toon als tabel</summary>
        <table className="mt-2 w-full max-w-sm text-left text-sm">
          <thead>
            <tr>
              <th className="py-1 font-semibold">Periode</th>
              <th className="py-1 text-right font-semibold capitalize">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key} className="border-t border-line">
                <td className="py-1">{p.longLabel}</td>
                <td className="py-1 text-right tabular-nums">{format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

const WEEKDAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const WEEKDAYS_LONG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

/**
 * Weekdag × uur: hoe donkerder, hoe meer. Eén kleur (opeenvolgend van licht
 * naar donker). Hover of focus toont de waarden van dat uur.
 */
export function Heatmap({
  cells,
  measure,
  unit,
  secondary,
}: {
  cells: { weekday: number; hour: number; visits: number; orders: number }[];
  measure: "visits" | "orders";
  unit: string;
  secondary?: { key: "visits" | "orders"; unit: string };
}) {
  const [active, setActive] = useState<{ weekday: number; hour: number } | null>(null);
  const max = Math.max(1, ...cells.map((c) => c[measure]));
  const order = [1, 2, 3, 4, 5, 6, 0];
  const cell = (weekday: number, hour: number) => cells.find((c) => c.weekday === weekday && c.hour === hour);
  const current = active ? cell(active.weekday, active.hour) : null;
  const best = [...cells].sort((a, b) => b[measure] - a[measure]).slice(0, 3).filter((c) => c[measure] > 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-[2px] text-[0.6875rem]" aria-label={`${unit} per weekdag en uur`}>
          <thead>
            <tr>
              <th className="w-8" />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="font-semibold text-muted tabular-nums">
                  {h % 3 === 0 ? h : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.map((wd) => (
              <tr key={wd}>
                <th className="pr-1 text-left font-semibold text-muted">{WEEKDAYS[wd]}</th>
                {Array.from({ length: 24 }, (_, h) => {
                  const c = cell(wd, h);
                  const v = c?.[measure] ?? 0;
                  const share = v / max;
                  return (
                    <td key={h} className="p-0">
                      <button
                        type="button"
                        aria-label={`${WEEKDAYS_LONG[wd]} ${h}:00: ${v} ${unit}`}
                        onPointerEnter={() => setActive({ weekday: wd, hour: h })}
                        onPointerLeave={() => setActive(null)}
                        onFocus={() => setActive({ weekday: wd, hour: h })}
                        onBlur={() => setActive(null)}
                        className={`block h-6 w-full rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${
                          active?.weekday === wd && active.hour === h ? "ring-2 ring-brand-900" : ""
                        }`}
                        style={{ background: v === 0 ? "#f1f0ea" : `rgba(28, 122, 72, ${0.12 + share * 0.88})` }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 min-h-5 text-sm text-muted" aria-live="polite">
        {current && active
          ? `${WEEKDAYS_LONG[active.weekday]} ${active.hour}:00-${active.hour + 1}:00 · ${current[measure]} ${unit}${
              secondary ? ` · ${current[secondary.key]} ${secondary.unit}` : ""
            }`
          : best.length
            ? `Drukst: ${best.map((c) => `${WEEKDAYS_LONG[c.weekday]} ${c.hour}:00 (${c[measure]})`).join(", ")}`
            : "Nog geen gegevens."}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted" aria-hidden>
        <span>minder</span>
        {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
          <span key={a} className="inline-block size-3 rounded-[3px]" style={{ background: `rgba(28, 122, 72, ${a})` }} />
        ))}
        <span>meer</span>
      </div>
    </div>
  );
}
