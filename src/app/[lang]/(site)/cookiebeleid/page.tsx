import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { LegalPage } from "@/components/LegalPage";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/cookiebeleid";

const copy = defineCopy({
  nl: {
    title: "Cookiebeleid",
    description: `Welke cookies ${site.name} gebruikt en hoe je je voorkeuren aanpast.`,
    intro:
      "Cookies zijn kleine bestanden die een website op je apparaat opslaat. We gebruiken alleen cookies die nodig zijn om de website te laten werken, tenzij je toestemming geeft voor meer.",
    heading: "Welke cookies gebruiken we?",
    columns: { name: "Naam", type: "Soort", party: "Van", purpose: "Doel", duration: "Bewaartermijn" },
    cookies: [
      {
        name: "afb_cookie_consent",
        type: "Noodzakelijk",
        party: site.name,
        purpose: "Onthoudt je cookiekeuze.",
        duration: "12 maanden",
      },
      {
        name: "afb_sessie",
        type: "Noodzakelijk",
        party: site.name,
        purpose: "Houdt je ingelogd op Mijn schema's (alleen na inloggen).",
        duration: "90 dagen",
      },
      {
        name: "__stripe_mid, __stripe_sid",
        type: "Noodzakelijk",
        party: "Stripe",
        purpose: "Veilig betalen en fraude voorkomen op de betaalpagina.",
        duration: "30 minuten tot 1 jaar",
      },
      {
        name: "_ga, _ga_*",
        type: "Analytisch (toestemming)",
        party: "Google Analytics",
        purpose: "Anonieme statistieken over het gebruik van de website.",
        duration: "Tot 2 jaar",
      },
      {
        name: "_fbp",
        type: "Marketing (toestemming)",
        party: "Meta",
        purpose: "Meten en verbeteren van advertenties op Facebook en Instagram.",
        duration: "3 maanden",
      },
    ],
  },
  en: {
    title: "Cookie policy",
    description: `Which cookies ${site.name} uses and how to change your preferences.`,
    intro:
      "Cookies are small files that a website stores on your device. We only use cookies that are needed to make the website work, unless you give your consent for more.",
    heading: "Which cookies do we use?",
    columns: { name: "Name", type: "Type", party: "From", purpose: "Purpose", duration: "Retention period" },
    cookies: [
      {
        name: "afb_cookie_consent",
        type: "Necessary",
        party: site.name,
        purpose: "Remembers your cookie choice.",
        duration: "12 months",
      },
      {
        name: "afb_sessie",
        type: "Necessary",
        party: site.name,
        purpose: "Keeps you logged in to My plans (only after logging in).",
        duration: "90 days",
      },
      {
        name: "__stripe_mid, __stripe_sid",
        type: "Necessary",
        party: "Stripe",
        purpose: "Secure payments and fraud prevention on the payment page.",
        duration: "30 minutes to 1 year",
      },
      {
        name: "_ga, _ga_*",
        type: "Analytics (consent)",
        party: "Google Analytics",
        purpose: "Anonymous statistics about the use of the website.",
        duration: "Up to 2 years",
      },
      {
        name: "_fbp",
        type: "Marketing (consent)",
        party: "Meta",
        purpose: "Measuring and improving adverts on Facebook and Instagram.",
        duration: "3 months",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function CookiebeleidPage() {
  const l = await getLocale();
  const t = copy[l];
  return (
    <LegalPage title={t.title} intro={t.intro} path={PATH}>
      <h2>{t.heading}</h2>
      <table>
        <thead>
          <tr>
            <th>{t.columns.name}</th>
            <th>{t.columns.type}</th>
            <th>{t.columns.party}</th>
            <th>{t.columns.purpose}</th>
            <th>{t.columns.duration}</th>
          </tr>
        </thead>
        <tbody>
          {t.cookies.map((c) => (
            <tr key={c.name}>
              <td>
                <code>{c.name}</code>
              </td>
              <td>{c.type}</td>
              <td>{c.party}</td>
              <td>{c.purpose}</td>
              <td>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {l === "en" ? <En /> : <Nl />}
    </LegalPage>
  );
}

function Nl() {
  return (
    <>
      <p>
        Daarnaast slaan we tijdens het invullen van de vragenlijst je antwoorden tijdelijk op in je browser (sessionStorage),
        zodat je verder kunt waar je gebleven was. Deze gegevens verdwijnen als je het tabblad sluit en worden pas naar ons
        verstuurd als je een plan bestelt.
      </p>
      <p>
        Om te zien waar bezoekers afhaken, slaan we in hetzelfde tabblad een willekeurig bezoeknummer op
        (<code>afb_bezoek</code>, sessionStorage). Daarmee tellen we welke pagina&apos;s en vragen een bezoek bekijkt, hoe lang een pagina openstaat en van welke
        website het bezoek kwam (alleen de naam). Het nummer
        verdwijnt als je het tabblad sluit, wordt niet gedeeld met andere partijen en niet gebruikt om je op andere websites te
        volgen; we slaan geen IP-adres op. Dit valt onder de uitzondering voor analytische gegevens met geringe gevolgen voor je
        privacy, en vraagt daarom geen toestemming. Staat &quot;Do Not Track&quot; of &quot;Global Privacy Control&quot; aan in je browser, dan
        meten we niets. Zie ook ons <Link href="/privacybeleid">privacybeleid</Link>.
      </p>

      <h2>Toestemming</h2>
      <p>
        Analytische en marketingcookies plaatsen we alleen als je daar via de cookiebanner toestemming voor geeft.
        Weigeren is net zo makkelijk als accepteren en heeft geen invloed op het gebruik van de website. Je kunt je keuze
        altijd wijzigen of je toestemming intrekken:
      </p>
      <p>
        <CookieSettingsButton className="btn-secondary" />
      </p>
      <p>
        Je kunt cookies ook verwijderen via de instellingen van je browser. Meer over hoe we met persoonsgegevens omgaan,
        lees je in ons <Link href="/privacybeleid">privacybeleid</Link>.
      </p>
    </>
  );
}

function En() {
  return (
    <>
      <p>
        In addition, while you are filling in the questionnaire, we temporarily store your answers in your browser
        (sessionStorage), so that you can continue where you left off. This data disappears when you close the tab and is
        only sent to us when you order a plan.
      </p>
      <p>
        To see where visitors drop off, we store a random visit number in the same tab (<code>afb_bezoek</code>,
        sessionStorage). We use it to count which pages and questions a visit views, how long a page is open and which website the visit
        came from (only its name). The number disappears when you close the
        tab, is not shared with other parties and is not used to track you on other websites; we do not store your IP address.
        This falls under the exemption for analytics with little impact on your privacy, so it does not require consent. If
        &quot;Do Not Track&quot; or &quot;Global Privacy Control&quot; is switched on in your browser, we do not measure anything. See also
        our <Link href="/privacybeleid">privacy policy</Link>.
      </p>

      <h2>Consent</h2>
      <p>
        We only place analytics and marketing cookies if you give your consent via the cookie banner. Refusing is just as
        easy as accepting and has no effect on your use of the website. You can always change your choice or withdraw your
        consent:
      </p>
      <p>
        <CookieSettingsButton className="btn-secondary" />
      </p>
      <p>
        You can also delete cookies via your browser settings. You can read more about how we handle personal data in our{" "}
        <Link href="/privacybeleid">privacy policy</Link>.
      </p>
    </>
  );
}
