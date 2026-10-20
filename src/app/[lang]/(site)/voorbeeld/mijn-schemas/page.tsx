import type { Metadata } from "next";
import { DemoAccountPage } from "@/components/account/DemoAccountPage";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    title: "Voorbeeld: Mijn schema's",
    description: "Zo ziet je persoonlijke omgeving eruit: je schema's, je voortgang in grafieken, je check-in en je abonnement.",
  },
  en: {
    title: "Example: My plans",
    description: "This is what your personal account looks like: your plans, your progress in charts, your check-in and your subscription.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await getLocale()];
  return {
    title: c.title,
    description: c.description,
    robots: { index: false },
  };
}

export default function DemoOverzichtPage() {
  return <DemoAccountPage tab="overzicht" />;
}
