"use client";

import { startTransition, useActionState, useState } from "react";
import { Apple, CircleAlert, CircleCheck, Loader2, RefreshCw, Scale, Smartphone, Unlink, Watch } from "lucide-react";
import { connectHealth, disconnectHealth, syncHealthNow, type ConnectState } from "@/app/[lang]/(site)/account/koppelingen";
import { DemoButton } from "@/components/account/DemoButton";
import { defineCopy, intlLocale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import Link from "@/i18n/Link";
import { formatDate } from "@/lib/format";
import type { HealthProvider } from "@/lib/health/types";
import { sourceName, type HealthConnectionView, type HealthView } from "@/lib/health/view";

export type ConnectionNotice = "gekoppeld" | "fout" | "geannuleerd" | null;

const copy = defineCopy({
  nl: {
    title: "Gezondheidsapps koppelen",
    intro:
      "Koppel je telefoon, horloge of weegschaal. Dan zien we hoeveel je echt beweegt en traint, wat dat oplevert, en rekenen we daarmee bij je volgende schema.",
    soon: "Binnenkort kun je hier Apple Health, je horloge (Garmin, Fitbit, Polar, Oura) of je Withings-weegschaal koppelen.",
    notice: {
      gekoppeld: "Gekoppeld! We halen nu je gegevens van de afgelopen 30 dagen op; dat kan een paar minuten duren.",
      fout: "Het koppelen is niet gelukt. Probeer het opnieuw, of neem contact met ons op als het blijft misgaan.",
      geannuleerd: "Het koppelen is afgebroken. Er is niets gekoppeld.",
    },
    connected: "Gekoppeld",
    pending: "Wacht op de eerste gegevens",
    error: "Opnieuw koppelen nodig",
    errorText: "We kunnen geen gegevens meer ophalen. Ontkoppel en koppel opnieuw.",
    sourceError: "Een van je apps gaf een fout. Koppel die app opnieuw via 'Kies je app'.",
    via: "via Junction",
    since: (d: string) => `Gekoppeld sinds ${d}`,
    synced: (d: string) => `bijgewerkt ${d}`,
    syncNow: "Nu bijwerken",
    disconnect: "Ontkoppelen",
    disconnectConfirm: "Weet je het zeker? We wissen dan ook de gegevens die via deze koppeling binnenkwamen.",
    addTitle: "Een koppeling toevoegen",
    apple: { title: "iPhone · Apple Health", text: "Stappen, trainingen en gewicht uit de Gezondheid-app, ook van je Apple Watch.", button: "Koppelcode maken" },
    cloud: { title: "Horloge of app", button: "Kies je app" },
    withings: { title: "Withings", text: "Je weegschaal en de Health Mate-app: je gewicht gaat dan vanzelf mee.", button: "Koppel Withings" },
    consent:
      "Ik geef toestemming om mijn stappen, actieve minuten en calorieën, trainingen en gewicht uit de gekozen app te gebruiken voor mijn schema's en voortgang. Intrekken kan altijd door te ontkoppelen.",
    privacy: "Lees hoe we hiermee omgaan in het privacybeleid",
    uses: "We halen alleen stappen, actieve minuten en calorieën, trainingen (soort en duur) en gewicht op. Geen hartslag, slaap, locatie of andere gegevens.",
    android:
      "Android: Health Connect en Samsung Health zonder horloge kunnen we (nog) niet rechtstreeks uitlezen; daarvoor is een app nodig. Koppel in dat geval je horloge-app of Withings.",
    codeTitle: "Je koppelcode",
    codeSteps: [
      "Installeer de gratis Junction-app uit de App Store op je iPhone.",
      "Open de app, kies 'Code invoeren' en vul de code hieronder in.",
      "Geef toegang tot Stappen, Workouts, Actieve energie en Gewicht.",
    ],
    codeValid: (time: string) => `Eenmalig te gebruiken, geldig tot ${time}.`,
    codeAfter: "Daarna verschijnt Apple Health hier vanzelf als gekoppeld.",
    demoCode: "Voorbeeld: zo ziet je koppelcode eruit. In je eigen omgeving werkt die echt.",
    demoNote: "Dit is een voorbeeld. In je eigen omgeving ga je nu naar de app om in te loggen en toestemming te geven.",
  },
  en: {
    title: "Connect health apps",
    intro:
      "Connect your phone, watch or scale. Then we can see how much you really move and train, what it achieves, and use it for your next plan.",
    soon: "Soon you'll be able to connect Apple Health, your watch (Garmin, Fitbit, Polar, Oura) or your Withings scale here.",
    notice: {
      gekoppeld: "Connected! We're now fetching your data from the last 30 days; this can take a few minutes.",
      fout: "Connecting didn't work. Please try again, or get in touch if it keeps failing.",
      geannuleerd: "Connecting was cancelled. Nothing has been connected.",
    },
    connected: "Connected",
    pending: "Waiting for the first data",
    error: "Needs reconnecting",
    errorText: "We can no longer fetch data. Disconnect and connect again.",
    sourceError: "One of your apps returned an error. Reconnect that app via 'Choose your app'.",
    via: "via Junction",
    since: (d: string) => `Connected since ${d}`,
    synced: (d: string) => `updated ${d}`,
    syncNow: "Update now",
    disconnect: "Disconnect",
    disconnectConfirm: "Are you sure? We'll also delete the data that came in through this connection.",
    addTitle: "Add a connection",
    apple: { title: "iPhone · Apple Health", text: "Steps, workouts and weight from the Health app, including your Apple Watch.", button: "Create pairing code" },
    cloud: { title: "Watch or app", button: "Choose your app" },
    withings: { title: "Withings", text: "Your scale and the Health Mate app: your weight then comes through automatically.", button: "Connect Withings" },
    consent:
      "I consent to the use of my steps, active minutes and calories, workouts and weight from the chosen app for my plans and progress. I can withdraw this at any time by disconnecting.",
    privacy: "Read how we handle this in the privacy policy",
    uses: "We only fetch steps, active minutes and calories, workouts (type and duration) and weight. No heart rate, sleep, location or other data.",
    android:
      "Android: we can't (yet) read Health Connect or Samsung Health directly without a watch; that requires an app. In that case, connect your watch app or Withings.",
    codeTitle: "Your pairing code",
    codeSteps: [
      "Install the free Junction app from the App Store on your iPhone.",
      "Open the app, choose 'Enter code' and type in the code below.",
      "Allow access to Steps, Workouts, Active Energy and Weight.",
    ],
    codeValid: (time: string) => `Single use, valid until ${time}.`,
    codeAfter: "Apple Health will then show up here as connected automatically.",
    demoCode: "Example: this is what your pairing code looks like. In your own account, it really works.",
    demoNote: "This is an example. In your own account, you'd now go to the app to sign in and give permission.",
  },
});

function connectionName(c: HealthConnectionView, via: string): string {
  if (c.provider === "withings") return "Withings";
  const names = c.sources.map(sourceName);
  return `${names.length ? names.join(", ") : "Junction"} (${via})`;
}

function ConnectionRow({ conn, demo }: { conn: HealthConnectionView; demo: boolean }) {
  const l = useLocale();
  const c = copy[l];
  const when = (d: Date) =>
    new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(
      new Date(d),
    );
  const Icon = conn.provider === "withings" ? Scale : conn.sources.includes("apple_health_kit") ? Apple : Watch;
  const status =
    conn.status === "error"
      ? { text: c.error, className: "bg-accent-50 text-accent-700", icon: <CircleAlert className="size-4" aria-hidden /> }
      : conn.status === "pending"
        ? { text: c.pending, className: "bg-sand text-ink", icon: <Loader2 className="size-4" aria-hidden /> }
        : { text: c.connected, className: "bg-brand-50 text-brand-800", icon: <CircleCheck className="size-4" aria-hidden /> };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-bold break-words">{connectionName(conn, c.via)}</p>
          <p className="text-sm text-muted">
            {c.since(formatDate(conn.connectedAt, l))}
            {conn.lastSyncAt ? ` · ${c.synced(when(conn.lastSyncAt))}` : ""}
          </p>
          {conn.status === "error" && <p className="mt-1 text-sm text-accent-700">{c.errorText}</p>}
          {conn.status !== "error" && conn.error === "bron" && <p className="mt-1 text-sm text-accent-700">{c.sourceError}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
          {status.icon}
          {status.text}
        </span>
        {demo ? (
          <>
            <DemoButton className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold hover:border-brand-300">
              <RefreshCw className="size-4" aria-hidden /> {c.syncNow}
            </DemoButton>
            <DemoButton className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-accent-700 hover:underline">
              <Unlink className="size-4" aria-hidden /> {c.disconnect}
            </DemoButton>
          </>
        ) : (
          <>
            <form action={syncHealthNow}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-bold hover:border-brand-300">
                <RefreshCw className="size-4" aria-hidden /> {c.syncNow}
              </button>
            </form>
            <form
              action={disconnectHealth}
              onSubmit={(e) => {
                if (!window.confirm(c.disconnectConfirm)) e.preventDefault();
              }}
            >
              <input type="hidden" name="provider" value={conn.provider} />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-accent-700 hover:underline">
                <Unlink className="size-4" aria-hidden /> {c.disconnect}
              </button>
            </form>
          </>
        )}
      </div>
    </li>
  );
}

function PairingCode({ code, expiresAt, demo }: { code: string; expiresAt?: string; demo: boolean }) {
  const l = useLocale();
  const c = copy[l];
  const time = expiresAt
    ? new Intl.DateTimeFormat(intlLocale(l), { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(expiresAt))
    : null;
  return (
    <div role="status" className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-5">
      <p className="flex items-center gap-2 font-extrabold">
        <Smartphone className="size-5 text-brand-600" aria-hidden /> {c.codeTitle}
      </p>
      {demo && <p className="mt-1 text-sm text-muted">{c.demoCode}</p>}
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-[0.9375rem]">
        {c.codeSteps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-white px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-widest select-all">{code}</p>
      <p className="mt-2 text-sm text-muted">
        {time ? `${c.codeValid(time)} ` : ""}
        {c.codeAfter}
      </p>
    </div>
  );
}

/** Koppelingen met gezondheidsapps: wat er gekoppeld is en een formulier om er een toe te voegen. */
export function HealthConnections({ health, demo = false, notice = null }: { health: HealthView; demo?: boolean; notice?: ConnectionNotice }) {
  const l = useLocale();
  const c = copy[l];
  const [state, action, pending] = useActionState<ConnectState, FormData>(connectHealth, {});
  const [demoState, setDemoState] = useState<{ code?: string; note?: boolean }>({});
  const [choice, setChoice] = useState<string | null>(null);
  const a = health.available;
  const any = a.withings || a.junction;
  const has = (p: HealthProvider) => health.connections.some((x) => x.provider === p);
  const cloudNames = health.junctionProviders.map(sourceName).join(", ");
  const code = demo ? demoState.code : state.code;

  return (
    <section id="koppelingen" className="card scroll-mt-24 p-6 sm:p-8">
      <h2 className="heading-md flex items-center gap-2">
        <Watch className="size-6 text-brand-600" aria-hidden /> {c.title}
      </h2>
      <p className="mt-1 text-[0.9375rem] text-muted">{c.intro}</p>

      {notice && (
        <p
          role="status"
          className={`mt-5 rounded-2xl p-4 text-[0.9375rem] font-semibold ${notice === "gekoppeld" ? "bg-brand-50 text-brand-800" : "bg-sand"}`}
        >
          {c.notice[notice]}
        </p>
      )}

      {health.connections.length > 0 && (
        <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white p-4 sm:p-5">
          {health.connections.map((conn) => (
            <ConnectionRow key={conn.provider} conn={conn} demo={demo} />
          ))}
        </ul>
      )}

      {!any ? (
        <p className="mt-6 rounded-2xl bg-sand p-4 text-[0.9375rem]">{c.soon}</p>
      ) : (
        <form
          action={action}
          onSubmit={(e) => {
            e.preventDefault();
            const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            const data = new FormData(e.currentTarget, submitter);
            setChoice(String(data.get("koppeling")));
            if (demo) {
              setDemoState(data.get("koppeling") === "apple" ? { code: "pk-eu-3f9a1c2b" } : { note: true });
              return;
            }
            startTransition(() => action(data));
          }}
          className="mt-6"
        >
          <h3 className="font-extrabold">{c.addTitle}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {a.apple && (
              <div className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Apple className="size-5 text-brand-600" aria-hidden /> {c.apple.title}
                </p>
                <p className="mt-1 flex-1 text-sm text-muted">{c.apple.text}</p>
                <button
                  type="submit"
                  name="koppeling"
                  value="apple"
                  disabled={pending}
                  className="btn-secondary mt-3 w-full !py-2.5 text-sm"
                  aria-describedby="koppel-toestemming"
                >
                  {pending && choice === "apple" && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {c.apple.button}
                </button>
              </div>
            )}
            {a.junction && health.junctionProviders.length > 0 && (
              <div className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Watch className="size-5 text-brand-600" aria-hidden /> {c.cloud.title}
                </p>
                <p className="mt-1 flex-1 text-sm text-muted">{cloudNames}</p>
                <button
                  type="submit"
                  name="koppeling"
                  value="junction"
                  disabled={pending}
                  className="btn-secondary mt-3 w-full !py-2.5 text-sm"
                  aria-describedby="koppel-toestemming"
                >
                  {pending && choice === "junction" && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {c.cloud.button}
                </button>
              </div>
            )}
            {a.withings && !has("withings") && (
              <div className="flex flex-col rounded-2xl border border-line bg-white p-4">
                <p className="flex items-center gap-2 font-bold">
                  <Scale className="size-5 text-brand-600" aria-hidden /> {c.withings.title}
                </p>
                <p className="mt-1 flex-1 text-sm text-muted">{c.withings.text}</p>
                <button
                  type="submit"
                  name="koppeling"
                  value="withings"
                  disabled={pending}
                  className="btn-secondary mt-3 w-full !py-2.5 text-sm"
                  aria-describedby="koppel-toestemming"
                >
                  {pending && choice === "withings" && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  {c.withings.button}
                </button>
              </div>
            )}
          </div>

          <label id="koppel-toestemming" className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" name="toestemming" value="ja" required className="mt-0.5 size-5 shrink-0 accent-brand-600" />
            <span>
              {c.consent}{" "}
              <Link href="/privacybeleid#gezondheidsapps" className="font-semibold text-brand-700 underline">
                {c.privacy}
              </Link>
              .
            </span>
          </label>

          {state.error && !demo && (
            <p role="alert" className="mt-3 text-sm font-semibold text-accent-700">
              {state.error}
            </p>
          )}
          {demo && demoState.note && (
            <p role="status" className="mt-3 text-sm font-semibold text-muted">
              {c.demoNote}
            </p>
          )}
        </form>
      )}

      {code && (
        <div className="mt-5">
          <PairingCode code={code} expiresAt={demo ? undefined : state.expiresAt} demo={demo} />
        </div>
      )}

      <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm text-muted">
        <p>{c.uses}</p>
        {any && <p>{c.android}</p>}
      </div>
    </section>
  );
}
