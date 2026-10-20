import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: abonnement",
  robots: { index: false },
};

export default function DemoAbonnementPage() {
  return <DemoAccountPage tab="abonnement" />;
}
