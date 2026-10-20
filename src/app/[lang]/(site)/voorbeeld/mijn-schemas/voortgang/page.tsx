import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Example: progress" : "Voorbeeld: voortgang",
    robots: { index: false },
  };
}

export default function DemoVoortgangPage() {
  return <DemoAccountPage tab="voortgang" />;
}
