import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "My details · My plans" : "Mijn gegevens · Mijn schema's",
    robots: { index: false },
  };
}

export default function GegevensPage({ searchParams }: PageProps<"/[lang]/account/gegevens">) {
  return <AccountPage tab="gegevens" searchParams={searchParams} />;
}
