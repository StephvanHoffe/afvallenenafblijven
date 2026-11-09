import { Gift, Zap } from "lucide-react";
import { bfCopy, promoHasTiers, promoPercent } from "@/components/campaign/BlackFriday";
import { Countdown } from "@/components/promo/Countdown";
import { landingCopy } from "@/content/landing";
import { promotionSummary } from "@/config/site";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";
import { currentPromotion } from "@/lib/promotion";

export async function AnnouncementBar() {
  const l = await getLocale();
  const promo = await currentPromotion(l);
  const bf = promo?.theme === "blackfriday";
  if (promo && bf) {
    // Black Friday: zwart, met de korting, dat die vanzelf in je winkelwagen zit en de aftelklok.
    return (
      <div className="no-print bg-black text-white">
        <div className="container-page flex min-h-10 flex-wrap items-center justify-center gap-x-2.5 gap-y-1 py-2 text-center text-sm font-medium">
          <span className="inline-flex items-center gap-1 rounded-lg bg-lime-glow px-2 py-0.5 font-extrabold text-brand-950">
            <Zap className="size-3.5" aria-hidden /> {promo.label}
          </span>
          <span className="font-bold">{bfCopy[l].pricingTitle(promoPercent(promo), promo.months, promoHasTiers(promo))}</span>
          <span className="hidden text-white/80 sm:inline">{landingCopy[l].shared.offerAuto.toLowerCase()}</span>
          <Countdown endsAt={promo.endsAt} variant="inline" className="font-semibold text-lime-glow" />
          <Link href="/start" className="font-bold underline underline-offset-2">
            {l === "en" ? "Start now" : "Start nu"}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="no-print bg-brand-900 text-white">
      <div className="container-page flex min-h-10 items-center justify-center gap-2 py-2 text-center text-sm font-medium">
        {promo ? (
          <>
            <Gift className="size-4 shrink-0 text-lime-glow" aria-hidden />
            {l === "en" ? (
              <span>
                <strong className="text-lime-glow">{promo.label}:</strong> {promotionSummary(promo.percentOff, promo.months, l)}, until {promo.endsLabel}.{" "}
                <Link href="/start" className="font-bold underline underline-offset-2">
                  Start now
                </Link>
              </span>
            ) : (
              <span>
                <strong className="text-lime-glow">{promo.label}:</strong> {promotionSummary(promo.percentOff, promo.months, l)}, t/m {promo.endsLabel}.{" "}
                <Link href="/start" className="font-bold underline underline-offset-2">
                  Start nu
                </Link>
              </span>
            )}
          </>
        ) : (
          <>
            <Zap className="size-4 shrink-0 text-lime-glow" aria-hidden />
            <span>
              {l === "en"
                ? "Your personal plan in your inbox within 2 hours · Cancel monthly"
                : "Je persoonlijke schema binnen 2 uur in je mailbox · Maandelijks opzegbaar"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
