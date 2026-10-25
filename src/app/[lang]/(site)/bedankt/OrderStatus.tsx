"use client";

import Link from "@/i18n/Link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, Loader2, Mail, TriangleAlert } from "lucide-react";
import { site } from "@/config/site";
import { trackEvent } from "@/lib/consent";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

type Status = {
  state: "ready" | "processing" | "failed" | "awaiting_payment" | "payment_failed" | "unknown";
  value?: number;
  orderReference?: string;
  product?: string;
  duration?: string;
  plans?: { type: "voeding" | "training"; status: string }[];
};

const hours = site.delivery.promiseHours;

const copy = defineCopy({
  nl: {
    steps: ["Betaling ontvangen", "We stellen je schema samen en controleren het", "Je schema staat klaar en je krijgt een e-mail"],
    processingTitle: `Binnen ${hours} uur staat je schema klaar`,
    processingText:
      "We stellen je persoonlijke schema nu samen. Zodra het klaarstaat, krijg je een e-mail met een persoonlijke link; je hoeft deze pagina dus niet open te laten.",
    spam: "Geen e-mail gezien? Kijk dan ook even in je spammap.",
    account: "Naar Mijn schema's",
    readyTitle: "Je schema staat klaar!",
    readyText: "We hebben je ook een e-mail gestuurd met een persoonlijke link.",
    readyButton: "Bekijk mijn schema",
    failedTitle: "Het maken van je schema duurt langer dan normaal",
    failedText:
      "Geen zorgen: je betaling is binnen en we zijn ermee bezig. Je ontvangt je schema per e-mail zodra het klaar is.",
    questions: "Vragen?",
    contact: "Neem contact op",
    unknownTitle: "Bedankt voor je bestelling!",
    unknownText: "Je ontvangt je schema per e-mail zodra het klaar is. Check ook je spammap.",
    awaitingPayment: "We wachten op de bevestiging van je betaling…",
    paymentFailedTitle: "Je betaling is niet gelukt",
    paymentFailedText: "De betaling is afgebroken of niet gelukt, dus er is niets afgeschreven. Je antwoorden zijn bewaard: je kunt het meteen opnieuw proberen.",
    retry: "Opnieuw betalen",
  },
  en: {
    steps: ["Payment received", "We're putting your plan together and checking it", "Your plan is ready and we'll email you"],
    processingTitle: `Your plan will be ready within ${hours} hours`,
    processingText:
      "We're putting your personal plan together now. As soon as it's ready, we'll send you an email with a personal link, so there's no need to keep this page open.",
    spam: "No email? Be sure to check your spam folder too.",
    account: "Go to My plans",
    readyTitle: "Your plan is ready!",
    readyText: "We've also sent you an email with a personal link.",
    readyButton: "View my plan",
    failedTitle: "Creating your plan is taking longer than usual",
    failedText:
      "Don't worry: your payment has come through and we're working on it. You'll receive your plan by email as soon as it's ready.",
    questions: "Questions?",
    contact: "Get in touch",
    unknownTitle: "Thank you for your order!",
    unknownText: "You'll receive your plan by email as soon as it's ready. Be sure to check your spam folder too.",
    awaitingPayment: "We're waiting for confirmation of your payment…",
    paymentFailedTitle: "Your payment didn't go through",
    paymentFailedText: "The payment was cancelled or didn't go through, so nothing has been charged. Your answers have been saved, so you can try again straight away.",
    retry: "Try paying again",
  },
});

export function OrderStatus({ intakeId }: { intakeId: string }) {
  const l = useLocale();
  const c = copy[l];
  const steps = c.steps;
  // Zonder bestelnummer (bijv. de pagina direct geopend) valt er niets op te vragen.
  const [status, setStatus] = useState<Status>({ state: intakeId ? "awaiting_payment" : "unknown" });
  const tracked = useRef(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    if (!intakeId) return;
    async function poll() {
      try {
        const res = await fetch(`/api/bestelling/status?bestelling=${encodeURIComponent(intakeId)}`, { cache: "no-store" });
        const data = (await res.json()) as Status;
        if (stop) return;
        setStatus(data);
        if (!tracked.current && data.value !== undefined) {
          tracked.current = true;
          trackEvent("purchase", { value: data.value, currency: "EUR", transaction_id: data.orderReference ?? intakeId });
        }
        // Wachten op de betaling: vaak kijken. Daarna rustig: het schema staat binnen 2 uur klaar.
        if (data.state === "awaiting_payment") timer = setTimeout(poll, 5000);
        else if (data.state === "processing") timer = setTimeout(poll, 30000);
      } catch {
        if (!stop) timer = setTimeout(poll, 10000);
      }
    }
    poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [intakeId]);

  if (status.state === "ready") {
    return (
      <div className="card p-8 text-center">
        <CircleCheck className="mx-auto size-14 text-brand-600" aria-hidden />
        <h2 className="heading-md mt-4">{c.readyTitle}</h2>
        <p className="mt-2 text-muted">{c.readyText}</p>
        <a href={`/api/bestelling/inloggen?bestelling=${encodeURIComponent(intakeId)}&taal=${l}`} className="btn-primary mt-6 text-lg">
          {c.readyButton} <ArrowRight className="size-5" aria-hidden />
        </a>
      </div>
    );
  }

  if (status.state === "failed") {
    return (
      <div className="card p-8 text-center">
        <TriangleAlert className="mx-auto size-12 text-accent-500" aria-hidden />
        <h2 className="heading-md mt-4">{c.failedTitle}</h2>
        <p className="mt-2 text-muted">
          {c.failedText} {c.questions} <Link href="/contact" className="font-semibold underline">{c.contact}</Link>.
        </p>
      </div>
    );
  }

  if (status.state === "unknown") {
    return (
      <div className="card p-8 text-center">
        <Mail className="mx-auto size-12 text-brand-600" aria-hidden />
        <h2 className="heading-md mt-4">{c.unknownTitle}</h2>
        <p className="mt-2 text-muted">{c.unknownText}</p>
      </div>
    );
  }

  if (status.state === "payment_failed") {
    return (
      <div className="card p-8 text-center">
        <TriangleAlert className="mx-auto size-12 text-accent-500" aria-hidden />
        <h2 className="heading-md mt-4">{c.paymentFailedTitle}</h2>
        <p className="mt-2 text-muted">{c.paymentFailedText}</p>
        <Link href={`/start?hervat=${encodeURIComponent(intakeId)}`} className="btn-primary mt-6 text-lg">
          {c.retry} <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }

  if (status.state === "awaiting_payment") {
    return (
      <div className="card p-8" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
          <h2 className="heading-md">{c.awaitingPayment}</h2>
        </div>
      </div>
    );
  }

  const active = 1;
  return (
    <div className="card p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Mail className="size-8 shrink-0 text-brand-600" aria-hidden />
        <h2 className="heading-md">{c.processingTitle}</h2>
      </div>
      <p className="mt-3 text-muted">{c.processingText}</p>
      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i <= active ? "text-ink" : "text-muted/60"}`}>
            {i < active ? (
              <CircleCheck className="size-5 text-brand-600" aria-hidden />
            ) : i === active ? (
              <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
            ) : (
              <span className="size-5 rounded-full border-2 border-line" aria-hidden />
            )}
            <span className="font-semibold">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm text-muted">{c.spam}</p>
        <a href={`/api/bestelling/inloggen?bestelling=${encodeURIComponent(intakeId)}&taal=${l}`} className="btn-secondary !py-2.5 text-sm">
          {c.account} <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
