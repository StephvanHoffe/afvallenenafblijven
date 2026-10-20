import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Mijn schema's",
  robots: { index: false },
};

// Na een check-in wordt het nieuwe schema op de achtergrond gemaakt; dat kan enkele minuten duren.
export const maxDuration = 300;

export default function OverzichtPage({ searchParams }: PageProps<"/account">) {
  return <AccountPage tab="overzicht" searchParams={searchParams} />;
}
