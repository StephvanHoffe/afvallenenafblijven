"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full border border-line bg-white"
        aria-label="Menu openen"
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm"
            aria-label="Menu sluiten"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-cream p-5 shadow-[var(--shadow-lift)]">
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full border border-line bg-white"
                aria-label="Menu sluiten"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobiel menu" className="flex flex-col gap-1">
              {[...items, { href: "/account", label: "Mijn schema's" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-lg font-bold hover:bg-brand-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/start" onClick={() => setOpen(false)} className="btn-primary mt-auto w-full">
              Start je persoonlijke plan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
