import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, BellOff, BellRing, Search } from "lucide-react";
import { setAdminTopic } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { site } from "@/config/site";
import { ADMIN_TOPICS, adminTopicInfo, isAdminTopic } from "@/lib/admin-topics";
import { mutedAdminTopics } from "@/lib/email-store";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, QueryTabs, table } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { adminNotifications, adminTopicCounts30, emailCounts30, emailLog, type AdminNotificationRow } from "@/lib/admin/insights";
import { catalogEntry, mailCatalog } from "@/lib/admin/mail-catalog";
import { allMailOverrides } from "@/lib/email-store";
import { adminEmail, isEmailConfigured } from "@/lib/email";
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
  disabled: { tone: "muted", label: "Mail uitgezet" },
} as const;

async function Emails({ searchParams }: Pick<PageProps<"/beheer/emails">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!isDemoMode()) await loadStoredConfig();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const view = sp.weergave === "log" ? "log" : sp.weergave === "meldingen" ? "meldingen" : "teksten";
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  return (
    <>
      <Notice code={str("melding")} />
      <PageTitle title="E-mails" intro="Pas de teksten van de mails aan je klanten aan, zie welke mails er zijn verstuurd en lees de meldingen aan jou terug.">
        <QueryTabs
          base="/beheer/emails"
          param="weergave"
          current={view === "teksten" ? null : view}
          options={[{ label: "Teksten" }, { value: "meldingen", label: "Meldingen aan jou" }, { value: "log", label: "Verstuurde mails" }]}
        />
      </PageTitle>
      {!isDemoMode() && !isEmailConfigured() && (
        <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          E-mail is nog niet ingesteld: mails worden niet echt verstuurd (wel gelogd). Vul je mailbox in bij Koppelingen.
        </p>
      )}
      {view === "log" ? (
        <Log q={str("q")} status={str("status")} kind={str("soort")} />
      ) : view === "meldingen" ? (
        <Notifications topic={str("soort")} />
      ) : (
        <Texts />
      )}
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
        Meldingen aan jou (nieuwe bestelling, opzegging, garantie-aanvraag, enz.) staan bij{" "}
        <Link href="/beheer/emails?weergave=meldingen" className="font-semibold text-brand-700 underline">
          Meldingen aan jou
        </Link>
        ; daar zet je de mail per soort aan of uit. Wettelijk verplichte onderdelen, zoals de inhoud van een herroeping, zijn niet aanpasbaar.
      </p>
    </div>
  );
}

/** Maakt adressen in een melding klikbaar; links naar het beheer openen in hetzelfde tabblad. */
function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part;
        const inAdmin = part.startsWith(`${site.url}/beheer`);
        return inAdmin ? (
          <Link key={i} href={part.slice(site.url.length)} className="font-semibold text-brand-700 underline">
            {part.slice(site.url.length)}
          </Link>
        ) : (
          <a key={i} href={part} target="_blank" rel="noopener" className="font-semibold text-brand-700 underline break-all">
            {part}
          </a>
        );
      })}
    </>
  );
}

const subjectWithoutPrefix = (s: string) => s.replace(/^\[[^\]]+\]\s*/, "");

function NotificationItem({ n }: { n: AdminNotificationRow }) {
  const info = adminTopicInfo(n.topic);
  const st = STATUS[n.status] ?? STATUS.sent;
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-start gap-x-3 gap-y-1 px-5 py-3.5 hover:bg-sand/50 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold break-words">{subjectWithoutPrefix(n.subject)}</span>
            <span className="block text-xs text-muted tabular-nums">
              {formatDateTime(n.createdAt)} · {info?.label ?? "Melding"}
            </span>
          </span>
          <Badge tone={st.tone}>{st.label}</Badge>
        </summary>
        <div className="space-y-2 border-t border-line bg-sand/40 px-5 py-3 text-sm">
          <p className="break-words whitespace-pre-wrap">{n.body ? <Linkified text={n.body} /> : "De inhoud van oudere meldingen is niet bewaard."}</p>
          {n.error && <p className="text-xs text-accent-600">Fout bij versturen: {n.error}</p>}
          {n.customerId && (
            <Link href={`/beheer/klanten/${n.customerId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 underline">
              Naar de klant <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      </details>
    </li>
  );
}

async function Notifications({ topic }: { topic?: string }) {
  const filter = isAdminTopic(topic) ? topic : undefined;
  const [counts, muted, rows] = await Promise.all([
    adminTopicCounts30(),
    isDemoMode() ? Promise.resolve(new Set<string>(["nieuwe-bestelling"])) : mutedAdminTopics(),
    adminNotifications({ topic: filter }),
  ]);
  const groups = [...new Set(ADMIN_TOPICS.map((t) => t.group))];
  const here = `/beheer/emails?weergave=meldingen${filter ? `&soort=${filter}` : ""}`;
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-6">
        <p className="text-sm text-muted">
          Deze meldingen stuurt de website naar <strong className="text-ink">{isDemoMode() ? "info@afvallenenafblijven.nl" : adminEmail()}</strong> (te
          wijzigen bij <Link href="/beheer/koppelingen#email" className="font-semibold text-brand-700 underline">Koppelingen</Link>). Zet je de mail
          van een soort uit, dan zie je die meldingen alleen nog hier.
        </p>
        {groups.map((group) => (
          <Panel key={group} title={group}>
            <ul className="divide-y divide-line">
              {ADMIN_TOPICS.filter((t) => t.group === group).map((t) => {
                const fixed = "fixed" in t && t.fixed;
                const off = !fixed && muted.has(t.id);
                return (
                  <li key={t.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-3.5">
                    <Link href={`/beheer/emails?weergave=meldingen&soort=${t.id}`} className="min-w-0 flex-1 basis-56 hover:underline">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {t.label}
                        {off && <Badge tone="muted">Mail uit</Badge>}
                      </span>
                      <span className="block text-sm text-muted">{t.trigger}</span>
                      <span className="mt-0.5 block text-xs text-muted tabular-nums">{formatNumber(counts[t.id] ?? 0)} in de laatste 30 dagen</span>
                    </Link>
                    {fixed ? (
                      <span className="text-xs font-semibold text-muted">Altijd per mail</span>
                    ) : (
                      <form action={setAdminTopic}>
                        <input type="hidden" name="onderwerp" value={t.id} />
                        <input type="hidden" name="aan" value={off ? "1" : "0"} />
                        <input type="hidden" name="terug" value={here} />
                        <SubmitButton className="btn-secondary !px-3 !py-1.5 text-xs">
                          {off ? <BellRing className="size-3.5" aria-hidden /> : <BellOff className="size-3.5" aria-hidden />}
                          {off ? "Mail aanzetten" : "Mail uitzetten"}
                        </SubmitButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
      <div>
        <Panel
          title={filter ? adminTopicInfo(filter)!.label : "Laatste meldingen"}
          action={
            filter ? (
              <Link href="/beheer/emails?weergave=meldingen" className="text-sm font-semibold text-brand-700 underline">
                Alle meldingen
              </Link>
            ) : undefined
          }
        >
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Nog geen meldingen{filter ? " van deze soort" : ""}.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((n) => (
                <NotificationItem key={n.id} n={n} />
              ))}
            </ul>
          )}
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Tik op een melding om de inhoud te lezen. Meldingen worden 12 maanden bewaard.</p>
        </Panel>
      </div>
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
            <option value="disabled">Mail uitgezet</option>
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
