"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

type Props = ComponentProps<typeof NextLink> & { locale?: Locale };

/**
 * next/link met het juiste taalvoorvoegsel: op de Engelse site wordt
 * href="/prijzen" vanzelf "/en/prijzen". Met `locale` link je naar een andere
 * taal; dat wordt een gewone paginalading, omdat de hele pagina (ook <html lang>)
 * dan wisselt en de router niet tussen twee talen kan overschakelen.
 */
export default function Link({ href, locale, ...props }: Props) {
  const current = useLocale();
  const target = typeof href === "string" ? localePath(locale ?? current, href) : href;
  if (locale && locale !== current && typeof target === "string") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { prefetch, replace, scroll, shallow, passHref, legacyBehavior, onNavigate, ...anchor } = props;
    return <a href={target} {...anchor} />;
  }
  return <NextLink href={target} {...props} />;
}
