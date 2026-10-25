import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Plans · My plans" : "Schema's · Mijn schema's",
    robots: { index: false },
  };
}

export default function SchemasPage({ searchParams }: PageProps<"/[lang]/account/schemas">) {
  return <AccountPage tab="schemas" searchParams={searchParams} />;
}
