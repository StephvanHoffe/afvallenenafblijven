import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "Check-in · My plans" : "Check-in · Mijn schema's",
    robots: { index: false },
  };
}

// Na een check-in wordt het nieuwe schema op de achtergrond gemaakt; dat kan enkele minuten duren.
export const maxDuration = 300;

export default function CheckinPage({ searchParams }: PageProps<"/[lang]/account/check-in">) {
  return <AccountPage tab="check-in" searchParams={searchParams} />;
}
