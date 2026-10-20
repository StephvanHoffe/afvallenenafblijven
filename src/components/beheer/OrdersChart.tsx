"use client";

import { useState } from "react";

/**
 * Kolomgrafiek: nieuwe bestellingen per dag. Eén reeks, dus geen legenda (de
 * titel zegt wat er staat). Hover of focus op een kolom toont dag en aantal.
 */
export function OrdersChart({ data }: { data: { date: string; count: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 220;
  const pad = { top: 16, right: 8, bottom: 28, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(4, ...data.map((d) => d.count));
  const step = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const slot = innerW / data.length;
  const barW = Math.min(24, slot - 4);
  const y = (v: number) => pad.top + innerH - (v / top) * innerH;
  const fmt = (iso: string, long = false) =>
    new Intl.DateTimeFormat("nl-NL", long ? { weekday: "short", day: "numeric", month: "long" } : { day: "numeric", month: "short" }).format(
      new Date(`${iso}T12:00:00`),
    );
  const total = data.reduce((s, d) => s + d.count, 0);
  const hovered = active !== null ? data[active] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Nieuwe bestellingen per dag, laatste ${data.length} dagen: ${total} in totaal`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e4dc" strokeWidth="1" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#4d6156" className="tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, (d.count / top) * innerH);
          const r = Math.min(4, h / 2, barW / 2);
          const base = pad.top + innerH;
          const path =
            h <= 0
              ? ""
              : `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + barW - r} Q${x + barW},${base - h} ${x + barW},${base - h + r} V${base} Z`;
          return (
            <g key={d.date}>
              {path && <path d={path} fill={active === i ? "#2a955c" : "#1c7a48"} />}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${fmt(d.date, true)}: ${d.count} bestellingen`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none"
              />
            </g>
          );
        })}
        {data.map((d, i) =>
          i % 5 === 0 || i === data.length - 1 ? (
            <text key={`l-${d.date}`} x={pad.left + i * slot + slot / 2} y={height - 8} textAnchor="middle" fontSize="11" fill="#4d6156">
              {fmt(d.date)}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-[var(--shadow-soft)]"
          style={{ left: `clamp(0px, calc(${((pad.left + active * slot + slot / 2) / width) * 100}% - 4.5rem), calc(100% - 9rem))` }}
        >
          <p className="text-lg leading-tight font-extrabold tabular-nums">{hovered.count}</p>
          <p className="text-xs text-muted">bestellingen · {fmt(hovered.date, true)}</p>
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer font-semibold text-muted">Toon als tabel</summary>
        <table className="mt-2 w-full max-w-sm text-left text-sm">
          <thead>
            <tr>
              <th className="py-1 font-semibold">Dag</th>
              <th className="py-1 text-right font-semibold">Bestellingen</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-line">
                <td className="py-1">{fmt(d.date, true)}</td>
                <td className="py-1 text-right tabular-nums">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
