import Link from "next/link";
import { Gift, Zap } from "lucide-react";
import { launchOfferEndLabel, site } from "@/config/site";
import { launchOfferActive } from "@/lib/launch";

export async function AnnouncementBar() {
  const active = await launchOfferActive();
  return (
    <div className="no-print bg-brand-900 text-white">
      <div className="container-page flex min-h-10 items-center justify-center gap-2 py-2 text-center text-sm font-medium">
        {active ? (
          <>
            <Gift className="size-4 shrink-0 text-lime-glow" aria-hidden />
            <span>
              <strong className="text-lime-glow">{site.launchOffer.label}:</strong> {site.launchOffer.percentOff}% korting op
              je eerste betaling, t/m {launchOfferEndLabel()}.{" "}
              <Link href="/start" className="font-bold underline underline-offset-2">
                Start nu
              </Link>
            </span>
          </>
        ) : (
          <>
            <Zap className="size-4 shrink-0 text-lime-glow" aria-hidden />
            <span>
              Je persoonlijke schema binnen enkele minuten in je mailbox · Maandelijks opzegbaar
            </span>
          </>
        )}
      </div>
    </div>
  );
}
