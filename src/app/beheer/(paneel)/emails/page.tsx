import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, Search } from "lucide-react";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, QueryTabs, table } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { emailCounts30, emailLog } from "@/lib/admin/insights";
import { catalogEntry, mailCatalog } from "@/lib/admin/mail-catalog";
import { allMailOverrides } from "@/lib/email-store";
import { isEmailConfigured } from "@/lib/email";
import { loadStoredConfig } from "@/lib/db";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "E-mails" };

export default function EmailsPage({ searchParams }: PageProps<"/beheer/emails">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Emails searchParams={searchParams} />
    </Suspense>
  );
}

const STATUS = {
  sent: { tone: "ok", label: "Verstuurd" },
  skipped: { tone: "muted", label: "Niet verstuurd (geen SMTP)" },
  failed: { tone: "bad", label: "Mislukt" },
} as const;

async function Emails({ searchParams }: Pick<PageProps<"/beheer/emails">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!isDemoMode()) await loadStoredConfig();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const view = sp.weergave === "log" ? "log" : "teksten";
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  return (
    <>
      <Notice code={str("melding")} />
      <PageTitle title="E-mails" intro="Pas de teksten van de mails aan je klanten aan en zie welke mails er zijn verstuurd.">
        <QueryTabs
          base="/beheer/emails"
          param="weergave"
          current={view === "log" ? "log" : null}
          options={[{ label: "Teksten" }, { value: "log", label: "Verstuurde mails" }]}
        />
      </PageTitle>
      {!isDemoMode() && !isEmailConfigured() && (
        <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          E-mail is nog niet ingesteld: mails worden niet echt verstuurd (wel gelogd). Vul je mailbox in bij Koppelingen.
        </p>
      )}
      {view === "log" ? <Log q={str("q")} status={str("status")} kind={str("soort")} /> : <Texts />}
    </>
  );
}

async function Texts() {
  const [counts, overrides] = await Promise.all([emailCounts30(), isDemoMode() ? Promise.resolve(new Map()) : allMailOverrides()]);
  const groups = [...new Set(mailCatalog.map((e) => e.group))];
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Panel key={group} title={group}>
          <ul className="divide-y divide-line">
            {mailCatalog
              .filter((e) => e.group === group)
              .map((e) => {
                const nl = overrides.has(`${e.kind}:nl`);
                const en = overrides.has(`${e.kind}:en`);
                return (
                  <li key={e.kind}>
                    <Link href={`/beheer/emails/${e.kind}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-sand/50">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {e.label}
                          {nl && <Badge tone="info">NL aangepast</Badge>}
                          {en && <Badge tone="info">EN aangepast</Badge>}
                        </span>
                        <span className="block text-sm text-muted">{e.trigger}</span>
                      </span>
                      <span className="shrink-0 text-right text-sm">
                        <span className="block font-bold tabular-nums">{formatNumber(counts[e.kind] ?? 0)}</span>
                        <span className="block text-xs text-muted">30 dagen</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </Panel>
      ))}
      <p className="text-xs text-muted">
        Meldingen aan jou (nieuwe garantie-aanvraag, schema mislukt, enz.) staan vast en zijn niet aanpasbaar. Wettelijk verplichte onderdelen,
        zoals de inhoud van een herroeping, ook niet.
      </p>
    </div>
  );
}

async function Log({ q, status, kind }: { q?: string; status?: string; kind?: string }) {
  const rows = await emailLog({ q, status, kind, limit: 300 });
  return (
    <Panel>
      <form className="flex flex-wrap items-end gap-3 border-b border-line p-4" action="/beheer/emails">
        <input type="hidden" name="weergave" value="log" />
        <div className="w-full flex-1 sm:min-w-56">
          <label htmlFor="q" className="label">
            Zoeken
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="q" name="q" defaultValue={q} className="input pl-9" placeholder="E-mailadres of onderwerp" />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="soort" className="label">
            Mail
          </label>
          <select id="soort" name="soort" defaultValue={kind ?? ""} className="input sm:w-auto">
            <option value="">Alle mails</option>
            {mailCatalog.map((e) => (
              <option key={e.kind} value={e.kind}>
                {e.label}
              </option>
            ))}
            <option value="admin">Meldingen aan jou</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className="input sm:w-auto">
            <option value="">Alle</option>
            <option value="sent">Verstuurd</option>
            <option value="failed">Mislukt</option>
            <option value="skipped">Niet verstuurd</option>
          </select>
        </div>
        <button type="submit" className="btn-secondary !px-4 !py-2.5 text-sm">
          Filteren
        </button>
      </form>
      <div className={table.wrap}>
        <table className={table.table}>
          <thead>
            <tr>
              <th className={table.th}>Verstuurd</th>
              <th className={table.th}>Aan</th>
              <th className={table.th}>Mail</th>
              <th className={table.th}>Onderwerp</th>
              <th className={table.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>Geen mails gevonden.</EmptyRow>}
            {rows.map((r) => {
              const st = STATUS[r.status] ?? STATUS.sent;
              return (
                <tr key={r.id}>
                  <td className={`${table.td} ${table.num} whitespace-nowrap`}>{formatDateTime(r.createdAt)}</td>
                  <td className={table.td}>
                    {r.customerId ? (
                      <Link href={`/beheer/klanten/${r.customerId}`} className="hover:underline">
                        {r.to}
                      </Link>
                    ) : (
                      r.to
                    )}
                  </td>
                  <td className={table.td}>{r.kind === "admin" ? "Melding aan jou" : r.kind ? (catalogEntry(r.kind)?.label ?? r.kind) : "–"}</td>
                  <td className={`${table.td} max-w-xs truncate`} title={r.subject}>
                    {r.subject}
                  </td>
                  <td className={table.td}>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {r.error && <span className="block max-w-xs truncate text-xs text-accent-600">{r.error}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-muted">De laatste 300 mails. Het log wordt 12 maanden bewaard.</p>
    </Panel>
  );
}
