import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Voortgang · Mijn schema's",
  robots: { index: false },
};

export default function VoortgangPage({ searchParams }: PageProps<"/account/voortgang">) {
  return <AccountPage tab="voortgang" searchParams={searchParams} />;
}
