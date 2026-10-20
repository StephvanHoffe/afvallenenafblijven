"use client";

import { useState } from "react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: { note: "Dit is een voorbeeld. In je eigen omgeving werkt deze knop wel." },
  en: { note: "This is an example. In your own account, this button works." },
});

/** Knop voor de voorbeeldweergave van Mijn schema's: legt uit wat de knop in het echt doet. */
export function DemoButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const c = copy[useLocale()];
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" className={className} onClick={() => setShown(true)}>
        {children}
      </button>
      {shown && (
        <span role="status" className="max-w-[16rem] text-xs font-semibold text-muted">
          {c.note}
        </span>
      )}
    </span>
  );
}
