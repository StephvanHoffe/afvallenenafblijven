import { AccountTabView } from "@/components/account/AccountTabView";
import { DemoBanner } from "@/components/account/DemoBanner";
import { demoAccountView } from "@/content/demo-account";
import type { AccountTab } from "@/lib/account-types";

/** Een tabblad van Mijn schema's met fictieve gegevens, voor de voorbeeldweergave. */
export function DemoAccountPage({ tab }: { tab: AccountTab }) {
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>
        Voorbeeld van <strong>Mijn schema&apos;s</strong> voor een fictieve klant met de bundel, nu in periode 4. Knoppen en
        formulieren werken hier niet.
      </DemoBanner>
      <AccountTabView tab={tab} view={demoAccountView} base="/voorbeeld/mijn-schemas" demo />
    </section>
  );
}
