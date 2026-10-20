import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Abonnement · Mijn schema's",
  robots: { index: false },
};

export default function AbonnementPage({ searchParams }: PageProps<"/account/abonnement">) {
  return <AccountPage tab="abonnement" searchParams={searchParams} />;
}
