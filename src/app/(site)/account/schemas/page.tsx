import type { Metadata } from "next";
import { AccountPage } from "@/components/account/AccountPage";

export const metadata: Metadata = {
  title: "Schema's · Mijn schema's",
  robots: { index: false },
};

export default function SchemasPage({ searchParams }: PageProps<"/account/schemas">) {
  return <AccountPage tab="schemas" searchParams={searchParams} />;
}
