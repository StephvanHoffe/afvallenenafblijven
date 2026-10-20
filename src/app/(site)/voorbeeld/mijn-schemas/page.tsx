import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { DemoBanner } from "@/components/account/DemoBanner";
import { demoCustomerName, demoOrders, demoPlans } from "@/content/demo-account";

export const metadata: Metadata = {
  title: "Voorbeeld: Mijn schema's",
  description: "Zo ziet je persoonlijke omgeving eruit: je schema's, check-in en abonnement op één plek.",
  robots: { index: false },
};

export default function DemoAccountPage() {
  return (
    <section className="container-page py-12 sm:py-16">
      <DemoBanner>
        Voorbeeld van <strong>Mijn schema&apos;s</strong> voor een fictieve klant met de bundel. Knoppen werken hier
        niet.
      </DemoBanner>
      <AccountDashboard name={demoCustomerName} orders={demoOrders} plans={demoPlans} demo />
    </section>
  );
}
