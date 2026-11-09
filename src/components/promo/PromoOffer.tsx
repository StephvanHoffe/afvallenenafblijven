import { Check, Tag, Zap } from "lucide-react";
import { BlackFridayOffer, bfCopy, promoHasTiers, promoPercent } from "@/components/campaign/BlackFriday";
import { promotionSummary } from "@/config/site";
import { landingCopy } from "@/content/landing";
import type { Locale } from "@/i18n/config";
import type { PromoView } from "@/lib/promotion";

/**
 * De korting, als eerste in beeld: wat je krijgt en dat het vanzelf in je
 * winkelwagen zit. Dat klopt: een actie rekent de checkout zelf uit, en een
 * code uit de advertentielink gaat via CampaignLinks mee naar de vragenlijst
 * en wordt daar automatisch toegepast.
 */
export function OfferBanner({ title, note, className = "mb-3 sm:mb-4" }: { title: string; note: string; className?: string }) {
  return (
    <div className={`flex max-w-xl items-start gap-3 rounded-2xl bg-lime-glow px-3.5 py-2.5 text-brand-950 shadow-[var(--shadow-soft)] sm:px-4 sm:py-3 ${className}`}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-brand-950 text-lime-glow">
        <Tag className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[1.0625rem] leading-tight font-extrabold sm:text-lg">{title}</span>
        <span className="mt-0.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug font-semibold sm:text-sm">
          <Check className="mt-px size-4 shrink-0" aria-hidden /> {note}
        </span>
      </span>
    </div>
  );
}

/** De lopende actie als blok: tijdens Black Friday in de Black Friday-stijl (met aftelklok), anders groen. */
export function PromoOffer({ promo, l, className }: { promo: PromoView | null; l: Locale; className?: string }) {
  if (!promo) return null;
  const c = landingCopy[l].shared;
  const note = `${c.offerAuto} · ${c.offerUntil(promo.endsLabel)}`;
  if (promo.theme === "blackfriday") return <BlackFridayOffer promo={promo} l={l} note={note} className={className} />;
  return <OfferBanner title={c.launchOffer(promo.label, promotionSummary(promo.percentOff, promo.months, l))} note={note} className={className} />;
}

/** Compacte versie voor de vragenlijst: zo kort mogelijk, zodat de vraag zelf in beeld blijft (de aftelklok staat al in de balk bovenaan). */
export function PromoPill({ promo, l, className = "" }: { promo: PromoView | null; l: Locale; className?: string }) {
  if (!promo) return null;
  const bf = promo.theme === "blackfriday";
  const deal = bf ? bfCopy[l].pricingTitle(promoPercent(promo), promo.months, promoHasTiers(promo)) : promotionSummary(promo.percentOff, promo.months, l);
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl px-3 py-2 text-[0.8125rem] leading-snug font-semibold ${bf ? "bg-black text-white" : "bg-lime-glow text-brand-950"} ${className}`}
    >
      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-extrabold ${bf ? "bg-lime-glow text-brand-950" : "bg-brand-950 text-lime-glow"}`}>
        <Zap className="size-3.5" aria-hidden /> {promo.label}
      </span>
      <span>
        {deal} ·{" "}
        <span className={bf ? "text-lime-glow" : ""}>{l === "en" ? "applied automatically" : "automatisch in je winkelwagen"}</span>
      </span>
    </p>
  );
}
