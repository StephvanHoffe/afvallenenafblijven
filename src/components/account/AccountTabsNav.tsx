"use client";

import Link from "@/i18n/Link";
import { useEffect, useRef } from "react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import type { AccountTab } from "@/lib/account-types";

const copy = defineCopy({
  nl: { nav: "Mijn schema's", open: "(open)" },
  en: { nav: "My plans", open: "(open)" },
});

/**
 * De tabbladen van Mijn schema's. Op een smal scherm schuiven ze horizontaal;
 * het actieve tabblad wordt dan automatisch in beeld geschoven.
 */
export function AccountTabsNav({
  tabs,
  active,
  checkinOpen,
}: {
  tabs: { id: AccountTab; href: string; label: string; icon: React.ReactNode }[];
  active: AccountTab;
  checkinOpen: boolean;
}) {
  const c = copy[useLocale()];
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>("[aria-current=page]");
    const ul = list.current;
    if (el && ul && ul.scrollWidth > ul.clientWidth) {
      ul.scrollLeft = el.offsetLeft - (ul.clientWidth - el.offsetWidth) / 2;
    }
  }, [active]);

  return (
    <nav aria-label={c.nav} className="relative mt-6 mb-8 border-b border-line">
      <ul ref={list} className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-2">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id} className="shrink-0">
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex items-center gap-2 border-b-[3px] px-3 pt-2 pb-3 text-[0.9375rem] font-bold transition-colors [&>svg]:shrink-0 ${
                  on ? "border-brand-600 text-ink [&>svg]:text-brand-600" : "border-transparent text-muted hover:border-line hover:text-ink"
                }`}
              >
                {t.icon}
                {t.label}
                {t.id === "check-in" && checkinOpen && <span className="size-2 rounded-full bg-accent-500" aria-label={c.open} role="img" />}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Zachte rand rechts als hint dat er meer tabbladen zijn (alleen op smalle schermen). */}
      <span className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-cream to-transparent lg:hidden" aria-hidden />
    </nav>
  );
}
