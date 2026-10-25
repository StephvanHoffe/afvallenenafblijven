import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Payments · My plans" : "Betalingen · Mijn schema's",
    robots: { index: false },
  };
}

export default function BetalingenPage({ searchParams }: PageProps<"/[lang]/account/betalingen">) {
  return <AccountPage tab="betalingen" searchParams={searchParams} />;
}
