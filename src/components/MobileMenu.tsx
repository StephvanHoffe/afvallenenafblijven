"use client";

import Link from "@/i18n/Link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Menu, UserRound, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { usePagePath } from "@/i18n/navigation";

const copy = defineCopy({
  nl: { open: "Menu openen", close: "Menu sluiten", menu: "Menu", mobileMenu: "Mobiel menu", account: "Mijn schema's", start: "Start je persoonlijke plan" },
  en: { open: "Open menu", close: "Close menu", menu: "Menu", mobileMenu: "Mobile menu", account: "My plans", start: "Start your personal plan" },
});

/**
 * Menu voor mobiel. Het paneel wordt buiten de kopbalk gerenderd (portal):
 * de kopbalk heeft een vervagingseffect, en daarbinnen zou een "fixed"
 * paneel niet het hele scherm kunnen vullen.
 */
export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const c = copy[useLocale()];
  const pathname = usePagePath();
  // Het menu hoort bij de pagina waarop het is geopend; na navigeren (ook via het logo) is het vanzelf dicht.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const opener = openButton.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="lg:hidden">
      <button
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full border border-line bg-white"
        aria-label={c.open}
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={c.menu}>
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm"
              aria-label={c.close}
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(24rem,90vw)] flex-col overflow-y-auto bg-cream shadow-[var(--shadow-lift)]">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
                <Logo />
                <button
                  ref={closeButton}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-11 place-items-center rounded-full border border-line bg-white"
                  aria-label={c.close}
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav aria-label={c.mobileMenu} className="flex flex-col gap-1 p-4">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-bold ${
                      isActive(item.href) ? "bg-brand-50 text-brand-800" : "text-ink hover:bg-white"
                    }`}
                  >
                    {item.label}
                    <ArrowRight className="size-5 text-muted" aria-hidden />
                  </Link>
                ))}
              </nav>
              <div className="mt-auto space-y-3 border-t border-line p-4">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="btn-secondary w-full"
                  aria-current={isActive("/account") ? "page" : undefined}
                >
                  <UserRound className="size-5" aria-hidden /> {c.account}
                </Link>
                <Link href="/start" onClick={() => setOpen(false)} className="btn-primary w-full">
                  {c.start} <ArrowRight className="size-5" aria-hidden />
                </Link>
                <div className="pt-2">
                  <LanguageSwitcher variant="full" onNavigate={() => setOpen(false)} />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
