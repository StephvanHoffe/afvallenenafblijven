import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Mijn gegevens · Mijn schema's",
  robots: { index: false },
};

export default function GegevensPage({ searchParams }: PageProps<"/account/gegevens">) {
  return <AccountPage tab="gegevens" searchParams={searchParams} />;
}
