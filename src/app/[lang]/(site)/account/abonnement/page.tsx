import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Subscription · My plans" : "Abonnement · Mijn schema's",
    robots: { index: false },
  };
}

export default function AbonnementPage({ searchParams }: PageProps<"/[lang]/account/abonnement">) {
  return <AccountPage tab="abonnement" searchParams={searchParams} />;
}
