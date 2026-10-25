import Link from "@/i18n/Link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { after, connection } from "next/server";
import { AccountTabView } from "@/components/account/AccountTabView";
import type { ConnectionNotice } from "@/components/account/health/HealthConnections";
import { products } from "@/config/pricing";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import type { AccountNotice, AccountTab } from "@/lib/account-types";
import { toAccountView } from "@/lib/account-view";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { isHealthEnabled } from "@/lib/health/config";
import { loadHealthView } from "@/lib/health/view-server";
import { paymentsForCustomer } from "@/lib/payments";
import { notifyReleased, releaseForCustomer } from "@/lib/plans";
import {
  checkinsForCustomer,
  guaranteeRequestForCustomer,
  latestIntakeForCustomer,
  nutritionTargetHistory,
  ordersForCustomer,
  plansForCustomer,
  weeklyLogsForCustomer,
} from "@/lib/repo";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const copy = defineCopy({
  nl: {
    noDatabase: "Mijn schema's is nog niet beschikbaar (database niet ingesteld).",
    title: "Mijn schema's",
    loginText: "Log in met je e-mailadres om je schema's te bekijken.",
    login: "Inloggen",
    curious: "Benieuwd hoe het eruitziet?",
    example: "Bekijk een voorbeeld",
    noPlan: "Nog geen schema?",
    start: "Start de vragenlijst",
  },
  en: {
    noDatabase: "My plans isn't available yet (database not configured).",
    title: "My plans",
    loginText: "Log in with your email address to view your plans.",
    login: "Log in",
    curious: "Curious what it looks like?",
    example: "See an example",
    noPlan: "No plan yet?",
    start: "Start the questionnaire",
  },
});

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
  const l = await getLocale();
  if (!isDatabaseConfigured()) {
    return <NotLoggedIn l={l} note={copy[l].noDatabase} />;
  }
  const customer = await currentCustomer();
  if (!customer) return <NotLoggedIn l={l} />;
  const sp = (await searchParams) ?? {};
  // Oude links (bijv. uit e-mails) naar het juiste tabblad sturen.
  if (tab === "overzicht" && sp.opzeggen === "1") redirect(localePath(l, "/account/abonnement?opzeggen=1"));
  if (tab === "overzicht" && sp.opgezegd === "1") redirect(localePath(l, "/account/abonnement?opgezegd=1"));

  // Is het geplande moment van een klaar schema aangebroken, dan ziet de klant het nu meteen (de mail volgt).
  const released = await releaseForCustomer(customer.id);
  if (released.length > 0) after(() => notifyReleased(released));
  const [orders, plans, checkins, weekly, intake, targets, guaranteeRequest, payments] = await Promise.all([
    ordersForCustomer(customer.id),
    plansForCustomer(customer.id),
    checkinsForCustomer(customer.id),
    weeklyLogsForCustomer(customer.id),
    latestIntakeForCustomer(customer.id),
    nutritionTargetHistory(customer.id),
    guaranteeRequestForCustomer(customer.id),
    tab === "betalingen" ? paymentsForCustomer(customer.id) : Promise.resolve([]),
  ]);
  // Ingeplande trainingen per week: uit de laatste check-in, anders de vragenlijst (alleen met een trainingsschema).
  const trains = orders.some((o) => products[o.product].includes.includes("training"));
  const trainingDays = [...checkins].reverse().find((c) => c.data.trainingDays)?.data.trainingDays ?? intake?.data.trainingDays ?? null;
  const health = isHealthEnabled() ? await loadHealthView(customer.id, trains ? trainingDays : null) : null;
  const view = toAccountView({
    health,
    name: customer.name,
    orders,
    plans,
    checkins,
    weekly,
    weeklyReminders: customer.weekly_reminders,
    intake,
    targets,
    guaranteeRequest,
    payments,
  });
  const notice: AccountNotice =
    sp.garantie === "aangevraagd"
      ? "garantie"
      : sp.factuur === "fout"
      ? "factuur-fout"
      : sp.checkin === "ontvangen"
      ? "checkin"
      : sp.weegmoment === "opgeslagen"
        ? "weegmoment"
        : sp.opgezegd === "1"
          ? "opgezegd"
          : sp.opzeggen === "1"
            ? "opzeggen"
            : null;
  const koppeling = sp.koppeling;
  const connectionNotice: ConnectionNotice =
    koppeling === "gekoppeld" || koppeling === "fout" || koppeling === "geannuleerd" ? koppeling : null;
  return <AccountTabView tab={tab} view={view} base="/account" notice={notice} connectionNotice={connectionNotice} />;
}

function NotLoggedIn({ l, note }: { l: Locale; note?: string }) {
  const c = copy[l];
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="heading-lg">{c.title}</h1>
      <p className="mt-3 text-muted">{note ?? c.loginText}</p>
      <Link href="/inloggen" className="btn-primary mt-6">
        {c.login}
      </Link>
      <p className="mt-6 text-sm text-muted">
        {c.curious}{" "}
        <Link href="/voorbeeld/mijn-schemas" className="font-semibold text-brand-700 underline">
          {c.example}
        </Link>{" "}
        · {c.noPlan}{" "}
        <Link href="/start" className="font-semibold text-brand-700 underline">
          {c.start}
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
