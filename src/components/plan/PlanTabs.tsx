"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface PlanTab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Tabbladen voor een schema. Alle panelen staan in de HTML (handig voor
 * zoekmachines en printen); alleen het actieve paneel is zichtbaar. Een link
 * naar een element in een verborgen paneel (bijv. #recept-maandag-1) opent
 * automatisch het juiste tabblad en klapt het recept open.
 */
export function PlanTabs({
  tabs,
  variant = "tabs",
  label,
}: {
  tabs: PlanTab[];
  variant?: "tabs" | "pills";
  label: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const panels = useRef<HTMLDivElement>(null);
  const base = useId();

  useEffect(() => {
    function reveal() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      const root = panels.current;
      if (!target || !root?.contains(target)) return;
      // Zoek het paneel van dit tabblad-onderdeel (bij geneste tabbladen het buitenste).
      let panel: HTMLElement | null = target;
      while (panel && panel.parentElement !== root) panel = panel.parentElement;
      if (!panel?.dataset.tabPanel) return;
      setActive(panel.dataset.tabPanel);
      window.setTimeout(() => {
        if (target instanceof HTMLDetailsElement) target.open = true;
        target.scrollIntoView({ block: "start" });
      }, 30);
    }
    // Een klik op een link naar de huidige hash geeft geen hashchange; vang die ook af.
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (link && link.getAttribute("href") === window.location.hash) reveal();
    }
    const initial = window.setTimeout(reveal, 0);
    window.addEventListener("hashchange", reveal);
    document.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("hashchange", reveal);
      document.removeEventListener("click", onClick);
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const index = tabs.findIndex((t) => t.id === active);
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  }

  const tabClass =
    variant === "tabs"
      ? (on: boolean) =>
          `shrink-0 border-b-[3px] px-1 pb-3 text-[0.9375rem] font-bold transition-colors ${on ? "border-brand-600 text-ink" : "border-transparent text-muted hover:text-ink"}`
      : (on: boolean) =>
          `shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${on ? "bg-brand-900 text-white" : "border border-line bg-white text-ink hover:border-brand-300"}`;

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={`no-print flex overflow-x-auto [scrollbar-width:none] ${variant === "tabs" ? "mb-6 gap-6 border-b border-line" : "mb-5 gap-2 pb-1"}`}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={tabClass(active === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div ref={panels}>
        {tabs.map((t) => (
          <div
            key={t.id}
            id={`${base}-panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`${base}-tab-${t.id}`}
            data-tab-panel={t.id}
            hidden={active !== t.id}
            className="tab-panel"
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
