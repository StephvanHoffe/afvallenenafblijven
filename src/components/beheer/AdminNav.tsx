"use client";

import Link from "@/i18n/Link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Receipt, Settings, Undo2, Users } from "lucide-react";

export const adminNav = [
  { href: "/beheer", label: "Overzicht", icon: LayoutDashboard },
  { href: "/beheer/klanten", label: "Klanten", icon: Users },
  { href: "/beheer/bestellingen", label: "Bestellingen", icon: Receipt },
  { href: "/beheer/schemas", label: "Schema's", icon: FileText },
  { href: "/beheer/herroepingen", label: "Herroepingen", icon: Undo2 },
  { href: "/beheer/instellingen", label: "Instellingen", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/beheer" ? pathname === "/beheer" : pathname.startsWith(href);
}

export function AdminNavLinks({ pathname = "" }: { pathname?: string }) {
  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {adminNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <item.icon className={`size-4.5 ${active ? "text-lime-glow" : ""}`} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Navigatie met de actieve pagina gemarkeerd (leest het pad in de browser). */
export function AdminNav() {
  const pathname = usePathname();
  return <AdminNavLinks pathname={pathname} />;
}
