import { Gift, Zap } from "lucide-react";
import { promotionSummary } from "@/config/site";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";
import { currentPromotion } from "@/lib/promotion";

export async function AnnouncementBar() {
  const l = await getLocale();
  const promo = await currentPromotion(l);
  return (
    <div className="no-print bg-brand-900 text-white">
      <div className="container-page flex min-h-10 items-center justify-center gap-2 py-2 text-center text-sm font-medium">
        {promo ? (
          <>
            <Gift className="size-4 shrink-0 text-lime-glow" aria-hidden />
            {l === "en" ? (
              <span>
                <strong className="text-lime-glow">{promo.label}:</strong> {promotionSummary(promo.percentOff, l)}, until {promo.endsLabel}.{" "}
                <Link href="/start" className="font-bold underline underline-offset-2">
                  Start now
                </Link>
              </span>
            ) : (
              <span>
                <strong className="text-lime-glow">{promo.label}:</strong> {promotionSummary(promo.percentOff, l)}, t/m {promo.endsLabel}.{" "}
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
