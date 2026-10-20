import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: Mijn schema's",
  description: "Zo ziet je persoonlijke omgeving eruit: je schema's, je voortgang in grafieken, je check-in en je abonnement.",
  robots: { index: false },
};

export default function DemoOverzichtPage() {
  return <DemoAccountPage tab="overzicht" />;
}
