import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { AccountTabView } from "@/components/account/AccountTabView";
import type { AccountNotice, AccountTab } from "@/lib/account-types";
import { toAccountView } from "@/lib/account-view";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import {
  checkinsForCustomer,
  latestIntakeForCustomer,
  nutritionTargetHistory,
  ordersForCustomer,
  plansForCustomer,
} from "@/lib/repo";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Een tabblad van Mijn schema's voor de ingelogde klant. */
export function AccountPage({ tab, searchParams }: { tab: AccountTab; searchParams?: SearchParams }) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent tab={tab} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function AccountContent({ tab, searchParams }: { tab: AccountTab; searchParams?: SearchParams }) {
  // Altijd per verzoek renderen (ingelogde klant, actuele status).
  await connection();
  if (!isDatabaseConfigured()) {
    return <NotLoggedIn note="Mijn schema's is nog niet beschikbaar (database niet ingesteld)." />;
  }
  const customer = await currentCustomer();
  if (!customer) return <NotLoggedIn />;
  const sp = (await searchParams) ?? {};
  // Oude links (bijv. uit e-mails) naar het juiste tabblad sturen.
  if (tab === "overzicht" && sp.opzeggen === "1") redirect("/account/abonnement?opzeggen=1");
  if (tab === "overzicht" && sp.opgezegd === "1") redirect("/account/abonnement?opgezegd=1");

  const [orders, plans, checkins, intake, targets] = await Promise.all([
    ordersForCustomer(customer.id),
    plansForCustomer(customer.id),
    checkinsForCustomer(customer.id),
    latestIntakeForCustomer(customer.id),
    nutritionTargetHistory(customer.id),
  ]);
  const view = toAccountView({ name: customer.name, orders, plans, checkins, intake, targets });
  const notice: AccountNotice =
    sp.checkin === "ontvangen" ? "checkin" : sp.opgezegd === "1" ? "opgezegd" : sp.opzeggen === "1" ? "opzeggen" : null;
  return <AccountTabView tab={tab} view={view} base="/account" notice={notice} />;
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
      <div className="h-10 w-full rounded-2xl bg-line/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white" />
        ))}
      </div>
      <div className="h-72 rounded-3xl bg-white" />
    </div>
  );
}
