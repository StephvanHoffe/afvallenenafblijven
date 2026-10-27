import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";
import { getLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: l === "en" ? "My plans" : "Mijn schema's",
    robots: { index: false },
  };
}

// Na een check-in wordt het nieuwe schema op de achtergrond gemaakt (en binnen 2 uur vrijgegeven).
// Een schema maken met Claude kan meer dan 5 minuten duren; 800 seconden is het maximum op Vercel Pro (Fluid compute).
export const maxDuration = 800;

export default function OverzichtPage({ searchParams }: PageProps<"/[lang]/account">) {
  return <AccountPage tab="overzicht" searchParams={searchParams} />;
}
