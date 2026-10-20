"use client";

import { createContext, useContext } from "react";
import { defaultLocale, type Locale } from "@/i18n/config";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** De taal van de huidige pagina, in Client Components. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}
