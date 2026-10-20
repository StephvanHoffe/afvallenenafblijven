import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { WithdrawalForm } from "@/app/[lang]/(site)/herroepen/WithdrawalForm";
import { TranslationNote } from "@/components/LegalPage";
import { companyAddressLine, site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/herroepen";

const copy = defineCopy({
  nl: {
    title: "Overeenkomst herroepen",
    description: "Herroep je overeenkomst online met onze herroepingsfunctie.",
    eyebrow: "Herroepingsrecht",
  },
  en: {
    title: "Withdraw from the contract",
    description: "Withdraw from your contract online using our withdrawal function.",
    eyebrow: "Right of withdrawal",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function HerroepenPage() {
  const l = await getLocale();
  const t = copy[l];
  return (
    <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-2 [&>*]:min-w-0">
      <div>
        <p className="eyebrow mb-3">{t.eyebrow}</p>
        <h1 className="heading-lg">{t.title}</h1>
        {l === "en" && <TranslationNote path={PATH} />}
        <div className="prose-legal mt-6">{l === "en" ? <En /> : <Nl />}</div>
      </div>
      <div className="card h-fit p-6 sm:p-8">
        <WithdrawalForm />
      </div>
    </section>
  );
}

function Nl() {
  const c = site.company;
  return (
    <>
      <p>
        Als consument heb je bij een aankoop op afstand in principe 14 dagen bedenktijd. Binnen die termijn kun je de
        overeenkomst zonder opgaaf van redenen herroepen via de knop op deze pagina.
      </p>
      <h2>Belangrijk bij digitale schema&apos;s</h2>
      <p>
        Onze schema&apos;s zijn digitale inhoud die we direct na je betaling voor je maken. Bij het bestellen geef je
        uitdrukkelijk toestemming om direct te beginnen en verklaar je dat je weet dat je herroepingsrecht vervalt
        zodra het schema aan je is geleverd. Is je schema al geleverd, dan kun je de overeenkomst daarom in de regel
        niet meer herroepen. Wel kun je je abonnement altijd <Link href="/abonnement-opzeggen">opzeggen</Link>
        {site.guarantee.enabled ? (
          <>
            {" "}
            en geldt onze <Link href="/algemene-voorwaarden#garantie">tevredenheidsgarantie van {site.guarantee.days} dagen</Link>{" "}
            op je eerste betaling
          </>
        ) : null}
        .
      </p>
      <h2>Zo werkt het</h2>
      <ol>
        <li>Klik op &quot;Overeenkomst hier herroepen&quot; en vul je gegevens in.</li>
        <li>Controleer de gegevens en klik op &quot;Herroeping bevestigen&quot;.</li>
        <li>Je ontvangt direct per e-mail een ontvangstbevestiging met de inhoud, datum en tijd van je herroeping.</li>
      </ol>
      <p>
        Voor zover het herroepingsrecht van toepassing is, betalen we alle betalingen binnen 14 dagen terug via dezelfde
        betaalmethode. Liever per post of e-mail? Gebruik dan het{" "}
        <Link href="/algemene-voorwaarden#modelformulier">modelformulier voor herroeping</Link> en stuur het naar{" "}
        {c.legalName}, {companyAddressLine()} of naar <a href={`mailto:${c.email}`}>{c.email}</a>.
      </p>
    </>
  );
}

function En() {
  const c = site.company;
  return (
    <>
      <p>
        As a consumer, you generally have a 14-day cooling-off period when you buy something at a distance. Within that
        period, you can withdraw from the contract without giving any reason, using the button on this page.
      </p>
      <h2>Important for digital plans</h2>
      <p>
        Our plans are digital content that we create for you immediately after your payment. When you order, you
        expressly consent to us starting immediately and declare that you are aware that your right of withdrawal lapses
        as soon as the plan has been delivered to you. If your plan has already been delivered, you can therefore
        generally no longer withdraw from the contract. You can, however, always{" "}
        <Link href="/abonnement-opzeggen">cancel</Link> your subscription
        {site.guarantee.enabled ? (
          <>
            {" "}
            and our{" "}
            <Link href="/algemene-voorwaarden#garantie">{site.guarantee.days}-day satisfaction guarantee</Link> applies to
            your first payment
          </>
        ) : null}
        .
      </p>
      <h2>How it works</h2>
      <ol>
        <li>Click &quot;Withdraw from the contract here&quot; and fill in your details.</li>
        <li>Check the details and click &quot;Confirm withdrawal&quot;.</li>
        <li>
          You will immediately receive an acknowledgement of receipt by email, stating the content, date and time of your
          withdrawal.
        </li>
      </ol>
      <p>
        Insofar as the right of withdrawal applies, we will refund all payments within 14 days using the same payment
        method. Prefer to use post or email? Then use the{" "}
        <Link href="/algemene-voorwaarden#modelformulier">model withdrawal form</Link> and send it to {c.legalName},{" "}
        {companyAddressLine()} or to <a href={`mailto:${c.email}`}>{c.email}</a>.
      </p>
    </>
  );
}
