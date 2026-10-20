import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { toDashboard } from "@/lib/account-view";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { checkinsForCustomer, ordersForCustomer, plansForCustomer } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Mijn schema's",
  robots: { index: false },
};

// Na een check-in wordt het nieuwe schema op de achtergrond gemaakt; dat kan enkele minuten duren.
export const maxDuration = 300;

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <section className="container-page py-12 sm:py-16">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function AccountContent({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  // Altijd per verzoek renderen (ingelogde klant, actuele status).
  await connection();
  if (!isDatabaseConfigured()) {
    return <NotLoggedIn note="Mijn schema's is nog niet beschikbaar (database niet ingesteld)." />;
  }
  const customer = await currentCustomer();
  if (!customer) return <NotLoggedIn />;

  const [orders, plans, checkins, sp] = await Promise.all([
    ordersForCustomer(customer.id),
    plansForCustomer(customer.id),
    checkinsForCustomer(customer.id),
    searchParams,
  ]);
  const { dashboardOrders, dashboardPlans } = toDashboard(orders, plans, checkins);
  const notice =
    sp.opgezegd === "1" ? "opgezegd" : sp.opzeggen === "1" ? "opzeggen" : sp.checkin === "ontvangen" ? "checkin" : null;
  return (
    <AccountDashboard name={customer.name} orders={dashboardOrders} plans={dashboardPlans} notice={notice} />
  );
}

function NotLoggedIn({ note }: { note?: string }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="heading-lg">Mijn schema&apos;s</h1>
      <p className="mt-3 text-muted">{note ?? "Log in met je e-mailadres om je schema's te bekijken."}</p>
      <Link href="/inloggen" className="btn-primary mt-6">
        Inloggen
      </Link>
      <p className="mt-6 text-sm text-muted">
        Benieuwd hoe het eruitziet?{" "}
        <Link href="/voorbeeld/mijn-schemas" className="font-semibold text-brand-700 underline">
          Bekijk een voorbeeld
        </Link>{" "}
        · Nog geen schema?{" "}
        <Link href="/start" className="font-semibold text-brand-700 underline">
          Start de vragenlijst
        </Link>
      </p>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-10 w-1/3 rounded-2xl bg-line" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-28 rounded-3xl bg-white" />
        <div className="h-28 rounded-3xl bg-white" />
        <div className="h-28 rounded-3xl bg-white" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-64 rounded-3xl bg-white" />
        <div className="h-64 rounded-3xl bg-white" />
      </div>
    </div>
  );
}
