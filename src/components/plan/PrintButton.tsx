"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary !py-2.5 text-sm">
      <Printer className="size-4" aria-hidden /> Printen of opslaan als PDF
    </button>
  );
}
