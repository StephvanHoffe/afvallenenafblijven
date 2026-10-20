import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Progress · My plans" : "Voortgang · Mijn schema's",
    robots: { index: false },
  };
}

export default function VoortgangPage({ searchParams }: PageProps<"/[lang]/account/voortgang">) {
  return <AccountPage tab="voortgang" searchParams={searchParams} />;
}
