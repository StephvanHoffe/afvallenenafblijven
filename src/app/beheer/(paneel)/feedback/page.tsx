import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { Meter, NeedsDatabase, PageTitle, Panel, QueryTabs, StatTile, pct } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { feedbackReport } from "@/lib/admin/insights";
import { CANCEL_REASONS, cancelReasonLabel } from "@/lib/cancel-reasons";
import { checkinOptions } from "@/lib/checkin";
import { formatDate, formatNumber } from "@/lib/format";
import { planName } from "@/components/beheer/ui";
import { isProductId, type DurationId } from "@/config/pricing";

export const metadata: Metadata = { title: "Feedback" };

const PERIODS = [
  { value: "30", label: "30 dagen" },
  { label: "90 dagen" },
  { value: "365", label: "12 maanden" },
];

/** Antwoorden die op een probleem wijzen: die tellen we als "aandacht". */
const CONCERNS: Record<string, string[]> = {
  nutritionAdherence: ["Soms (50-70%)", "Weinig (minder dan 50%)"],
  hunger: ["Vaak"],
  energy: ["Laag"],
  sleep: ["Slecht"],
  trainingAdherence: ["Ongeveer de helft", "Weinig of geen"],
  difficulty: ["Te zwaar", "Te licht"],
};

export default function FeedbackPage({ searchParams }: PageProps<"/beheer/feedback">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Feedback searchParams={searchParams} />
    </Suspense>
  );
}

function Quote({ children, who, href, at }: { children: React.ReactNode; who: string; href: string; at: Date }) {
  return (
    <li className="px-5 py-3 text-sm">
      <p>&ldquo;{children}&rdquo;</p>
      <p className="mt-0.5 text-xs text-muted">
        <Link href={href} className="font-semibold hover:underline">
          {who}
        </Link>{" "}
        · {formatDate(at)}
      </p>
    </li>
  );
}

async function Feedback({ searchParams }: Pick<PageProps<"/beheer/feedback">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const days = sp.dagen === "30" ? 30 : sp.dagen === "365" ? 365 : 90;
  const r = await feedbackReport(days);

  // Elke check-in beantwoordt de vragen hieronder; het grootste totaal is dus het aantal check-ins.
  const total = Math.max(r.checkins.length, ...r.distributions.map((d) => d.answers.reduce((s, a) => s + a.count, 0)));
  const ratingAvg = r.ratings.length ? r.ratings.reduce((s, x) => s + x.rating, 0) / r.ratings.length : null;
  const reasonCounts = CANCEL_REASONS.map((reason) => ({ reason, count: r.cancellations.filter((c) => c.reason === reason).length }));
  const noReason = r.cancellations.filter((c) => !c.reason).length;
  const maxReason = Math.max(1, noReason, ...reasonCounts.map((x) => x.count));
  const comments = r.checkins.filter((c) => c.data.comments || c.data.likedMeals || c.data.dislikedMeals);
  const onTrack = r.distributions.find((d) => d.key === "nutritionAdherence");
  const onTrackShare = onTrack
    ? pct(
        onTrack.answers.filter((a) => !CONCERNS.nutritionAdherence.includes(a.answer)).reduce((s, a) => s + a.count, 0),
        onTrack.answers.reduce((s, a) => s + a.count, 0),
      )
    : "–";

  return (
    <>
      <PageTitle
        title="Feedback"
        intro="Wat klanten zeggen in check-ins en weegmomenten, waarom ze opzeggen of hun geld terugvragen, en hoe jij de schema's beoordeelt."
      >
        <QueryTabs base="/beheer/feedback" param="dagen" current={sp.dagen === "30" || sp.dagen === "365" ? sp.dagen : null} options={PERIODS} label="Periode" />
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Check-ins" value={formatNumber(total)} hint={`Laatste ${days} dagen`} />
        <StatTile label="Volgt het voedingsschema meestal" value={onTrackShare} hint="70% of meer van de maaltijden volgens schema" />
        <StatTile label="Opzeggingen" value={formatNumber(r.cancellations.length)} hint={`${formatNumber(r.cancellations.length - noReason)} met reden`} tone={r.cancellations.length ? "warn" : "default"} />
        <StatTile
          label="Jouw beoordeling schema's"
          value={ratingAvg === null ? "–" : `${ratingAvg.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} / 5`}
          hint={`${formatNumber(r.ratings.length)} beoordeeld`}
        />
      </div>

      <Panel title="Antwoorden in de check-ins" className="mt-6">
        <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2 xl:grid-cols-3">
          {r.distributions.map((d) => {
            const order = checkinOptions[d.key as keyof typeof checkinOptions] as readonly string[] | undefined;
            const answers = order ? order.map((answer) => ({ answer, count: d.answers.find((a) => a.answer === answer)?.count ?? 0 })) : d.answers;
            const sum = answers.reduce((s, a) => s + a.count, 0);
            const max = Math.max(1, ...answers.map((a) => a.count));
            return (
              <div key={d.key}>
                <h3 className="text-sm font-bold">{d.label}</h3>
                <ul className="mt-2 space-y-2">
                  {answers.map((a) => {
                    const concern = CONCERNS[d.key]?.includes(a.answer);
                    return (
                      <li key={a.answer} className="text-sm">
                        <div className="flex justify-between gap-3">
                          <span className={concern ? "font-medium" : ""}>
                            {a.answer}
                            {concern && <span className="sr-only"> (aandachtspunt)</span>}
                          </span>
                          <span className="text-muted tabular-nums">
                            {formatNumber(a.count)} · {pct(a.count, sum)}
                          </span>
                        </div>
                        <Meter value={a.count} max={max} tone={concern ? "warn" : "brand"} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Oranje = antwoorden die op een probleem wijzen (bijv. vaak honger of trainingen te zwaar). De software stuurt het volgende schema daar
          automatisch op bij; zie je hier een patroon bij veel klanten, kijk dan of de uitgangspunten beter kunnen.
        </p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Waarom zeggen klanten op?">
          <ul className="space-y-2.5 p-5">
            {[...reasonCounts, ...(noReason ? [{ reason: null, count: noReason }] : [])]
              .filter((x) => x.count > 0 || x.reason !== null)
              .map((x) => (
                <li key={x.reason ?? "geen"} className="text-sm">
                  <div className="flex justify-between gap-3">
                    <span>{cancelReasonLabel(x.reason)}</span>
                    <span className="text-muted tabular-nums">
                      {formatNumber(x.count)} · {pct(x.count, r.cancellations.length)}
                    </span>
                  </div>
                  <Meter value={x.count} max={maxReason} />
                </li>
              ))}
          </ul>
          {r.cancellations.some((c) => c.comment) && (
            <ul className="divide-y divide-line border-t border-line">
              {r.cancellations
                .filter((c) => c.comment)
                .slice(0, 15)
                .map((c) => (
                  <Quote key={`${c.customerId}-${c.at.toISOString()}`} who={`${c.customerName} · ${cancelReasonLabel(c.reason)}${isProductId(c.product) ? ` · ${planName(c.product, c.duration as DurationId)}` : ""}`} href={`/beheer/klanten/${c.customerId}`} at={c.at}>
                    {c.comment}
                  </Quote>
                ))}
            </ul>
          )}
        </Panel>

        <Panel title="Garantie-aanvragen">
          {r.guarantees.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Geen garantie-aanvragen in deze periode.</p>
          ) : (
            <ul className="divide-y divide-line">
              {r.guarantees.map((g) => (
                <Quote key={`${g.customerId}-${g.at.toISOString()}`} who={g.customerName} href={`/beheer/klanten/${g.customerId}`} at={g.at}>
                  {g.reason ?? "Geen reden opgegeven"}
                </Quote>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Opmerkingen bij check-ins">
          {comments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Nog geen opmerkingen.</p>
          ) : (
            <ul className="divide-y divide-line">
              {comments.slice(0, 30).map((c) => (
                <li key={`${c.customerId}-${c.createdAt.toISOString()}`} className="px-5 py-3 text-sm">
                  {c.data.comments && <p>&ldquo;{c.data.comments}&rdquo;</p>}
                  {(c.data.likedMeals || c.data.dislikedMeals) && (
                    <p className="mt-1 text-xs">
                      {c.data.likedMeals && (
                        <>
                          <span className="text-muted">Lekker: </span>
                          {c.data.likedMeals}
                        </>
                      )}
                      {c.data.likedMeals && c.data.dislikedMeals && " · "}
                      {c.data.dislikedMeals && (
                        <>
                          <span className="text-muted">Niet lekker: </span>
                          {c.data.dislikedMeals}
                        </>
                      )}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    <Link href={`/beheer/klanten/${c.customerId}`} className="font-semibold hover:underline">
                      {c.customerName}
                    </Link>{" "}
                    · {c.seq ? `voor periode ${c.seq} · ` : ""}
                    {formatDate(c.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Opmerkingen bij weegmomenten">
          {r.weekly.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Nog geen opmerkingen.</p>
          ) : (
            <ul className="divide-y divide-line">
              {r.weekly.slice(0, 30).map((w) => (
                <Quote key={`${w.customerId}-${w.createdAt.toISOString()}`} who={`${w.customerName} · week ${w.week}`} href={`/beheer/klanten/${w.customerId}`} at={w.createdAt}>
                  {w.comment}
                </Quote>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Jouw beoordelingen van schema's" className="mt-6">
        {r.ratings.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">
            Nog niets beoordeeld. Open een schema onder Schema&apos;s en geef het een cijfer van 1 tot 5; zo zie je hier of de kwaliteit stabiel
            blijft.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {r.ratings.map((x) => (
              <li key={x.planId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="min-w-0">
                  <Link href={`/beheer/schemas/${x.planId}`} className="font-semibold hover:underline">
                    {x.customerName} · {x.type === "voeding" ? "voeding" : "training"} periode {x.seq}
                  </Link>
                  {x.note && <span className="block text-muted">{x.note}</span>}
                </span>
                <span className="flex items-center gap-1 font-bold tabular-nums">
                  <Star className="size-4 fill-current text-amber-500" aria-hidden /> {x.rating}/5
                  <span className="ml-2 text-xs font-normal text-muted">{formatDate(x.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
