"use client";

import Link from "@/i18n/Link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, Loader2, Mail, TriangleAlert } from "lucide-react";
import { trackEvent } from "@/lib/consent";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

type Status = {
  state: "ready" | "processing" | "failed" | "awaiting_payment" | "unknown";
  value?: number;
  product?: string;
  duration?: string;
  plans?: { type: "voeding" | "training"; status: string }[];
};

const copy = defineCopy({
  nl: {
    steps: ["Betaling ontvangen", "Je dagdoelen berekenen", "Gerechten en trainingen samenstellen", "Kwaliteitscontrole"],
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
    processing: "Je schema wordt nu gemaakt…",
    duration:
      "Dit duurt meestal een paar minuten. Je mag deze pagina open laten staan; je ontvangt ook een e-mail zodra je schema klaar is.",
  },
  en: {
    steps: ["Payment received", "Calculating your daily targets", "Putting together meals and workouts", "Quality check"],
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
    processing: "Your plan is being created now…",
    duration:
      "This usually takes a few minutes. You can leave this page open; you'll also receive an email as soon as your plan is ready.",
  },
});

export function OrderStatus({ sessionId }: { sessionId: string }) {
  const l = useLocale();
  const c = copy[l];
  const steps = c.steps;
  const [status, setStatus] = useState<Status>({ state: "processing" });
  const [tick, setTick] = useState(0);
  const tracked = useRef(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`/api/bestelling/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const data = (await res.json()) as Status;
        if (stop) return;
        setStatus(data);
        if (!tracked.current && data.value !== undefined) {
          tracked.current = true;
          trackEvent("purchase", { value: data.value, currency: "EUR", transaction_id: sessionId });
        }
        if (data.state === "processing" || data.state === "awaiting_payment") timer = setTimeout(poll, 5000);
      } catch {
        if (!stop) timer = setTimeout(poll, 8000);
      }
    }
    poll();
    const ticker = setInterval(() => setTick((t) => t + 1), 4000);
    return () => {
      stop = true;
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [sessionId]);

  if (status.state === "ready") {
    return (
      <div className="card p-8 text-center">
        <CircleCheck className="mx-auto size-14 text-brand-600" aria-hidden />
        <h2 className="heading-md mt-4">{c.readyTitle}</h2>
        <p className="mt-2 text-muted">{c.readyText}</p>
        <a href={`/api/bestelling/inloggen?session_id=${encodeURIComponent(sessionId)}&taal=${l}`} className="btn-primary mt-6 text-lg">
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

  const active = status.state === "awaiting_payment" ? 0 : Math.min(1 + Math.floor(tick / 2), steps.length - 1);
  return (
    <div className="card p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
        <h2 className="heading-md">
          {status.state === "awaiting_payment" ? c.awaitingPayment : c.processing}
        </h2>
      </div>
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
      <p className="mt-6 text-sm text-muted">{c.duration}</p>
    </div>
  );
}
