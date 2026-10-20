import { AccountShell } from "@/components/account/AccountShell";
import { CheckinTab } from "@/components/account/tabs/CheckinTab";
import { DetailsTab } from "@/components/account/tabs/DetailsTab";
import { OverviewTab } from "@/components/account/tabs/OverviewTab";
import { ProgressTab } from "@/components/account/tabs/ProgressTab";
import { SchemasTab } from "@/components/account/tabs/SchemasTab";
import { SubscriptionTab } from "@/components/account/tabs/SubscriptionTab";
import type { AccountNotice, AccountTab, AccountView } from "@/lib/account-types";

/** Eén tabblad van Mijn schema's, met de kop en de tabbladen erboven. */
export function AccountTabView({
  tab,
  view,
  base,
  demo = false,
  notice = null,
}: {
  tab: AccountTab;
  view: AccountView;
  base: string;
  demo?: boolean;
  notice?: AccountNotice;
}) {
  const checkinOpen = view.orders.some((o) => o.checkin?.status === "open" || o.checkin?.status === "overdue");
  return (
    <AccountShell name={view.name} base={base} active={tab} demo={demo} checkinOpen={checkinOpen}>
      {tab === "overzicht" && <OverviewTab view={view} base={base} demo={demo} notice={notice} />}
      {tab === "schemas" && <SchemasTab view={view} demo={demo} />}
      {tab === "voortgang" && <ProgressTab view={view} base={base} />}
      {tab === "check-in" && <CheckinTab view={view} demo={demo} />}
      {tab === "gegevens" && <DetailsTab view={view} base={base} />}
      {tab === "abonnement" && <SubscriptionTab view={view} demo={demo} notice={notice} />}
    </AccountShell>
  );
}
