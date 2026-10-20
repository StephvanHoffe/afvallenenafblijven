import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: check-in",
  robots: { index: false },
};

export default function DemoCheckinPage() {
  return <DemoAccountPage tab="check-in" />;
}
