"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  SUBSCRIPTION_DURATIONS,
  applyPercentOff,
  billingDescription,
  bundleSavings,
  durations,
  monthlyPrice,
  commitmentTotal,
  products,
  savingsPercent,
  type DurationId,
  type ProductId,
} from "@/config/pricing";
import { euro, euroAmount } from "@/lib/format";

interface Props {
  /** Toon alleen deze producten (standaard alle drie). */
  only?: ProductId[];
  initialDuration?: DurationId;
  launch?: { active: boolean; percentOff: number };
  /** In de vragenlijst kiest de klant een plan in plaats van naar /start te gaan. */
  onSelect?: (product: ProductId, duration: DurationId) => void;
  selectedProduct?: ProductId;
  highlight?: ProductId;
}

const ORDER: ProductId[] = ["voeding", "bundel", "training"];

export function DurationToggle({
  value,
  onChange,
  product = "bundel",
}: {
  value: DurationId;
  onChange: (d: DurationId) => void;
  product?: ProductId;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Kies een looptijd"
        className="grid w-full max-w-xl grid-cols-4 gap-1 rounded-full border border-line bg-white p-1 shadow-[var(--shadow-soft)]"
      >
        {SUBSCRIPTION_DURATIONS.map((d) => {
          const active = value === d;
          const save = savingsPercent(product, d);
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(d)}
              className={`relative rounded-full px-2 py-2.5 text-sm font-bold transition sm:text-[0.9375rem] ${
                active ? "bg-brand-900 text-white shadow" : "text-ink/75 hover:bg-brand-50"
              }`}
            >
              {durations[d].label.replace(" maanden", " mnd").replace(" maand", " mnd")}
              {save > 0 && (
                <span
                  className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-extrabold whitespace-nowrap ${
                    active ? "bg-lime-glow text-brand-950" : "bg-accent-100 text-accent-600"
                  }`}
                >
                  −{save}%
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onChange(value === "eenmalig" ? "3m" : "eenmalig")}
        className={`text-sm font-semibold underline underline-offset-2 ${value === "eenmalig" ? "text-brand-700" : "text-muted hover:text-ink"}`}
        aria-pressed={value === "eenmalig"}
      >
        {value === "eenmalig" ? "Toch liever een voordelig abonnement?" : "Liever geen abonnement? Bekijk een los schema"}
      </button>
    </div>
  );
}

export function PricingTable({ only, initialDuration = "3m", launch, onSelect, selectedProduct, highlight = "bundel" }: Props) {
  const [duration, setDuration] = useState<DurationId>(initialDuration);
  const list = ORDER.filter((p) => !only || only.includes(p));

  return (
    <div className="space-y-10">
      <DurationToggle value={duration} onChange={setDuration} />
      <div className={`mx-auto grid max-w-5xl gap-5 ${list.length === 3 ? "lg:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : "max-w-md"}`}>
        {list.map((id) => (
          <PriceCard
            key={id}
            product={id}
            duration={duration}
            featured={id === highlight && list.length > 1}
            launch={launch}
            onSelect={onSelect}
            selected={selectedProduct === id}
          />
        ))}
      </div>
    </div>
  );
}

function PriceCard({
  product,
  duration,
  featured,
  launch,
  onSelect,
  selected,
}: {
  product: ProductId;
  duration: DurationId;
  featured: boolean;
  launch?: Props["launch"];
  onSelect?: Props["onSelect"];
  selected?: boolean;
}) {
  const p = products[product];
  const d = durations[duration];
  const perMonth = monthlyPrice(product, duration);
  const total = commitmentTotal(product, duration);
  const save = savingsPercent(product, duration);
  const oneOff = d.months === 0;
  const launchPrice = launch?.active ? applyPercentOff(perMonth, launch.percentOff) : null;

  const cta = `Kies ${p.shortName.toLowerCase() === "bundel" ? "de bundel" : p.shortName.toLowerCase()}`;
  const href = `/start?plan=${product}&looptijd=${duration}`;

  return (
    <div
      className={`relative flex flex-col rounded-[var(--radius-card)] p-6 sm:p-7 ${
        featured
          ? "bg-brand-900 text-white shadow-[var(--shadow-lift)] ring-4 ring-lime-glow/70 lg:-my-3 lg:py-10"
          : "card"
      } ${selected ? "ring-4 ring-brand-500" : ""}`}
    >
      {featured && (
        <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-lime-glow px-3.5 py-1 text-xs font-extrabold tracking-wide text-brand-950 uppercase">
          <Sparkles className="size-3.5" aria-hidden /> Meest gekozen
        </span>
      )}
      <h3 className={`text-xl font-extrabold ${featured ? "text-white" : ""}`}>{p.name}</h3>
      <p className={`mt-1 text-sm ${featured ? "text-white/75" : "text-muted"}`}>{p.tagline}</p>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="text-[2.75rem] leading-none font-extrabold tracking-tight">€{euroAmount(perMonth)}</span>
        <span className={`pb-1 text-sm font-semibold ${featured ? "text-white/70" : "text-muted"}`}>
          {oneOff ? "eenmalig" : "/ maand"}
        </span>
      </div>
      <p className={`mt-2 min-h-10 text-sm ${featured ? "text-white/75" : "text-muted"}`}>
        {oneOff ? (
          "Eén schema voor 4 weken. Geen abonnement."
        ) : d.months === 1 ? (
          "Maandelijks afgeschreven via automatische incasso. Maandelijks opzegbaar."
        ) : (
          <>
            Maandelijks afgeschreven via automatische incasso. Minimaal {d.label} (samen {euro(total)}), daarna
            maandelijks opzegbaar.
          </>
        )}
      </p>

      <div className="mt-3 flex min-h-7 flex-wrap gap-2">
        {save > 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${featured ? "bg-white/10 text-lime-glow" : "bg-brand-50 text-brand-700"}`}>
            {save}% voordeliger dan per maand
          </span>
        )}
        {product === "bundel" && bundleSavings(duration) > 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${featured ? "bg-white/10 text-lime-glow" : "bg-brand-50 text-brand-700"}`}>
            {oneOff ? `${euro(bundleSavings(duration))} goedkoper dan los` : `Bespaar ${euro(bundleSavings(duration))} p/m t.o.v. los`}
          </span>
        )}
      </div>

      {launchPrice !== null && (
        <p className={`mt-3 rounded-2xl px-3 py-2 text-sm font-semibold ${featured ? "bg-lime-glow/15 text-lime-glow" : "bg-accent-50 text-accent-600"}`}>
          Lanceringsactie: {oneOff ? "nu" : "eerste maand"} {euro(launchPrice)} in plaats van {euro(perMonth)}
        </p>
      )}

      <ul className="mt-6 space-y-2.5 text-[0.9375rem]">
        {p.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <Check className={`mt-0.5 size-5 shrink-0 ${featured ? "text-lime-glow" : "text-brand-600"}`} aria-hidden />
            <span>{f}</span>
          </li>
        ))}
        {!oneOff && (
          <li className="flex gap-2.5">
            <Check className={`mt-0.5 size-5 shrink-0 ${featured ? "text-lime-glow" : "text-brand-600"}`} aria-hidden />
            <span>Elke 4 weken een nieuw, bijgestuurd schema</span>
          </li>
        )}
      </ul>

      <div className="mt-auto pt-7">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(product, duration)}
            className={`${featured ? "btn-glow" : "btn-primary"} w-full`}
          >
            {selected ? "Gekozen ✓" : cta}
          </button>
        ) : (
          <Link href={href} className={`${featured ? "btn-glow" : "btn-primary"} w-full`}>
            {cta}
          </Link>
        )}
        <p className={`mt-3 text-center text-xs ${featured ? "text-white/60" : "text-muted"}`}>
          {billingDescription(duration)} · Prijzen incl. btw
        </p>
      </div>
    </div>
  );
}
