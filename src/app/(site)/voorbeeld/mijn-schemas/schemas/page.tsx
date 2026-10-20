import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";

export const metadata: Metadata = {
  title: "Voorbeeld: schema's",
  robots: { index: false },
};

export default function DemoSchemasPage() {
  return <DemoAccountPage tab="schemas" />;
}
