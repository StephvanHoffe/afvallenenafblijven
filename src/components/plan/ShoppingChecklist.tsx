"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface Group {
  category: string;
  items: { item: string; amount: string }[];
}

/**
 * Boodschappenlijst om af te vinken in de winkel. Wat je afvinkt onthoudt de
 * browser per schema (alleen op dit apparaat).
 */
export function ShoppingChecklist({ groups, storageKey }: { groups: Group[]; storageKey?: string }) {
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    if (!storageKey) return;
    const t = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) setChecked(JSON.parse(saved) as string[]);
      } catch {
        // Geen opslag beschikbaar (bijv. privévenster): dan begint de lijst leeg.
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Niet erg: afvinken werkt dan alleen zolang de pagina open is.
        }
      }
      return next;
    });
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-muted">
          {checked.length} van {total} afgevinkt
        </p>
        {checked.length > 0 && (
          <button type="button" onClick={() => setChecked([])} className="font-bold text-brand-700 hover:underline">
            Opnieuw beginnen
          </button>
        )}
      </div>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="mb-2 text-sm font-bold tracking-wide text-brand-700 uppercase">{group.category}</h3>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {group.items.map((i) => {
                const key = `${group.category}|${i.item}`;
                const on = checked.includes(key);
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[0.9375rem]">
                      <input type="checkbox" checked={on} onChange={() => toggle(key)} className="peer sr-only" />
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-brand-300"}`}
                        aria-hidden
                      >
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 ${on ? "text-muted line-through" : ""}`}>{i.item}</span>
                      <span className="shrink-0 text-sm font-semibold text-muted">{i.amount}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
