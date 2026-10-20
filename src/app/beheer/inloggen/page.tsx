import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/app/beheer/inloggen/LoginForm";
import { LogoMark } from "@/components/Logo";
import { isDemoMode } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Inloggen" };

export default function AdminLoginPage() {
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
        <div className="rounded-2xl border border-line bg-white p-6">
          <h1 className="text-xl font-extrabold">Inloggen op beheer</h1>
          {isDemoMode() ? (
            <>
              <p className="mt-2 text-sm text-muted">Demo-modus: je kunt zonder wachtwoord verder.</p>
              <Link href="/beheer" className="btn-primary mt-5 w-full">
                Naar het beheer
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 mb-5 text-sm text-muted">Alleen voor de eigenaar van de website.</p>
              <AdminLoginForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
