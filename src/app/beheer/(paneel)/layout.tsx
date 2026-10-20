import Link from "@/i18n/Link";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { adminLogout } from "@/app/beheer/actions";
import { AdminNav, AdminNavLinks } from "@/components/beheer/AdminNav";
import { DemoNote } from "@/components/beheer/ui";
import { LogoMark } from "@/components/Logo";
import { isDemoMode } from "@/lib/admin/auth";

export default function PaneelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 bg-brand-950 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:gap-8 lg:p-5">
        <Link href="/beheer" className="flex items-center gap-2.5">
          <LogoMark className="size-8" />
          <span className="leading-tight font-extrabold">
            Afvallen &amp; Afblijven
            <span className="block text-xs font-semibold text-lime-glow">Beheer</span>
          </span>
        </Link>
        <nav aria-label="Beheer">
          <Suspense fallback={<AdminNavLinks />}>
            <AdminNav />
          </Suspense>
        </nav>
        <div className="mt-auto hidden space-y-1 lg:block">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white">
            <ExternalLink className="size-4" aria-hidden /> Naar de website
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white">
              <LogOut className="size-4" aria-hidden /> Uitloggen
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">
        {isDemoMode() && (
          <div className="mb-6">
            <DemoNote />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
