import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { randomBytes } from "node:crypto";
import { CircleAlert, CircleCheck, KeyRound, PlugZap, RefreshCw, Save } from "lucide-react";
import { saveKoppeling, testKoppeling } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, Notice, PageTitle, Panel } from "@/components/beheer/ui";
import { site } from "@/config/site";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { adminNow } from "@/lib/admin/clock";
import {
  CONFIG_GROUPS,
  fieldStates,
  groupComplete,
  lastCronRun,
  lastTests,
  type ConfigGroup,
  type ConfigGroupId,
  type FieldState,
  type TestResult,
} from "@/lib/admin/koppelingen";
import type { StoredConfigKey } from "@/lib/config-keys";
import { isDatabaseConfigured, loadStoredConfig } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { tokenState } from "@/lib/instagram/posts";
import { webhookUrl } from "@/lib/mollie";
import Link from "@/i18n/Link";

export const metadata: Metadata = { title: "Koppelingen" };

const HERE = "/beheer/koppelingen";

export default function KoppelingenPage({ searchParams }: PageProps<"/beheer/koppelingen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Koppelingen searchParams={searchParams} />
    </Suspense>
  );
}

/** In de demo: lege velden met de voorstellen, nooit echte gegevens. */
function demoStates(): Record<StoredConfigKey, FieldState> {
  const out = {} as Record<StoredConfigKey, FieldState>;
  for (const f of CONFIG_GROUPS.flatMap((g) => g.fields)) {
    out[f.key] = { key: f.key, value: f.secret ? "" : (f.suggestion ?? ""), masked: null, source: null };
  }
  return out;
}

function groupStatus(group: ConfigGroup, complete: boolean, test: TestResult | undefined): { tone: "ok" | "warn" | "bad" | "muted"; label: string } {
  if (!complete) return group.optional ? { tone: "muted", label: "Optioneel" } : { tone: "warn", label: "Nog invullen" };
  if (!test) return { tone: "muted", label: "Nog niet getest" };
  return test.ok ? { tone: "ok", label: "Werkt" } : { tone: "bad", label: "Werkt niet" };
}

async function Koppelingen({ searchParams }: Pick<PageProps<"/beheer/koppelingen">, "searchParams">) {
  const demo = isDemoMode();
  if (!demo) await connection();
  await requireAdmin();
  const sp = await searchParams;
  const hasDb = demo || isDatabaseConfigured();

  if (!hasDb) {
    return (
      <>
        <PageTitle title="Koppelingen" />
        <Panel>
          <p className="px-5 py-4 text-sm">
            Koppel eerst de database bij Vercel (Storage → Neon). Daarna kun je hier Mollie, Claude en e-mail invullen.
          </p>
        </Panel>
      </>
    );
  }

  if (!demo) await loadStoredConfig({ force: true });
  const [states, tests, cronRun, igToken] = demo
    ? [demoStates(), {} as Partial<Record<ConfigGroupId, TestResult>>, null, null]
    : await Promise.all([fieldStates(), lastTests(), lastCronRun(), tokenState()]);
  const complete = (g: ConfigGroup) => !demo && groupComplete(g);
  const essential = CONFIG_GROUPS.filter((g) => !g.optional);
  const working = essential.filter((g) => complete(g) && tests[g.id]?.ok).length;
  const cronSecret = demo || Boolean(process.env.CRON_SECRET);
  const cronStale = !cronRun || adminNow() - cronRun.getTime() > 30 * 60 * 1000;
  const webhook = webhookUrl();

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      {sp.welkom === "1" && (
        <section className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 text-sm text-brand-900">
          <p className="flex items-center gap-2 font-bold">
            <CircleCheck className="size-5 shrink-0" aria-hidden /> Je eigen wachtwoord is ingesteld. Het startwachtwoord werkt niet meer.
          </p>
          <p className="mt-2">Vul nu hieronder de drie koppelingen in. Na elke &quot;Opslaan en testen&quot; zie je direct of het werkt.</p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5">
            <li>Mollie: plak je API-sleutel (eerst de testsleutel).</li>
            <li>Claude: plak je API-sleutel.</li>
            <li>E-mail: vul het wachtwoord van je mailbox in; de rest staat al klaar.</li>
          </ol>
        </section>
      )}
      <PageTitle
        title="Koppelingen"
        intro="De gegevens waarmee de website betaalt, schema's maakt, mailt en op Instagram plaatst. Je vult ze hier in; bij Vercel hoeft alleen de database gekoppeld te zijn."
      >
        {!demo && (
          <p className="text-sm font-semibold text-muted">
            {working} van {essential.length} werken
          </p>
        )}
      </PageTitle>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {CONFIG_GROUPS.map((group) => {
            const test = tests[group.id];
            const status = groupStatus(group, complete(group), test);
            return (
              <div key={group.id} id={group.id} className="scroll-mt-6">
                <Panel title={group.title} action={<Badge tone={status.tone}>{status.label}</Badge>}>
                  <form action={saveKoppeling} className="space-y-4 px-5 py-4" autoComplete="off">
                    <input type="hidden" name="groep" value={group.id} />
                    <input type="hidden" name="terug" value={HERE} />
                    <p className="text-sm text-muted">{group.intro}</p>
                    {group.id === "instagram" && igToken && process.env.INSTAGRAM_ACCESS_TOKEN?.trim().endsWith(igToken.tail) && (
                      <p className="text-xs text-muted">
                        Token automatisch verlengd op {formatDateTime(igToken.refreshedAt)}; geldig tot {formatDateTime(igToken.expiresAt)}.
                      </p>
                    )}
                    <div className={`grid grid-cols-1 gap-4 ${group.fields.length > 2 ? "sm:grid-cols-2" : ""}`}>
                      {group.fields.map((f) => {
                        const state = states[f.key];
                        return (
                          <div key={f.key} className="min-w-0">
                            <label className="block">
                              <span className="label">{f.label}</span>
                              <input
                                name={f.key}
                                type={f.secret ? "password" : f.inputMode === "email" ? "email" : "text"}
                                inputMode={f.inputMode === "url" ? "url" : f.inputMode}
                                defaultValue={state.value}
                                placeholder={f.secret && state.masked ? "Laat leeg om niet te wijzigen" : f.placeholder}
                                // Voorkomt dat de browser hier je beheerwachtwoord invult.
                                autoComplete={f.secret ? "new-password" : "off"}
                                data-1p-ignore
                                data-lpignore="true"
                                spellCheck={false}
                                autoCapitalize="off"
                                className="input !py-2.5"
                              />
                            </label>
                            <p className="mt-1 text-xs text-muted">{f.hint}</p>
                            {(state.masked || state.source === "hosting") && (
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                {state.masked && <span className="font-semibold">Ingesteld: {state.masked}</span>}
                                {state.source === "hosting" && <Badge tone="info">uit Vercel</Badge>}
                                {state.masked && state.source === "beheer" && (
                                  <label className="inline-flex items-center gap-1 text-muted">
                                    <input type="checkbox" name={`${f.key}__wissen`} value="1" /> wissen
                                  </label>
                                )}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <SubmitButton className="btn-primary !px-4 !py-2.5 text-sm">
                      <Save className="size-4" aria-hidden /> Opslaan en testen
                    </SubmitButton>
                  </form>
                  {test && (
                    <form action={testKoppeling} className="flex flex-col gap-3 border-t border-line px-5 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                      <input type="hidden" name="groep" value={group.id} />
                      <input type="hidden" name="terug" value={HERE} />
                      <p className="flex min-w-0 items-start gap-2 sm:flex-1">
                        {test.ok ? (
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-label="Werkt" />
                        ) : (
                          <CircleAlert className="mt-0.5 size-4 shrink-0 text-accent-500" aria-label="Werkt niet" />
                        )}
                        <span className="min-w-0 break-words">
                          {test.detail}
                          <span className="block text-xs text-muted">Getest op {formatDateTime(test.at)}</span>
                        </span>
                      </p>
                      <SubmitButton className="btn-secondary self-start !px-3 !py-1.5 text-sm">
                        <RefreshCw className="size-4" aria-hidden /> Opnieuw testen
                      </SubmitButton>
                    </form>
                  )}
                </Panel>
              </div>
            );
          })}
        </div>

        <div className="space-y-6">
          <Panel title="Bij Vercel">
            <ul className="divide-y divide-line text-sm">
              <li className="flex items-start gap-3 px-5 py-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-label="In orde" />
                <span>
                  <span className="font-semibold">Database</span>
                  <span className="block text-muted">Verbonden. Hier staan ook de gegevens van deze pagina.</span>
                </span>
              </li>
              <li className="flex items-start gap-3 px-5 py-3">
                {demo || !cronStale ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-label="In orde" />
                ) : (
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-accent-500" aria-label="Actie nodig" />
                )}
                <span className="min-w-0">
                  <span className="font-semibold">Geplande taak</span>
                  <span className="block text-muted">
                    {cronSecret ? "Beveiligd met CRON_SECRET." : "Niets in te vullen: de taak draait ook zonder sleutel."}{" "}
                    {cronRun ? `Laatst gedraaid: ${formatDateTime(cronRun)}.` : "Nog niet gedraaid."}
                    {!demo && cronStale && " Draait hij niet elke 5 minuten, controleer dan of je project op Vercel Pro staat."}
                  </span>
                  {!cronSecret && (
                    <details className="mt-2 text-xs text-muted">
                      <summary className="cursor-pointer font-semibold text-ink">Extra slot erop (optioneel)</summary>
                      <span className="mt-1 block">
                        Zonder sleutel kan iedereen de taak starten, maar hij draait hooguit eens per 3 minuten en doet alleen wat toch al
                        gepland stond. Wil je dat alleen Vercel hem kan starten, zet dan bij Vercel → Settings → Environment Variables:
                      </span>
                      <span className="mt-2 block rounded-xl bg-sand px-3 py-2 font-mono break-all text-ink">
                        CRON_SECRET = {randomBytes(24).toString("base64url")}
                      </span>
                      <span className="mt-1 block">
                        en kies daarna Deployments → Redeploy. Dit kan niet op deze pagina: Vercel stuurt alleen de sleutel uit zijn eigen
                        instellingen mee.
                      </span>
                    </details>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-3 px-5 py-3">
                {webhook ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-label="In orde" />
                ) : (
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-accent-500" aria-label="Actie nodig" />
                )}
                <span className="min-w-0">
                  <span className="font-semibold">Websiteadres</span>
                  <span className="block break-all text-muted">
                    {site.url}
                    {webhook ? ". Mollie meldt betalingen automatisch op dit adres." : ". Lokaal adres: Mollie kan de website niet bereiken."}
                  </span>
                </span>
              </li>
            </ul>
          </Panel>

          <Panel title="Beheerwachtwoord">
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="text-muted">
                Je eigen wachtwoord staat versleuteld in de database. Wijzig je het, dan worden andere apparaten uitgelogd.
              </p>
              <Link href="/beheer/wachtwoord" className="btn-secondary !px-3.5 !py-2 text-sm">
                <KeyRound className="size-4" aria-hidden /> Wachtwoord wijzigen
              </Link>
              <p className="text-xs text-muted">
                Wachtwoord kwijt? Zet bij Vercel ADMIN_PASSWORD (minimaal 12 tekens) en redeploy: daarmee kun je altijd inloggen en een nieuw
                wachtwoord kiezen. Haal hem daarna weer weg.
              </p>
            </div>
          </Panel>

          <Panel title="Hoe werkt dit?">
            <div className="space-y-2 px-5 py-4 text-sm text-muted">
              <p className="flex items-start gap-2">
                <PlugZap className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                Wijzigingen gelden binnen een halve minuut, zonder opnieuw te deployen.
              </p>
              <p>
                Sleutels en wachtwoorden zie je na het opslaan nooit meer: van een API-sleutel alleen de laatste vier tekens. Leeg laten betekent: niet wijzigen.
              </p>
              <p>Staat een waarde ook bij Vercel, dan gaat die van deze pagina voor.</p>
              <p>
                Een testmail sturen kan bij{" "}
                <Link href="/beheer/instellingen" className="font-semibold text-brand-700 underline">
                  Instellingen
                </Link>
                .
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
