import { cacheLife } from "next/cache";
import type { DurationId } from "@/config/pricing";
import { activePromotion, promotionEndLabel } from "@/config/site";
import type { Locale } from "@/i18n/config";

/** Wat de pagina's van de lopende actie nodig hebben (ook in de browser). */
export interface PromoView {
  id: string;
  label: string;
  /** Laatste dag, bijv. "maandag 30 november". */
  endsLabel: string;
  percentOff: Record<DurationId, number>;
}

/**
 * De actie die nu loopt (zie `promotions` in src/config/site.ts), of null.
 * Kort gecachet, zodat pagina's statisch kunnen blijven en de actie toch
 * binnen een paar minuten na de start- en eindtijd aan of uit gaat.
 */
export async function currentPromotion(l: Locale): Promise<PromoView | null> {
  "use cache";
  cacheLife("minutes");
  const p = activePromotion(new Date());
  if (!p) return null;
  return { id: p.id, label: l === "en" ? p.labelEn : p.label, endsLabel: promotionEndLabel(p, l), percentOff: { ...p.percentOff } };
}
