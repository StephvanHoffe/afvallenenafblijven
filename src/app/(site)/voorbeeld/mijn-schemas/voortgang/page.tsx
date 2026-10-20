import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: voortgang",
  robots: { index: false },
};

export default function DemoVoortgangPage() {
  return <DemoAccountPage tab="voortgang" />;
}
