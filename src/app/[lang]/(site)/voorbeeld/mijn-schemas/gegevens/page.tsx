import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Example: my details" : "Voorbeeld: mijn gegevens",
    robots: { index: false },
  };
}

export default function DemoGegevensPage() {
  return <DemoAccountPage tab="gegevens" />;
}
