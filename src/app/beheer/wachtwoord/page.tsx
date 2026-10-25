import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "@/i18n/Link";
import { PasswordForm } from "@/app/beheer/wachtwoord/PasswordForm";
import { LogoMark } from "@/components/Logo";
import { MIN_PASSWORD_LENGTH, mustChangePassword, requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Wachtwoord" };

/**
 * Na inloggen met het eenmalige startwachtwoord kom je hier eerst: kies een
 * eigen wachtwoord, dan werkt het startwachtwoord niet meer. Ook om later je
 * wachtwoord te wijzigen.
 */
export default function AdminPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="leading-tight font-extrabold">
            Afvallen &amp; Afblijven
            <span className="block text-xs font-semibold text-muted">Beheer</span>
          </span>
        </div>
        <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border border-line bg-white" aria-hidden />}>
          <PasswordCard />
        </Suspense>
      </div>
    </div>
  );
}

async function PasswordCard() {
  await connection();
  await requireAdmin({ allowPasswordChange: true });
  const first = await mustChangePassword();
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h1 className="text-xl font-extrabold">{first ? "Kies je eigen wachtwoord" : "Wachtwoord wijzigen"}</h1>
      <p className="mt-2 mb-5 text-sm text-muted">
        {first
          ? "Je bent ingelogd met het eenmalige startwachtwoord. Kies nu een eigen wachtwoord; daarna werkt het startwachtwoord niet meer. Bewaar het in je wachtwoordmanager."
          : "Na het wijzigen log je met het nieuwe wachtwoord in. Andere ingelogde apparaten worden uitgelogd."}
      </p>
      <PasswordForm first={first} minLength={MIN_PASSWORD_LENGTH} />
      {!first && (
        <Link href="/beheer/koppelingen" className="mt-4 block text-center text-sm font-semibold text-muted hover:text-ink">
          Annuleren
        </Link>
      )}
    </div>
  );
}
