import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: mijn gegevens",
  robots: { index: false },
};

export default function DemoGegevensPage() {
  return <DemoAccountPage tab="gegevens" />;
}
