import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Example: check-in" : "Voorbeeld: check-in",
    robots: { index: false },
  };
}

export default function DemoCheckinPage() {
  return <DemoAccountPage tab="check-in" />;
}
