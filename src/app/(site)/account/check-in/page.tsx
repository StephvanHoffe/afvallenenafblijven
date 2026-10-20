import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Check-in · Mijn schema's",
  robots: { index: false },
};

// Na een check-in wordt het nieuwe schema op de achtergrond gemaakt; dat kan enkele minuten duren.
export const maxDuration = 300;

export default function CheckinPage({ searchParams }: PageProps<"/account/check-in">) {
  return <AccountPage tab="check-in" searchParams={searchParams} />;
}
