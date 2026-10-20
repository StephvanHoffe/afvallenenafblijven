import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { LoginForm } from "@/app/[lang]/(site)/inloggen/LoginForm";
import { TranslationNote } from "@/components/LegalPage";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/abonnement-opzeggen";

const copy = defineCopy({
  nl: {
    title: "Abonnement opzeggen",
    description: "Zeg je abonnement eenvoudig online op. Maandelijks opzegbaar na de minimale looptijd.",
    heading: "Opzeggen kan altijd online, in een paar klikken",
  },
  en: {
    title: "Cancel subscription",
    description: "Cancel your subscription easily online. Cancel any month after the minimum term.",
    heading: "You can always cancel online, in just a few clicks",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function OpzeggenPage() {
  const l = await getLocale();
  const t = copy[l];
  return (
    <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-2 [&>*]:min-w-0">
      <div>
        <p className="eyebrow mb-3">{t.title}</p>
        <h1 className="heading-lg">{t.heading}</h1>
        {l === "en" && <TranslationNote path={PATH} />}
        <div className="prose-legal mt-6">{l === "en" ? <En /> : <Nl />}</div>
      </div>
      <div className="card h-fit p-6 sm:p-8">
        <h2 className="heading-md mb-4">{t.title}</h2>
        <LoginForm purpose="opzeggen" />
      </div>
    </section>
  );
}

function Nl() {
  return (
    <>
      <p>Jammer dat je wilt stoppen! Zo werkt opzeggen:</p>
      <ul>
        <li>
          <strong>Maandabonnement:</strong> je zegt op tegen het einde van de lopende maand.
        </li>
        <li>
          <strong>Abonnement met een minimale looptijd van 3, 6 of 12 maanden:</strong> zeg je op binnen die looptijd,
          dan stopt je abonnement aan het einde ervan. Na de minimale looptijd is je abonnement maandelijks opzegbaar.
        </li>
        <li>Na de einddatum schrijven we niets meer af via de automatische incasso.</li>
        <li>Je houdt toegang tot alle schema&apos;s die je al hebt ontvangen.</li>
        <li>Je ontvangt altijd een bevestiging van je opzegging per e-mail.</li>
      </ul>
      <p>
        Ben je ingelogd? Ga dan naar <Link href="/account/abonnement?opzeggen=1">Mijn schema&apos;s</Link> en klik op
        &quot;Opzeggen&quot;. Niet ingelogd? Vul hiernaast je e-mailadres in; je ontvangt dan direct een link waarmee
        je opzegt.
      </p>
      <p>
        Wil je je bestelling binnen de wettelijke bedenktijd herroepen? Gebruik dan de{" "}
        <Link href="/herroepen">herroepingsfunctie</Link>.
      </p>
    </>
  );
}

function En() {
  return (
    <>
      <p>We&apos;re sorry to see you go! This is how cancelling works:</p>
      <ul>
        <li>
          <strong>Monthly subscription:</strong> you cancel with effect from the end of the current month.
        </li>
        <li>
          <strong>Subscription with a minimum term of 3, 6 or 12 months:</strong> if you cancel within that term, your
          subscription stops at the end of it. After the minimum term, you can cancel your subscription any month.
        </li>
        <li>After the end date, we will not collect anything further by direct debit.</li>
        <li>You keep access to all the plans you have already received.</li>
        <li>You will always receive confirmation of your cancellation by email.</li>
      </ul>
      <p>
        Are you logged in? Then go to <Link href="/account/abonnement?opzeggen=1">My plans</Link> and click
        &quot;Cancel&quot;. Not logged in? Enter your email address in the form; you will then immediately receive a link
        to cancel your subscription.
      </p>
      <p>
        Want to withdraw your order within the statutory cooling-off period? Then use the{" "}
        <Link href="/herroepen">withdrawal function</Link>.
      </p>
    </>
  );
}
