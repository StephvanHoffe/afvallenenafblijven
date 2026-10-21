import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, RotateCcw, Save, Send } from "lucide-react";
import { resetMailTexts, saveMailTexts, sendTestMail } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { NeedsDatabase, Notice, PageTitle, Panel, QueryTabs } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { catalogEntry } from "@/lib/admin/mail-catalog";
import { adminEmail } from "@/lib/email";
import { allMailOverrides } from "@/lib/email-store";
import { toLocale } from "@/i18n/config";

export const metadata: Metadata = { title: "E-mail aanpassen" };

export default function EmailEditPage({ params, searchParams }: PageProps<"/beheer/emails/[soort]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: PageProps<"/beheer/emails/[soort]">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [{ soort }, sp] = await Promise.all([params, searchParams]);
  const entry = catalogEntry(soort);
  if (!entry) notFound();
  const l = toLocale(typeof sp.taal === "string" ? sp.taal : "nl");
  const overrides = isDemoMode() ? new Map() : await allMailOverrides();
  const override = overrides.get(`${entry.kind}:${l}`) ?? null;
  const sample = entry.sample(l);
  const defaults = sample.defaults!;
  const preview = override ? sample.render!(override) : sample;
  const here = `/beheer/emails/${entry.kind}?taal=${l}`;
  const hidden = (
    <>
      <input type="hidden" name="soort" value={entry.kind} />
      <input type="hidden" name="taal" value={l} />
      <input type="hidden" name="terug" value={here} />
    </>
  );

  return (
    <>
      <Link href="/beheer/emails" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> E-mails
      </Link>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle title={entry.label} intro={entry.trigger}>
        <QueryTabs base={`/beheer/emails/${entry.kind}`} param="taal" current={l} label="Taal" options={[{ value: "nl", label: "Nederlands" }, { value: "en", label: "Engels" }]} />
      </PageTitle>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title={`Teksten (${l === "en" ? "Engels" : "Nederlands"})`}>
            <form action={saveMailTexts} className="space-y-4 p-5">
              {hidden}
              <div>
                <label htmlFor="onderwerp" className="label">
                  Onderwerp
                </label>
                <input id="onderwerp" name="onderwerp" defaultValue={override?.subject ?? defaults.subject} maxLength={300} className="input" />
              </div>
              <div>
                <label htmlFor="tekst" className="label">
                  Hoofdtekst
                </label>
                <textarea id="tekst" name="tekst" defaultValue={override?.intro ?? defaults.intro} rows={8} maxLength={4000} className="input" />
                <p className="mt-1 text-xs text-muted">Een lege regel begint een nieuwe alinea. De aanhef (&quot;Hoi {"{naam}"},&quot;) en de afsluiting staan er automatisch bij.</p>
              </div>
              {defaults.button !== "" && (
                <div>
                  <label htmlFor="knop" className="label">
                    Tekst op de knop
                  </label>
                  <input id="knop" name="knop" defaultValue={override?.button ?? defaults.button} maxLength={60} className="input" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <SubmitButton className="btn-primary !px-4 !py-2.5 text-sm">
                  <Save className="size-4" aria-hidden /> Opslaan
                </SubmitButton>
              </div>
            </form>
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
              <form action={sendTestMail}>
                {hidden}
                <SubmitButton className="btn-secondary !px-4 !py-2 text-sm">
                  <Send className="size-4" aria-hidden /> Testmail naar {isDemoMode() ? "mij" : adminEmail()}
                </SubmitButton>
              </form>
              {override && (
                <form action={resetMailTexts}>
                  {hidden}
                  <SubmitButton className="btn-secondary !px-4 !py-2 text-sm">
                    <RotateCcw className="size-4" aria-hidden /> Standaardtekst herstellen
                  </SubmitButton>
                </form>
              )}
            </div>
          </Panel>

          <Panel title="Plaatshouders">
            <ul className="divide-y divide-line text-sm">
              {Object.entries(entry.placeholders).map(([key, desc]) => (
                <li key={key} className="flex gap-3 px-5 py-2.5">
                  <code className="shrink-0 rounded bg-sand px-1.5 py-0.5 font-mono text-[0.8125rem]">{`{${key}}`}</code>
                  <span className="text-muted">{desc}</span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">Plaatshouders worden bij het versturen vervangen door de gegevens van de klant.</p>
          </Panel>

          {override && (
            <Panel title="Standaardtekst">
              <div className="space-y-2 p-5 text-sm">
                <p>
                  <span className="text-muted">Onderwerp: </span>
                  {defaults.subject}
                </p>
                <p className="whitespace-pre-line">{defaults.intro}</p>
                {defaults.button && (
                  <p>
                    <span className="text-muted">Knop: </span>
                    {defaults.button}
                  </p>
                )}
              </div>
            </Panel>
          )}
        </div>

        <Panel title="Voorbeeld (met fictieve gegevens)">
          <p className="border-b border-line px-5 py-3 text-sm">
            <span className="text-muted">Onderwerp: </span>
            <strong>{preview.subject}</strong>
          </p>
          <iframe title={`Voorbeeld van ${entry.label}`} srcDoc={preview.html} sandbox="" className="h-[48rem] w-full rounded-b-2xl" />
        </Panel>
      </div>
    </>
  );
}
