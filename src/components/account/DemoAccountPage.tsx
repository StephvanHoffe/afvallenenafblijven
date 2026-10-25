import { AccountTabView } from "@/components/account/AccountTabView";
import { DemoBanner } from "@/components/account/DemoBanner";
import { demoAccountViewFor } from "@/content/demo-account";
import { getLocale } from "@/i18n/server";
import type { AccountTab } from "@/lib/account-types";

/** Een tabblad van Mijn schema's met fictieve gegevens, voor de voorbeeldweergave. */
export async function DemoAccountPage({ tab }: { tab: AccountTab }) {
  const l = await getLocale();
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>
        {l === "en" ? (
          <>
            Example of <strong>My plans</strong> for a fictional customer with the bundle, now in period 4. The figures are an
            example, not a promise. Buttons and forms don&apos;t work here.
          </>
        ) : (
          <>
            Voorbeeld van <strong>Mijn schema&apos;s</strong> voor een fictieve klant met de bundel, nu in periode 4. De cijfers
            zijn een voorbeeld, geen belofte. Knoppen en formulieren werken hier niet.
          </>
        )}
      </DemoBanner>
      <AccountTabView tab={tab} view={demoAccountViewFor(l)} base="/voorbeeld/mijn-schemas" demo />
    </section>
  );
}
