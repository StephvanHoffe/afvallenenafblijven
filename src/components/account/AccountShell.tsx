import { ClipboardList, CreditCard, FileText, LayoutDashboard, LineChart, LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/(site)/account/actions";
import { AccountTabsNav } from "@/components/account/AccountTabsNav";
import { DemoButton } from "@/components/account/DemoButton";
import type { AccountTab } from "@/lib/account-types";

const TABS: { id: AccountTab; path: string; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overzicht", path: "", label: "Overzicht", icon: LayoutDashboard },
  { id: "schemas", path: "/schemas", label: "Schema's", icon: FileText },
  { id: "voortgang", path: "/voortgang", label: "Voortgang", icon: LineChart },
  { id: "check-in", path: "/check-in", label: "Check-in", icon: ClipboardList },
  { id: "gegevens", path: "/gegevens", label: "Mijn gegevens", icon: UserRound },
  { id: "abonnement", path: "/abonnement", label: "Abonnement", icon: CreditCard },
];

export function accountHref(base: string, tab: AccountTab): string {
  return base + (TABS.find((t) => t.id === tab)?.path ?? "");
}

/**
 * Kop en tabbladen van de persoonlijke omgeving. Elk tabblad is een eigen
 * pagina, zodat terug-knop, links in e-mails en bladwijzers gewoon werken.
 */
export function AccountShell({
  name,
  base,
  active,
  demo = false,
  checkinOpen = false,
  children,
}: {
  name: string;
  /** "/account", of "/voorbeeld/mijn-schemas" in de voorbeeldweergave. */
  base: string;
  active: AccountTab;
  demo?: boolean;
  /** Toont een stip bij het tabblad Check-in als die openstaat. */
  checkinOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Mijn schema&apos;s</p>
          <h1 className="heading-lg">Hoi {name}!</h1>
        </div>
        {demo ? (
          <DemoButton className="btn-secondary !py-2.5 text-sm">
            <LogOut className="size-4" aria-hidden /> Uitloggen
          </DemoButton>
        ) : (
          <form action={logout}>
            <button type="submit" className="btn-secondary !py-2.5 text-sm">
              <LogOut className="size-4" aria-hidden /> Uitloggen
            </button>
          </form>
        )}
      </div>

      <AccountTabsNav
        active={active}
        checkinOpen={checkinOpen}
        tabs={TABS.map((t) => ({ id: t.id, href: base + t.path, label: t.label, icon: <t.icon className="size-[1.125rem]" aria-hidden /> }))}
      />

      {children}
    </div>
  );
}
