import { ClipboardList, CreditCard, FileText, LayoutDashboard, LineChart, LogOut, ReceiptText, UserRound } from "lucide-react";
import { logout } from "@/app/[lang]/(site)/account/actions";
import { AccountTabsNav } from "@/components/account/AccountTabsNav";
import { DemoButton } from "@/components/account/DemoButton";
import { defineCopy, type Locale } from "@/i18n/config";
import type { AccountTab } from "@/lib/account-types";

const TABS: { id: AccountTab; path: string; icon: typeof LayoutDashboard }[] = [
  { id: "overzicht", path: "", icon: LayoutDashboard },
  { id: "schemas", path: "/schemas", icon: FileText },
  { id: "voortgang", path: "/voortgang", icon: LineChart },
  { id: "check-in", path: "/check-in", icon: ClipboardList },
  { id: "gegevens", path: "/gegevens", icon: UserRound },
  { id: "abonnement", path: "/abonnement", icon: CreditCard },
  { id: "betalingen", path: "/betalingen", icon: ReceiptText },
];

const copy = defineCopy({
  nl: {
    tabs: {
      overzicht: "Overzicht",
      schemas: "Schema's",
      voortgang: "Voortgang",
      "check-in": "Check-in",
      gegevens: "Mijn gegevens",
      abonnement: "Abonnement",
      betalingen: "Betalingen",
    } as Record<AccountTab, string>,
    eyebrow: "Mijn schema's",
    hello: (name: string) => `Hoi ${name}!`,
    logout: "Uitloggen",
  },
  en: {
    tabs: {
      overzicht: "Overview",
      schemas: "Plans",
      voortgang: "Progress",
      "check-in": "Check-in",
      gegevens: "My details",
      abonnement: "Subscription",
      betalingen: "Payments",
    },
    eyebrow: "My plans",
    hello: (name: string) => `Hi ${name}!`,
    logout: "Log out",
  },
});

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
  l,
  demo = false,
  checkinOpen = false,
  children,
}: {
  name: string;
  /** "/account", of "/voorbeeld/mijn-schemas" in de voorbeeldweergave. */
  base: string;
  active: AccountTab;
  l: Locale;
  demo?: boolean;
  /** Toont een stip bij het tabblad Check-in als die openstaat. */
  checkinOpen?: boolean;
  children: React.ReactNode;
}) {
  const c = copy[l];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{c.eyebrow}</p>
          <h1 className="heading-lg">{c.hello(name)}</h1>
        </div>
        {demo ? (
          <DemoButton className="btn-secondary !py-2.5 text-sm">
            <LogOut className="size-4" aria-hidden /> {c.logout}
          </DemoButton>
        ) : (
          <form action={logout}>
            <button type="submit" className="btn-secondary !py-2.5 text-sm">
              <LogOut className="size-4" aria-hidden /> {c.logout}
            </button>
          </form>
        )}
      </div>

      <AccountTabsNav
        active={active}
        checkinOpen={checkinOpen}
        tabs={TABS.map((t) => ({ id: t.id, href: base + t.path, label: c.tabs[t.id], icon: <t.icon className="size-[1.125rem]" aria-hidden /> }))}
      />

      {children}
    </div>
  );
}
