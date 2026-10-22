"use client";

import Link from "@/i18n/Link";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  SUBSCRIPTION_DURATIONS,
  applyPercentOff,
  billingDescription,
  bundleSavings,
  durationFor,
  durations,
  monthlyPrice,
  commitmentTotal,
  productFor,
  savingsPercent,
  type DurationId,
  type ProductId,
} from "@/config/pricing";
import { resultDisclaimer } from "@/content/disclaimers";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { euro, euroAmount } from "@/lib/format";
import type { PromoView } from "@/lib/promotion";

const copy = defineCopy({
  nl: {
    chooseTerm: "Kies een looptijd",
    shortDuration: (months: number) => `${months} mnd`,
    backToSubscription: "Toch liever een voordelig abonnement?",
    showOneOff: "Liever geen abonnement? Bekijk een los schema",
    choose: { voeding: "Kies voeding", training: "Kies training", bundel: "Kies de bundel" },
    popular: "Meest gekozen",
    oneOff: "eenmalig",
    perMonth: "/ maand",
    oneOffNote: "Eén schema voor 4 weken, daarna geen nieuw schema. Geen abonnement.",
    nudgeOneOff: (name: string, oneOff: string, monthly: string | null) =>
      `Een los schema (${name}) kost ${oneOff} voor één schema van 4 weken. Daarna krijg je geen nieuw schema en sta je er weer alleen voor.${monthly ? ` Een maandabonnement is zelfs goedkoper: ${monthly} per maand, elke 4 weken een nieuw, bijgestuurd schema en maandelijks opzegbaar.` : ""}`,
    nudgeOneOffCta: "Bekijk de abonnementen",
    nudgeMonthly: (m3: string, m1: string) =>
      `Tip: met 3 maanden betaal je ${m3} in plaats van ${m1} per maand. En je hebt de tijd die een nieuwe gewoonte nodig heeft: volgens onderzoek gemiddeld zo'n 66 dagen.`,
    nudgeMonthlyCta: "Kies 3 maanden",
    recommended: "Advies",
    monthlyNote: "Maandelijks afgeschreven via automatische incasso. Maandelijks opzegbaar.",
    termNote: (term: string, total: string) =>
      `Maandelijks afgeschreven via automatische incasso. Minimaal ${term} (samen ${total}), daarna maandelijks opzegbaar.`,
    savePercent: (n: number) => `${n}% voordeliger dan per maand`,
    bundleOneOff: (amount: string) => `${amount} goedkoper dan los`,
    bundleMonthly: (amount: string) => `Bespaar ${amount} p/m t.o.v. los`,
    launch: (label: string, oneOff: boolean, price: string, regular: string) =>
      `${label}: ${oneOff ? "nu" : "eerste maand"} ${price} in plaats van ${regular}`,
    promoTiers: (label: string, until: string) => `${label} t/m ${until}: hoe langer je kiest, hoe meer korting op je eerste maand`,
    promoTier: (months: number) => (months === 0 ? "los" : months === 1 ? "per maand" : `${months} maanden`),
    renewal: "Elke 4 weken een nieuw, bijgestuurd schema",
    selected: "Gekozen ✓",
    vat: "Prijzen incl. btw",
  },
  en: {
    chooseTerm: "Choose a term",
    shortDuration: (months: number) => `${months} mo`,
    backToSubscription: "Prefer a better-value subscription after all?",
    showOneOff: "Rather not subscribe? See a one-off plan",
    choose: { voeding: "Choose nutrition", training: "Choose training", bundel: "Choose the bundle" },
    popular: "Most popular",
    oneOff: "one-off",
    perMonth: "/ month",
    oneOffNote: "One plan for 4 weeks, with no new plan after that. No subscription.",
    nudgeOneOff: (name: string, oneOff: string, monthly: string | null) =>
      `A one-off plan (${name}) costs ${oneOff} for a single 4-week plan. After that, you get no new plan and you're on your own again.${monthly ? ` A monthly subscription is actually cheaper: ${monthly} a month, a new, fine-tuned plan every 4 weeks, and you can cancel monthly.` : ""}`,
    nudgeOneOffCta: "See the subscriptions",
    nudgeMonthly: (m3: string, m1: string) =>
      `Tip: with 3 months you pay ${m3} instead of ${m1} a month. And you'll have the time a new habit needs: according to research, around 66 days on average.`,
    nudgeMonthlyCta: "Choose 3 months",
    recommended: "For you",
    monthlyNote: "Billed monthly by direct debit. Cancel any month.",
    termNote: (term: string, total: string) =>
      `Billed monthly by direct debit. Minimum ${term} (${total} in total), then cancel any month.`,
    savePercent: (n: number) => `${n}% cheaper than monthly`,
    bundleOneOff: (amount: string) => `${amount} cheaper than buying separately`,
    bundleMonthly: (amount: string) => `Save ${amount} a month vs. buying separately`,
    launch: (label: string, oneOff: boolean, price: string, regular: string) =>
      `${label}: ${oneOff ? "now" : "first month"} ${price} instead of ${regular}`,
    promoTiers: (label: string, until: string) => `${label} until ${until}: the longer you choose, the bigger the discount on your first month`,
    promoTier: (months: number) => (months === 0 ? "one-off" : months === 1 ? "monthly" : `${months} months`),
    renewal: "A new, fine-tuned plan every 4 weeks",
    selected: "Selected ✓",
    vat: "Prices incl. VAT",
  },
});

interface Props {
  /** Toon alleen deze producten, in deze volgorde (standaard alle drie). */
  only?: ProductId[];
  initialDuration?: DurationId;
  /** De actie die nu loopt (korting op de eerste betaling per looptijd). */
  promo?: PromoView | null;
  /** In de vragenlijst kiest de klant een plan in plaats van naar /start te gaan. */
  onSelect?: (product: ProductId, duration: DurationId) => void;
  selectedProduct?: ProductId;
  highlight?: ProductId;
  /** Looptijd die we de bezoeker aanraden (bijv. op basis van de prognose in de vragenlijst). */
  recommended?: DurationId;
}

const ORDER: ProductId[] = ["voeding", "bundel", "training"];

export function DurationToggle({
  value,
  onChange,
  product = "bundel",
  recommended,
}: {
  value: DurationId;
  onChange: (d: DurationId) => void;
  product?: ProductId;
  recommended?: DurationId;
}) {
  const c = copy[useLocale()];
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="radiogroup"
        aria-label={c.chooseTerm}
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
              {c.shortDuration(durations[d].months)}
              {d === recommended && (
                <span className={`block text-[0.625rem] leading-tight font-extrabold uppercase ${active ? "text-lime-glow" : "text-brand-600"}`}>
                  {c.recommended}
                </span>
              )}
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
        {value === "eenmalig" ? c.backToSubscription : c.showOneOff}
      </button>
    </div>
  );
}

export function PricingTable({
  only,
  initialDuration = "3m",
  promo,
  onSelect,
  selectedProduct,
  highlight = "bundel",
  recommended,
}: Props) {
  const l = useLocale();
  const c = copy[l];
  const [duration, setDuration] = useState<DurationId>(initialDuration);
  // Met `only` in de opgegeven volgorde (het product van de pagina eerst), anders de vaste volgorde.
  const list = only ? only.filter((p) => ORDER.includes(p)) : ORDER;
  // Voor de vergelijking bij een los schema of 1 maand: het gekozen, anders het uitgelichte product.
  const focus = selectedProduct && list.includes(selectedProduct) ? selectedProduct : list.includes(highlight) ? highlight : list[0];
  const oneOffPrice = monthlyPrice(focus, "eenmalig");
  const monthPrice = monthlyPrice(focus, "1m");

  return (
    <div className="space-y-10">
      <DurationToggle value={duration} onChange={setDuration} product={focus} recommended={recommended} />
      {promo && new Set(Object.values(promo.percentOff)).size > 1 && <PromoTiers promo={promo} />}
      {duration === "eenmalig" && (
        <Nudge
          text={c.nudgeOneOff(productFor(focus, l).shortName, euro(oneOffPrice, l), monthPrice < oneOffPrice ? euro(monthPrice, l) : null)}
          cta={c.nudgeOneOffCta}
          onClick={() => setDuration(recommended && recommended !== "eenmalig" ? recommended : "3m")}
        />
      )}
      {duration === "1m" && (
        <Nudge
          text={c.nudgeMonthly(euro(monthlyPrice(focus, "3m"), l), euro(monthPrice, l))}
          cta={c.nudgeMonthlyCta}
          onClick={() => setDuration("3m")}
        />
      )}
      <div className={`mx-auto grid max-w-5xl gap-5 ${list.length === 3 ? "lg:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : "max-w-md"}`}>
        {list.map((id) => (
          <PriceCard
            key={id}
            product={id}
            duration={duration}
            featured={id === highlight && list.length > 1}
            promo={promo}
            onSelect={onSelect}
            selected={selectedProduct === id}
          />
        ))}
      </div>
      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-muted">{resultDisclaimer[l].long}</p>
    </div>
  );
}

/** De staffel van een actie met verschillende kortingen per looptijd. */
function PromoTiers({ promo }: { promo: PromoView }) {
  const l = useLocale();
  const c = copy[l];
  const order: DurationId[] = ["12m", "6m", "3m", "1m", "eenmalig"];
  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-brand-900 px-5 py-4 text-center text-white">
      <p className="text-sm font-bold text-lime-glow">{c.promoTiers(promo.label, promo.endsLabel)}</p>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {order
          .filter((d) => (promo.percentOff[d] ?? 0) > 0)
          .map((d) => (
            <li key={d}>
              <span className="font-extrabold">−{promo.percentOff[d]}%</span> <span className="text-white/75">{c.promoTier(durations[d].months)}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

/** Eerlijke vergelijking als de bezoeker voor een los schema of 1 maand kiest. */
function Nudge({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div role="note" className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4 text-[0.9375rem] sm:flex-row sm:items-center sm:gap-5">
      <p className="flex-1 leading-relaxed">{text}</p>
      <button type="button" onClick={onClick} className="btn-secondary shrink-0 !px-4 !py-2 text-sm">
        {cta}
      </button>
    </div>
  );
}

function PriceCard({
  product,
  duration,
  featured,
  promo,
  onSelect,
  selected,
}: {
  product: ProductId;
  duration: DurationId;
  featured: boolean;
  promo?: Props["promo"];
  onSelect?: Props["onSelect"];
  selected?: boolean;
}) {
  const l = useLocale();
  const c = copy[l];
  const p = productFor(product, l);
  const d = durationFor(duration, l);
  const perMonth = monthlyPrice(product, duration);
  const total = commitmentTotal(product, duration);
  const save = savingsPercent(product, duration);
  const oneOff = d.months === 0;
  const promoPercent = promo ? (promo.percentOff[duration] ?? 0) : 0;
  const launchPrice = promo && promoPercent > 0 ? applyPercentOff(perMonth, promoPercent) : null;

  const cta = c.choose[product];
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
          <Sparkles className="size-3.5" aria-hidden /> {c.popular}
        </span>
      )}
      <h3 className={`text-xl font-extrabold ${featured ? "text-white" : ""}`}>{p.name}</h3>
      <p className={`mt-1 text-sm ${featured ? "text-white/75" : "text-muted"}`}>{p.tagline}</p>

      <div className="mt-6 flex items-end gap-1.5">
        <span className="text-[2.75rem] leading-none font-extrabold tracking-tight">€{euroAmount(perMonth, l)}</span>
        <span className={`pb-1 text-sm font-semibold ${featured ? "text-white/70" : "text-muted"}`}>
          {oneOff ? c.oneOff : c.perMonth}
        </span>
      </div>
      <p className={`mt-2 min-h-10 text-sm ${featured ? "text-white/75" : "text-muted"}`}>
        {oneOff ? c.oneOffNote : d.months === 1 ? c.monthlyNote : c.termNote(d.label, euro(total, l))}
      </p>

      <div className="mt-3 flex min-h-7 flex-wrap gap-2">
        {save > 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${featured ? "bg-white/10 text-lime-glow" : "bg-brand-50 text-brand-700"}`}>
            {c.savePercent(save)}
          </span>
        )}
        {product === "bundel" && bundleSavings(duration) > 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${featured ? "bg-white/10 text-lime-glow" : "bg-brand-50 text-brand-700"}`}>
            {oneOff ? c.bundleOneOff(euro(bundleSavings(duration), l)) : c.bundleMonthly(euro(bundleSavings(duration), l))}
          </span>
        )}
      </div>

      {launchPrice !== null && (
        <p className={`mt-3 rounded-2xl px-3 py-2 text-sm font-semibold ${featured ? "bg-lime-glow/15 text-lime-glow" : "bg-accent-50 text-accent-600"}`}>
          {c.launch(promo!.label, oneOff, euro(launchPrice, l), euro(perMonth, l))}
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
            <span>{c.renewal}</span>
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
            {selected ? c.selected : cta}
          </button>
        ) : (
          <Link href={href} className={`${featured ? "btn-glow" : "btn-primary"} w-full`}>
            {cta}
          </Link>
        )}
        <p className={`mt-3 text-center text-xs ${featured ? "text-white/60" : "text-muted"}`}>
          {billingDescription(duration, l)} · {c.vat}
        </p>
      </div>
    </div>
  );
}
