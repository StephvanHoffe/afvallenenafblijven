"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lijngrafiek over de tijd (gewicht, taille). Eén gemeten reeks in de
 * merkkleur, eventueel een verwacht verloop in grijs en een streeflijn.
 * Met de muis of de pijltjestoetsen zie je de waarde per meetmoment.
 */

export interface ChartPoint {
  t: number;
  v: number;
  label: string;
}

interface Props {
  measured: { label: string; points: ChartPoint[] };
  projection?: { label: string; points: ChartPoint[] };
  reference?: { v: number; label: string };
  unit: string;
  decimals?: number;
  /** Hoogte van het tekengebied in pixels. */
  height?: number;
  /** Korte beschrijving voor schermlezers. */
  description: string;
  compact?: boolean;
}

const C = {
  measured: "#1c7a48",
  projection: "#9aa6a0",
  reference: "#4d6156",
  grid: "#ecebe4",
  text: "#4d6156",
  ink: "#10231a",
  surface: "#ffffff",
};

const TZ = "Europe/Amsterdam";
const monthFmt = new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: TZ });
const dayFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: TZ });
const longFmt = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
const DAY = 24 * 60 * 60 * 1000;

function fmt(n: number, decimals: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function niceStep(range: number, maxTicks: number) {
  for (const step of [0.5, 1, 2, 5, 10, 20]) if (range / step <= maxTicks) return step;
  return 50;
}

function interpolate(points: ChartPoint[], t: number): number | null {
  if (points.length === 0 || t < points[0].t || t > points.at(-1)!.t) return null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (t <= b.t) return a.v + ((b.v - a.v) * (t - a.t)) / Math.max(b.t - a.t, 1);
  }
  return points.at(-1)!.v;
}

export function TimeChart({ measured, projection, reference, unit, decimals = 1, height = 260, description, compact = false }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setWidth(Math.max(Math.round(entries[0].contentRect.width), 260)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = measured.points;
  const proj = useMemo(() => projection?.points ?? [], [projection]);
  const m = { top: 14, right: compact ? 56 : 70, bottom: 26, left: 40 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;

  const geo = useMemo(() => {
    const all = [...pts, ...proj];
    let t0 = Math.min(...all.map((p) => p.t));
    let t1 = Math.max(...all.map((p) => p.t));
    if (t1 - t0 < 14 * DAY) {
      t0 -= 7 * DAY;
      t1 += 7 * DAY;
    }
    const values = [...all.map((p) => p.v), ...(reference ? [reference.v] : [])];
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const step = niceStep(Math.max(vMax - vMin, 1), compact ? 3 : 5);
    const y0 = Math.floor((vMin - step * 0.25) / step) * step;
    const y1 = Math.ceil((vMax + step * 0.25) / step) * step;
    const ticks: number[] = [];
    for (let v = y0; v <= y1 + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);

    // Datumlabels: per maand, of per week bij een korte periode.
    const xTicks: { t: number; label: string }[] = [];
    if (t1 - t0 < 60 * DAY) {
      for (let t = t0; t <= t1; t += 7 * DAY) xTicks.push({ t, label: dayFmt.format(t) });
    } else {
      const d = new Date(t0);
      let cursor = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      while (cursor <= t1) {
        xTicks.push({ t: cursor, label: monthFmt.format(cursor).replace(".", "") });
        const c = new Date(cursor);
        cursor = new Date(c.getFullYear(), c.getMonth() + 1, 1).getTime();
      }
    }
    return { t0, t1, y0, y1, ticks, xTicks };
  }, [pts, proj, reference, compact]);

  const x = (t: number) => m.left + ((t - geo.t0) / Math.max(geo.t1 - geo.t0, 1)) * plotW;
  const y = (v: number) => m.top + (1 - (v - geo.y0) / Math.max(geo.y1 - geo.y0, 1e-6)) * plotH;
  const path = (p: ChartPoint[]) => p.map((q, i) => `${i ? "L" : "M"}${x(q.t).toFixed(1)},${y(q.v).toFixed(1)}`).join("");

  const maxXTicks = Math.max(Math.floor(plotW / 64), 2);
  const every = Math.ceil(geo.xTicks.length / maxXTicks);
  const xTicks = geo.xTicks.filter((_, i) => i % every === 0);

  const last = pts.at(-1);
  const refY = reference ? y(reference.v) : null;
  const lastY = last ? y(last.v) : null;
  // Het eindlabel komt aan de kant waar de verwachte lijn niet loopt.
  const expectedAtLast = last && proj.length ? interpolate(proj, last.t) : null;
  const labelBelow = expectedAtLast !== null && last !== undefined && expectedAtLast > last.v;
  const refLabelBelow = refY !== null && lastY !== null && Math.abs(refY - lastY) < 16 && lastY < refY;

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement ?? e.currentTarget).getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    pts.forEach((p, i) => {
      if (Math.abs(x(p.t) - px) < Math.abs(x(pts[best].t) - px)) best = i;
    });
    setActive(best);
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setActive((a) => {
      const cur = a ?? pts.length - 1;
      return Math.min(Math.max(cur + (e.key === "ArrowRight" ? 1 : -1), 0), pts.length - 1);
    });
  }

  const hovered = active !== null ? pts[active] : null;
  const expected = hovered && proj.length ? interpolate(proj, hovered.t) : null;
  const tipLeft = hovered ? x(hovered.t) : 0;
  const tipOnLeft = tipLeft > width * 0.6;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted" aria-hidden>
        <li className="flex items-center gap-2">
          <svg width="22" height="10" aria-hidden>
            <line x1="1" y1="5" x2="21" y2="5" stroke={C.measured} strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="5" r="3.5" fill={C.measured} stroke={C.surface} strokeWidth="1.5" />
          </svg>
          {measured.label}
        </li>
        {projection && proj.length > 1 && (
          <li className="flex items-center gap-2">
            <svg width="22" height="10" aria-hidden>
              <line x1="1" y1="5" x2="21" y2="5" stroke={C.projection} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
            </svg>
            {projection.label}
          </li>
        )}
        {reference && (
          <li className="flex items-center gap-2">
            <svg width="22" height="10" aria-hidden>
              <line x1="1" y1="5" x2="21" y2="5" stroke={C.reference} strokeWidth="1.5" strokeDasharray="2 3" />
            </svg>
            {reference.label}
          </li>
        )}
      </ul>
      <div
        ref={wrap}
        className="relative rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        tabIndex={0}
        role="group"
        aria-roledescription="grafiek"
        aria-label={`${description} Gebruik de pijltjestoetsen om per meting de waarde te zien.`}
        onKeyDown={onKey}
        onFocus={() => setActive((a) => a ?? pts.length - 1)}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block h-auto max-w-full overflow-visible" aria-hidden>
          {/* Raster en assen */}
          {geo.ticks.map((v) => (
            <g key={v}>
              <line x1={m.left} x2={m.left + plotW} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth="1" />
              <text x={m.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize="11" fill={C.text} className="tabular-nums">
                {fmt(v, Number.isInteger(v) ? 0 : 1)}
              </text>
            </g>
          ))}
          {xTicks.map((tk) => (
            <text key={tk.t} x={x(tk.t)} y={height - 6} textAnchor="middle" fontSize="11" fill={C.text}>
              {tk.label}
            </text>
          ))}

          {/* Streeflijn */}
          {reference && refY !== null && (
            <g>
              <line x1={m.left} x2={m.left + plotW} y1={refY} y2={refY} stroke={C.reference} strokeWidth="1.5" strokeDasharray="2 3" />
              <text x={m.left + plotW + 6} y={refY} dy={refLabelBelow ? "1.1em" : "0.32em"} fontSize="11" fill={C.text}>
                {fmt(reference.v, decimals)} {unit}
              </text>
            </g>
          )}

          {/* Verwacht verloop */}
          {proj.length > 1 && (
            <path d={path(proj)} fill="none" stroke={C.projection} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Gemeten */}
          {pts.length > 1 && (
            <path d={path(pts)} fill="none" stroke={C.measured} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {hovered && (
            <line x1={x(hovered.t)} x2={x(hovered.t)} y1={m.top} y2={m.top + plotH} stroke={C.reference} strokeWidth="1" opacity="0.5" />
          )}

          {pts.map((p, i) => (
            <circle
              key={p.t}
              cx={x(p.t)}
              cy={y(p.v)}
              r={active === i ? 6 : 4.5}
              fill={C.measured}
              stroke={C.surface}
              strokeWidth="2"
            />
          ))}

          {last && (
            <text x={x(last.t) + 10} y={y(last.v)} dy={labelBelow ? "1.3em" : "-0.6em"} fontSize="12" fontWeight="700" fill={C.ink}>
              {fmt(last.v, decimals)} {unit}
            </text>
          )}

          {/* Vangt de muis over het hele tekengebied: de dichtstbijzijnde meting wordt actief. */}
          <rect
            x={m.left}
            y={m.top}
            width={Math.max(plotW, 0)}
            height={Math.max(plotH, 0)}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 min-w-40 rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-[var(--shadow-lift)]"
            style={{
              top: Math.max(y(hovered.v) - 70, 0),
              left: tipOnLeft ? undefined : tipLeft + 12,
              right: tipOnLeft ? width - tipLeft + 12 : undefined,
            }}
          >
            <p className="text-xs text-muted">{longFmt.format(hovered.t)}</p>
            <p className="mt-0.5 flex items-center gap-2">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: C.measured }} aria-hidden />
              <strong className="tabular-nums">
                {fmt(hovered.v, decimals)} {unit}
              </strong>
              <span className="text-muted">{hovered.label}</span>
            </p>
            {expected !== null && (
              <p className="mt-0.5 flex items-center gap-2">
                <span className="inline-block h-0.5 w-3 rounded" style={{ background: C.projection }} aria-hidden />
                <strong className="tabular-nums">
                  {fmt(expected, decimals)} {unit}
                </strong>
                <span className="text-muted">verwacht</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
