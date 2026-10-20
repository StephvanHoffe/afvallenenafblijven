import { Gift, Zap } from "lucide-react";
import { launchOfferEndLabel, site } from "@/config/site";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";
import { launchOfferActive } from "@/lib/launch";

export async function AnnouncementBar() {
  const active = await launchOfferActive();
  const l = await getLocale();
  return (
    <div className="no-print bg-brand-900 text-white">
      <div className="container-page flex min-h-10 items-center justify-center gap-2 py-2 text-center text-sm font-medium">
        {active ? (
          <>
            <Gift className="size-4 shrink-0 text-lime-glow" aria-hidden />
            {l === "en" ? (
              <span>
                <strong className="text-lime-glow">{site.launchOffer.labelEn}:</strong> {site.launchOffer.percentOff}% off your
                first payment, until {launchOfferEndLabel(l)}.{" "}
                <Link href="/start" className="font-bold underline underline-offset-2">
                  Start now
                </Link>
              </span>
            ) : (
              <span>
                <strong className="text-lime-glow">{site.launchOffer.label}:</strong> {site.launchOffer.percentOff}% korting op
                je eerste betaling, t/m {launchOfferEndLabel(l)}.{" "}
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
                ? "Your personal plan in your inbox within minutes · Cancel monthly"
                : "Je persoonlijke schema binnen enkele minuten in je mailbox · Maandelijks opzegbaar"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
