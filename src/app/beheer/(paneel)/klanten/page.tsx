import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Search } from "lucide-react";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Klanten" };

export default function KlantenPage({ searchParams }: PageProps<"/beheer/klanten">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/beheer/klanten">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rows = await adminData().customers(q);

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle title="Klanten" intro={`${rows.length} ${rows.length === 1 ? "klant" : "klanten"}${q ? ` gevonden voor "${q}"` : ""}`}>
        <form role="search" className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Zoek op naam of e-mail" aria-label="Zoek klanten" className="input !py-2.5 pl-10 text-sm" />
        </form>
      </PageTitle>
      <Panel>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Klant sinds</th>
                <th className={table.th}>Abonnement</th>
                <th className={`${table.th} text-right`}>Schema&apos;s</th>
                <th className={table.th}>Nieuwsbrief</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={5}>Geen klanten gevonden.</EmptyRow>}
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-sand/50">
                  <td className={table.td}>
                    <Link href={`/beheer/klanten/${c.id}`} className="font-semibold hover:underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-muted">{c.email}</span>
                  </td>
                  <td className={`${table.td} ${table.num}`}>{formatDate(c.createdAt)}</td>
                  <td className={table.td}>{c.activeSubscriptions > 0 ? <Badge tone="ok">Actief</Badge> : <Badge tone="muted">Geen</Badge>}</td>
                  <td className={`${table.td} text-right ${table.num}`}>{c.plans}</td>
                  <td className={table.td}>{c.marketing ? "Ja" : "Nee"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
