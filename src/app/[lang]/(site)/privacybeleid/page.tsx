import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { LegalPage } from "@/components/LegalPage";
import { companyAddressLine, site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/privacybeleid";

const copy = defineCopy({
  nl: {
    title: "Privacybeleid",
    description: `Hoe ${site.name} omgaat met je persoonsgegevens en gezondheidsgegevens.`,
    intro:
      "Om een persoonlijk schema voor je te maken, hebben we gegevens over jou nodig, waaronder gezondheidsgegevens. Daar gaan we zorgvuldig mee om. In dit privacybeleid lees je welke gegevens we verwerken, waarom, hoe lang en welke rechten je hebt.",
  },
  en: {
    title: "Privacy policy",
    description: `How ${site.name} handles your personal data and health data.`,
    intro:
      "To create a personal plan for you, we need information about you, including health data. We handle it with care. In this privacy policy you can read which data we process, why, for how long and what rights you have.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function PrivacyPage() {
  const l = await getLocale();
  const t = copy[l];
  return (
    <LegalPage title={t.title} intro={t.intro} path={PATH}>
      {l === "en" ? <En /> : <Nl />}
    </LegalPage>
  );
}

function Nl() {
  const c = site.company;
  return (
    <>
      <h2>1. Wie is verantwoordelijk?</h2>
      <p>
        {c.legalName} ({site.name}), {companyAddressLine()}, KvK {c.kvk}, is verwerkingsverantwoordelijke in de zin van
        de Algemene verordening gegevensbescherming (AVG). Vragen over privacy? Mail naar{" "}
        <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>.
      </p>

      <h2>2. Welke gegevens verwerken we?</h2>
      <ul>
        <li>
          <strong>Contactgegevens:</strong> je voornaam en e-mailadres.
        </li>
        <li>
          <strong>Intakegegevens:</strong> je antwoorden in de vragenlijst, zoals doel, geslacht, leeftijd, lengte,
          gewicht, streefgewicht, activiteit, eetpatroon, allergieën en voorkeuren, trainingsplek, ervaring en
          blessures.
        </li>
        <li>
          <strong>Gezondheidsgegevens (bijzondere persoonsgegevens):</strong> gewicht en lengte, eventuele zwangerschap,
          eetstoornis, medische aandoeningen, medicatie, blessures, je check-ins en je wekelijkse weegmomenten.
        </li>
        <li>
          <strong>Gegevens uit gekoppelde gezondheidsapps (optioneel):</strong> alleen als je een app of apparaat koppelt:
          je aantal stappen, actieve calorieën en actieve minuten per dag, je trainingen (soort sport, starttijd, duur en
          calorieën) en je lichaamsgewicht. Ook dit zijn gezondheidsgegevens. Zie <a href="#gezondheidsapps">punt 5</a>.
        </li>
        <li>
          <strong>Bestel- en betaalgegevens:</strong> wat je hebt besteld, bedragen, status van je abonnement en (via
          Stripe) je betaalmethode en factuurgegevens. Wij ontvangen geen volledige bank- of creditcardnummers. Kwam je
          binnen via een advertentie, dan bewaren we bij je bestelling ook de campagnegegevens uit de link (zoals bron en
          naam van de campagne) en de landingspagina.
        </li>
        <li>
          <strong>Je schema&apos;s:</strong> de voedings- en trainingsschema&apos;s die we voor je maken.
        </li>
        <li>
          <strong>Technische gegevens:</strong> gegevens die nodig zijn om de website veilig te laten werken (zoals
          serverlogs) en, alleen met je toestemming, analytische en marketinggegevens via cookies.
        </li>
        <li>
          <strong>Websitegebruik (zonder cookies):</strong> welke pagina&apos;s en stappen van de vragenlijst een bezoek
          bekijkt en hoe lang een pagina openstaat, het soort apparaat (mobiel, tablet of computer), de taal, de
          campagnegegevens uit de link en de website waarvandaan je kwam (alleen de naam, bijv. google.com). We gebruiken
          hiervoor een willekeurig bezoeknummer dat alleen in het tabblad van je browser staat (sessionStorage) en verdwijnt als
          je het tabblad sluit. We slaan geen IP-adres op en volgen je niet op andere websites. Staat &quot;Do Not Track&quot; of
          &quot;Global Privacy Control&quot; aan in je browser, dan meten we niets. Bestel je, dan koppelen we de meting van dat
          bezoek aan je bestelling.
        </li>
        <li>
          <strong>Berichten:</strong> wat je ons stuurt via het contactformulier, e-mail, de herroepingsfunctie of een garantie-aanvraag.
        </li>
        <li>
          <strong>Klantenservice:</strong> korte notities over contact dat je met ons hebt gehad, en een overzicht van de
          e-mails die we je stuurden (soort, onderwerp en tijdstip, niet de inhoud), zodat we kunnen nagaan of een mail is
          aangekomen.
        </li>
      </ul>

      <h2>3. Waarvoor en op welke grondslag?</h2>
      <table>
        <thead>
          <tr>
            <th>Doel</th>
            <th>Gegevens</th>
            <th>Grondslag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Je persoonlijke schema maken, leveren en bijsturen</td>
            <td>Contact-, intake- en gezondheidsgegevens, check-ins en weegmomenten</td>
            <td>
              Uitvoering van de overeenkomst; voor gezondheidsgegevens je uitdrukkelijke toestemming (art. 9 lid 2 sub a
              AVG)
            </td>
          </tr>
          <tr>
            <td>Veiligheidscheck (bijv. zwangerschap, eetstoornis, ondergewicht)</td>
            <td>Gezondheidsgegevens</td>
            <td>Uitdrukkelijke toestemming</td>
          </tr>
          <tr>
            <td>
              Je caloriedoel afstemmen op je werkelijke activiteit, je trainingen en voortgang tonen, je weegmoment en
              check-in vooraf invullen en je volgende schema bijsturen (alleen als je een gezondheidsapp koppelt)
            </td>
            <td>Gegevens uit gekoppelde gezondheidsapps</td>
            <td>Uitdrukkelijke toestemming (art. 9 lid 2 sub a AVG), in te trekken door de koppeling te verbreken</td>
          </tr>
          <tr>
            <td>Betalingen, facturen en abonnementsbeheer</td>
            <td>Contact-, bestel- en betaalgegevens</td>
            <td>Uitvoering van de overeenkomst; wettelijke (fiscale) bewaarplicht</td>
          </tr>
          <tr>
            <td>Inloggen en Mijn schema&apos;s</td>
            <td>E-mailadres, sessiecookie</td>
            <td>Uitvoering van de overeenkomst</td>
          </tr>
          <tr>
            <td>Klantenservice, klachten, herroepingen en garantie-aanvragen</td>
            <td>Contactgegevens, berichten, notities, overzicht van verstuurde e-mails</td>
            <td>Uitvoering van de overeenkomst; wettelijke verplichting</td>
          </tr>
          <tr>
            <td>Nieuwsbrief met tips en aanbiedingen</td>
            <td>Voornaam, e-mailadres</td>
            <td>Toestemming (altijd in te trekken)</td>
          </tr>
          <tr>
            <td>
              Eén herinnering als je de vragenlijst invult maar de betaling niet afrondt, met een link waarin je antwoorden al
              klaarstaan
            </td>
            <td>Voornaam, e-mailadres, je antwoorden in de vragenlijst</td>
            <td>Toestemming voor e-mail (dezelfde als voor de nieuwsbrief); zonder die toestemming sturen we niets</td>
          </tr>
          <tr>
            <td>Website verbeteren en advertenties meten</td>
            <td>Cookiegegevens</td>
            <td>
              Toestemming via de cookiebanner (zie <Link href="/cookiebeleid">cookiebeleid</Link>)
            </td>
          </tr>
          <tr>
            <td>Meten welke campagnes tot bestellingen leiden</td>
            <td>Campagnegegevens uit de link bij je bestelling (geen cookies)</td>
            <td>Gerechtvaardigd belang</td>
          </tr>
          <tr>
            <td>De website en vragenlijst verbeteren (bijv. zien bij welke vraag bezoekers afhaken)</td>
            <td>Websitegebruik zonder cookies (zie punt 2)</td>
            <td>Gerechtvaardigd belang; je kunt bezwaar maken via &quot;Do Not Track&quot; of &quot;Global Privacy Control&quot;</td>
          </tr>
          <tr>
            <td>Beveiliging en misbruik voorkomen</td>
            <td>Technische gegevens</td>
            <td>Gerechtvaardigd belang</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Hoe wordt je schema samengesteld?</h2>
      <p>
        Voor het samenstellen van je schema gebruiken we software van Anthropic (het taalmodel Claude). Daarvoor sturen
        we je voornaam, je intakeantwoorden (inclusief de relevante gezondheidsgegevens), je berekende dagdoelen en
        eventueel je check-in en de gegevens uit gekoppelde gezondheidsapps (zie <a href="#gezondheidsapps">punt 5</a>)
        naar Anthropic. Je e-mailadres en betaalgegevens sturen we niet mee. Anthropic verwerkt deze gegevens als
        verwerker in onze opdracht en gebruikt ze volgens haar zakelijke voorwaarden niet om haar modellen te trainen.
      </p>
      <p>
        Op basis van je antwoorden beslist ons systeem automatisch of we een schema kunnen maken (bijvoorbeeld niet bij
        zwangerschap of ondergewicht). Ben je het niet eens met zo&apos;n uitkomst? Neem dan contact met ons op; een
        mens bekijkt je situatie dan opnieuw.
      </p>

      <h2 id="gezondheidsapps">5. Koppelingen met gezondheidsapps</h2>
      <p>
        Je kunt een gezondheidsapp of apparaat, zoals een slimme weegschaal of sporthorloge, aan je account koppelen. Dat
        is volledig optioneel. We ontvangen alleen gegevens als je zelf een app koppelt via Mijn schema&apos;s → Mijn
        gegevens en daarbij een apart vakje aanvinkt waarmee je uitdrukkelijk toestemming geeft voor het verwerken van
        deze gezondheidsgegevens (art. 9 lid 2 sub a AVG). Je kunt je toestemming op elk moment intrekken door de
        koppeling op dezelfde plek te verbreken.
      </p>
      <h3>Welke gegevens ontvangen we?</h3>
      <ul>
        <li>je aantal stappen, actieve calorieën en actieve minuten per dag;</li>
        <li>je trainingen: soort sport, starttijd, duur en calorieën;</li>
        <li>je lichaamsgewicht, bijvoorbeeld van een slimme weegschaal.</li>
      </ul>
      <p>
        Hartslag, slaap, locatie of gps-routes, menstruatiegegevens en andere gezondheidsgegevens ontvangen en bewaren we
        niet, ook niet als die in de app staan.
      </p>
      <h3>Waarvoor gebruiken we ze?</h3>
      <ul>
        <li>om je caloriedoel af te stemmen op hoeveel je werkelijk beweegt;</li>
        <li>
          om te laten zien of en hoeveel je traint (trainingstrouw) en wat dat oplevert in je voortgangsgrafieken;
        </li>
        <li>om je wekelijkse weegmoment en je check-in alvast voor je in te vullen;</li>
        <li>
          als achtergrond bij het maken van je volgende schema. We verwerken ze dan op dezelfde manier als je check-in,
          ook via Anthropic (zie punt 4).
        </li>
      </ul>
      <h3>Hoe werkt de koppeling?</h3>
      <ul>
        <li>
          <strong>Withings</strong> (slimme weegschalen en de app Withings Health Mate): je koppelt rechtstreeks via de
          eigen inlogpagina van Withings. Withings is een Frans bedrijf.
        </li>
        <li>
          <strong>Andere apps en apparaten</strong>, zoals Apple Health (iPhone), Health Connect (Android), Garmin,
          Fitbit/Google, Oura, Polar, Samsung Health en andere: deze koppelen we via het gezondheidsdataplatform Junction
          (Vital Technologies Inc., VS), dat als verwerker in onze opdracht werkt. We gebruiken de EU-dataregio van
          Junction. Doorgifte naar de VS gebeurt op basis van het EU-VS Data Privacy Framework en/of de
          standaardcontractbepalingen van de Europese Commissie.
        </li>
        <li>
          <strong>Apple Health:</strong> gegevens uit Apple Health kunnen alleen op de iPhone zelf worden uitgelezen.
          Daarom installeer je de bijbehorende app van Junction op je iPhone en vul je daarin een eenmalige koppelcode in
          die je op onze website ziet.
        </li>
      </ul>
      <h3>Beveiliging, ontkoppelen en bewaren</h3>
      <p>
        De toegangssleutels (tokens) van je koppelingen slaan we versleuteld op. Verbreek je een koppeling, dan stoppen we
        direct met het ophalen van gegevens en verwijderen we direct de gezondheidsgegevens die we via die koppeling
        hebben ontvangen. Verder bewaren we deze gegevens even lang als je andere gegevens in je account (zie punt 7).
      </p>

      <h2>6. Met wie delen we gegevens?</h2>
      <p>
        We verkopen je gegevens nooit. We delen ze alleen met partijen die we nodig hebben om onze dienst te leveren:
      </p>
      <ul>
        <li>
          <strong>Anthropic</strong> (VS) – software voor het samenstellen van je schema (verwerker).
        </li>
        <li>
          <strong>Stripe</strong> (Ierland/VS) – betalingen, abonnementen en facturen. Stripe is voor een deel van de
          verwerking zelf verantwoordelijk, zie het privacybeleid van Stripe.
        </li>
        <li>
          <strong>Vercel</strong> (VS) – het hosten van de website; de website draait in een datacenter in Frankfurt
          (verwerker).
        </li>
        <li>
          <strong>Neon</strong> (VS) – de database waarin je gegevens versleuteld worden opgeslagen, in een datacenter in
          Frankfurt (verwerker).
        </li>
        <li>
          <strong>Vimexx</strong> (Nederland) – onze domeinnaam en e-mail, ook het versturen van je schema&apos;s,
          inloglinks en bevestigingen (verwerker).
        </li>
        <li>
          <strong>Junction</strong> (Vital Technologies Inc., VS) – alleen als je een gezondheidsapp koppelt: het ophalen
          van je gegevens uit apps en apparaten zoals Apple Health, Health Connect, Garmin en Fitbit, via de EU-dataregio
          van Junction (verwerker).
        </li>
        <li>
          <strong>Withings</strong> (Frankrijk) – alleen als je een Withings-weegschaal of Withings Health Mate koppelt:
          we ontvangen je gegevens dan rechtstreeks van Withings, via de koppeling die je zelf met je Withings-account
          maakt.
        </li>
        <li>
          <strong>Google (Analytics) en Meta</strong> – alleen als je daarvoor toestemming geeft via de cookiebanner.
        </li>
      </ul>
      <p>
        Met verwerkers sluiten we een verwerkersovereenkomst. Worden gegevens doorgegeven naar een land buiten de
        Europese Economische Ruimte (zoals de VS), dan gebeurt dat op basis van het EU-VS Data Privacy Framework of de
        standaardcontractbepalingen van de Europese Commissie, met aanvullende waarborgen waar nodig. We kunnen gegevens
        ook verstrekken als we daartoe wettelijk verplicht zijn.
      </p>

      <h2>7. Hoe lang bewaren we je gegevens?</h2>
      <ul>
        <li>
          <strong>Intake-, gezondheidsgegevens en schema&apos;s:</strong> zolang je klant bent, en daarna nog 12 maanden
          zodat je je schema&apos;s kunt terugzien. Daarna verwijderen we ze. Eerder verwijderen kan op verzoek.
        </li>
        <li>
          <strong>Gegevens uit gekoppelde gezondheidsapps:</strong> net als je andere gezondheidsgegevens zolang je klant
          bent, en daarna nog 12 maanden. Verbreek je een koppeling, dan verwijderen we de gegevens uit die koppeling
          direct.
        </li>
        <li>
          <strong>Ingevulde vragenlijst zonder bestelling:</strong> maximaal 30 dagen.
        </li>
        <li>
          <strong>Factuur- en betaalgegevens:</strong> 7 jaar, vanwege de fiscale bewaarplicht.
        </li>
        <li>
          <strong>Contactberichten:</strong> tot 12 maanden na afhandeling.
        </li>
        <li>
          <strong>Klantenservicenotities:</strong> net als je intakegegevens zolang je klant bent, en daarna nog 12 maanden.
        </li>
        <li>
          <strong>Overzicht van verstuurde e-mails:</strong> 12 maanden.
        </li>
        <li>
          <strong>Websitegebruik (zonder cookies):</strong> 13 maanden.
        </li>
        <li>
          <strong>Nieuwsbrief:</strong> tot je je afmeldt.
        </li>
      </ul>

      <h2>8. Beveiliging</h2>
      <p>
        We nemen passende technische en organisatorische maatregelen, zoals versleutelde verbindingen (HTTPS),
        versleutelde opslag bij onze hostingpartij, inloggen met persoonlijke links waarvan we alleen een versleutelde
        versie (hash) opslaan, versleutelde opslag van de toegangssleutels voor gekoppelde gezondheidsapps, en beperkte
        toegang tot gegevens. Merk je iets dat niet klopt? Meld het via{" "}
        <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>.
      </p>

      <h2>9. Jouw rechten</h2>
      <p>Je hebt het recht om:</p>
      <ul>
        <li>je gegevens in te zien en een kopie te ontvangen;</li>
        <li>onjuiste gegevens te laten corrigeren;</li>
        <li>je gegevens te laten verwijderen (voor zover we ze niet wettelijk moeten bewaren);</li>
        <li>de verwerking te laten beperken of er bezwaar tegen te maken;</li>
        <li>je gegevens over te laten dragen (dataportabiliteit);</li>
        <li>
          je toestemming op elk moment in te trekken. Trek je je toestemming voor het verwerken van gezondheidsgegevens
          in, dan kunnen we geen nieuwe schema&apos;s meer voor je maken. Eerdere verwerkingen blijven rechtmatig. Je
          toestemming voor een koppeling met een gezondheidsapp trek je in door de koppeling te verbreken (zie{" "}
          <a href="#gezondheidsapps">punt 5</a>); je schema&apos;s maken we dan gewoon zonder die gegevens.
        </li>
      </ul>
      <p>
        Stuur je verzoek naar <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>. We reageren binnen een maand.
        Heb je een klacht over hoe we met je gegevens omgaan? Laat het ons weten; je kunt ook een klacht indienen bij de{" "}
        <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
          Autoriteit Persoonsgegevens
        </a>
        .
      </p>

      <h2>10. Minderjarigen</h2>
      <p>Onze dienst is alleen bedoeld voor personen van 18 jaar en ouder.</p>

      <h2>11. Wijzigingen</h2>
      <p>
        We kunnen dit privacybeleid aanpassen. De meest actuele versie staat altijd op deze pagina. Bij belangrijke
        wijzigingen informeren we je per e-mail.
      </p>
    </>
  );
}

function En() {
  const c = site.company;
  return (
    <>
      <h2>1. Who is responsible?</h2>
      <p>
        {c.legalName} ({site.name}), {companyAddressLine()}, Chamber of Commerce (KvK) no. {c.kvk}, is the controller
        within the meaning of the General Data Protection Regulation (GDPR). Questions about privacy? Email{" "}
        <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>.
      </p>

      <h2>2. What data do we process?</h2>
      <ul>
        <li>
          <strong>Contact details:</strong> your first name and email address.
        </li>
        <li>
          <strong>Intake data:</strong> your answers in the questionnaire, such as your goal, sex, age, height, weight,
          target weight, activity level, eating pattern, allergies and preferences, where you train, experience and
          injuries.
        </li>
        <li>
          <strong>Health data (special categories of personal data):</strong> weight and height, any pregnancy, eating
          disorder, medical conditions, medication, injuries, your check-ins and your weekly weigh-ins.
        </li>
        <li>
          <strong>Data from connected health apps (optional):</strong> only if you connect an app or device: your daily
          step count, active calories and active minutes, your workouts (type of sport, start time, duration and
          calories) and your body weight. This is also health data. See <a href="#gezondheidsapps">section 5</a>.
        </li>
        <li>
          <strong>Order and payment details:</strong> what you have ordered, amounts, the status of your subscription
          and (via Stripe) your payment method and billing details. We do not receive full bank account or credit card
          numbers. If you came to us through an advert, we also store the campaign details from the link (such as the
          source and campaign name) and the landing page with your order.
        </li>
        <li>
          <strong>Your plans:</strong> the nutrition and workout plans we create for you.
        </li>
        <li>
          <strong>Technical data:</strong> data needed to keep the website running securely (such as server logs) and,
          only with your consent, analytics and marketing data via cookies.
        </li>
        <li>
          <strong>Website usage (without cookies):</strong> which pages and questionnaire steps a visit views and how long a
          page is open, the type of device (mobile, tablet or computer), the language, the campaign details from the link
          and the website you came from (only its name, e.g. google.com). For this we use a random
          visit number that is only stored in your browser tab (sessionStorage) and disappears when you close the tab. We do
          not store your IP address and do not track you on other websites. If &quot;Do Not Track&quot; or &quot;Global Privacy
          Control&quot; is switched on in your browser, we do not measure anything. If you place an order, we link the
          measurement of that visit to your order.
        </li>
        <li>
          <strong>Messages:</strong> what you send us via the contact form, email, the withdrawal function or a guarantee request.
        </li>
        <li>
          <strong>Customer service:</strong> short notes about contact you have had with us, and an overview of the emails
          we sent you (type, subject and time, not the content), so that we can check whether an email arrived.
        </li>
      </ul>

      <h2>3. For what purposes and on what legal basis?</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Data</th>
            <th>Legal basis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Creating, delivering and adjusting your personal plan</td>
            <td>Contact, intake and health data, check-ins and weigh-ins</td>
            <td>Performance of the contract; for health data, your explicit consent (Art. 9(2)(a) GDPR)</td>
          </tr>
          <tr>
            <td>Safety check (e.g. pregnancy, eating disorder, underweight)</td>
            <td>Health data</td>
            <td>Explicit consent</td>
          </tr>
          <tr>
            <td>
              Adjusting your calorie target to your actual activity, showing your workouts and progress, pre-filling your
              weekly weigh-in and check-in, and adjusting your next plan (only if you connect a health app)
            </td>
            <td>Data from connected health apps</td>
            <td>Explicit consent (Art. 9(2)(a) GDPR), which you can withdraw by disconnecting the app</td>
          </tr>
          <tr>
            <td>Payments, invoices and subscription management</td>
            <td>Contact, order and payment details</td>
            <td>Performance of the contract; statutory (tax) retention obligation</td>
          </tr>
          <tr>
            <td>Logging in and My plans</td>
            <td>Email address, session cookie</td>
            <td>Performance of the contract</td>
          </tr>
          <tr>
            <td>Customer service, complaints, withdrawals and guarantee requests</td>
            <td>Contact details, messages, notes, overview of emails sent</td>
            <td>Performance of the contract; legal obligation</td>
          </tr>
          <tr>
            <td>Newsletter with tips and offers</td>
            <td>First name, email address</td>
            <td>Consent (can be withdrawn at any time)</td>
          </tr>
          <tr>
            <td>One reminder if you fill in the questionnaire but don&apos;t complete the payment, with a link that has your answers ready</td>
            <td>First name, email address, your questionnaire answers</td>
            <td>Consent to email (the same as for the newsletter); without that consent we send nothing</td>
          </tr>
          <tr>
            <td>Improving the website and measuring adverts</td>
            <td>Cookie data</td>
            <td>
              Consent via the cookie banner (see <Link href="/cookiebeleid">cookie policy</Link>)
            </td>
          </tr>
          <tr>
            <td>Measuring which campaigns lead to orders</td>
            <td>Campaign details from the link, stored with your order (no cookies)</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Improving the website and questionnaire (e.g. seeing at which question visitors drop off)</td>
            <td>Website usage without cookies (see section 2)</td>
            <td>Legitimate interest; you can object via &quot;Do Not Track&quot; or &quot;Global Privacy Control&quot;</td>
          </tr>
          <tr>
            <td>Security and preventing misuse</td>
            <td>Technical data</td>
            <td>Legitimate interest</td>
          </tr>
        </tbody>
      </table>

      <h2>4. How is your plan put together?</h2>
      <p>
        To put your plan together, we use software from Anthropic (the language model Claude). For this, we send your
        first name, your intake answers (including the relevant health data), your calculated daily targets and, where
        applicable, your check-in and the data from connected health apps (see <a href="#gezondheidsapps">section 5</a>)
        to Anthropic. We do not send your email address or payment details. Anthropic processes this data as a processor
        on our behalf and, under its commercial terms, does not use it to train its models.
      </p>
      <p>
        Based on your answers, our system automatically decides whether we can create a plan (for example, not in the
        case of pregnancy or underweight). Do you disagree with such an outcome? Then please get in touch with us; a
        person will then review your situation again.
      </p>

      <h2 id="gezondheidsapps">5. Connections with health apps</h2>
      <p>
        You can connect a health app or device, such as a smart scale or sports watch, to your account. This is
        completely optional. We only receive data if you connect an app yourself under My plans → My details and tick a
        separate box to give your explicit consent to the processing of this health data (Art. 9(2)(a) GDPR). You can
        withdraw your consent at any time by disconnecting the app in the same place.
      </p>
      <h3>What data do we receive?</h3>
      <ul>
        <li>your daily step count, active calories and active minutes;</li>
        <li>your workouts: type of sport, start time, duration and calories;</li>
        <li>your body weight, for example from a smart scale.</li>
      </ul>
      <p>
        We do not receive or store your heart rate, sleep, location or GPS routes, menstrual data or any other health
        data, even if the app holds it.
      </p>
      <h3>What do we use it for?</h3>
      <ul>
        <li>to adjust your calorie target to how active you actually are;</li>
        <li>to show whether and how much you train (training adherence) and what it yields in your progress charts;</li>
        <li>to pre-fill your weekly weigh-in and your check-in for you;</li>
        <li>
          as context when we create your next plan. We then process this data in the same way as your check-in,
          including via Anthropic (see section 4).
        </li>
      </ul>
      <h3>How does the connection work?</h3>
      <ul>
        <li>
          <strong>Withings</strong> (smart scales and the Withings Health Mate app): you connect directly via
          Withings&apos; own login page. Withings is a French company.
        </li>
        <li>
          <strong>Other apps and devices</strong>, such as Apple Health (iPhone), Health Connect (Android), Garmin,
          Fitbit/Google, Oura, Polar, Samsung Health and others: we connect these via the health data platform Junction
          (Vital Technologies Inc., US), which acts as a processor on our behalf. We use Junction&apos;s EU data region.
          Transfers to the US are based on the EU-US Data Privacy Framework and/or the European Commission&apos;s
          standard contractual clauses.
        </li>
        <li>
          <strong>Apple Health:</strong> data from Apple Health can only be read on the iPhone itself. That is why you
          install Junction&apos;s companion app on your iPhone and enter a one-time pairing code in it that you see on
          our website.
        </li>
      </ul>
      <h3>Security, disconnecting and retention</h3>
      <p>
        We store the access tokens for your connections in encrypted form. If you disconnect an app, we immediately stop
        collecting data and immediately delete the health data we received through that connection. Otherwise, we keep
        this data for as long as the other data in your account (see section 7).
      </p>

      <h2>6. Who do we share data with?</h2>
      <p>We never sell your data. We only share it with parties we need in order to provide our service:</p>
      <ul>
        <li>
          <strong>Anthropic</strong> (US) – software for putting your plan together (processor).
        </li>
        <li>
          <strong>Stripe</strong> (Ireland/US) – payments, subscriptions and invoices. Stripe is itself responsible
          (controller) for part of the processing; see Stripe&apos;s privacy policy.
        </li>
        <li>
          <strong>Vercel</strong> (US) – hosting the website; the website runs in a data centre in Frankfurt
          (processor).
        </li>
        <li>
          <strong>Neon</strong> (US) – the database in which your data is stored encrypted, in a data centre in
          Frankfurt (processor).
        </li>
        <li>
          <strong>Vimexx</strong> (Netherlands) – our domain name and email, including sending your plans, login links
          and confirmations (processor).
        </li>
        <li>
          <strong>Junction</strong> (Vital Technologies Inc., US) – only if you connect a health app: collecting your
          data from apps and devices such as Apple Health, Health Connect, Garmin and Fitbit, via Junction&apos;s EU data
          region (processor).
        </li>
        <li>
          <strong>Withings</strong> (France) – only if you connect a Withings scale or Withings Health Mate: we then
          receive your data directly from Withings, via the connection you set up yourself with your Withings account.
        </li>
        <li>
          <strong>Google (Analytics) and Meta</strong> – only if you give your consent via the cookie banner.
        </li>
      </ul>
      <p>
        We conclude a data processing agreement with our processors. If data is transferred to a country outside the
        European Economic Area (such as the US), this is done on the basis of the EU-US Data Privacy Framework or the
        European Commission&apos;s standard contractual clauses, with additional safeguards where necessary. We may also
        disclose data if we are legally required to do so.
      </p>

      <h2>7. How long do we keep your data?</h2>
      <ul>
        <li>
          <strong>Intake data, health data and plans:</strong> for as long as you are a customer, and for 12 months after
          that so that you can look back at your plans. After that, we delete them. Earlier deletion is possible on
          request.
        </li>
        <li>
          <strong>Data from connected health apps:</strong> like your other health data, for as long as you are a
          customer and for 12 months after that. If you disconnect an app, we immediately delete the data from that
          connection.
        </li>
        <li>
          <strong>Completed questionnaire without an order:</strong> up to 30 days.
        </li>
        <li>
          <strong>Invoice and payment details:</strong> 7 years, due to the statutory tax retention obligation.
        </li>
        <li>
          <strong>Contact messages:</strong> up to 12 months after they have been dealt with.
        </li>
        <li>
          <strong>Customer service notes:</strong> like your intake data, for as long as you are a customer and for 12 months
          after that.
        </li>
        <li>
          <strong>Overview of emails sent:</strong> 12 months.
        </li>
        <li>
          <strong>Website usage (without cookies):</strong> 13 months.
        </li>
        <li>
          <strong>Newsletter:</strong> until you unsubscribe.
        </li>
      </ul>

      <h2>8. Security</h2>
      <p>
        We take appropriate technical and organisational measures, such as encrypted connections (HTTPS), encrypted
        storage with our hosting provider, logging in with personal links of which we only store an encrypted version
        (hash), encrypted storage of the access tokens for connected health apps, and restricted access to data. Notice
        something that isn&apos;t right? Report it via <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>.
      </p>

      <h2>9. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>access your data and receive a copy;</li>
        <li>have incorrect data corrected;</li>
        <li>have your data erased (insofar as we are not legally required to keep it);</li>
        <li>have the processing restricted or object to it;</li>
        <li>have your data transferred (data portability);</li>
        <li>
          withdraw your consent at any time. If you withdraw your consent to the processing of health data, we can no
          longer create new plans for you. Processing carried out before then remains lawful. You withdraw your consent
          for a health app connection by disconnecting the app (see <a href="#gezondheidsapps">section 5</a>); we will
          then simply create your plans without that data.
        </li>
      </ul>
      <p>
        Send your request to <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>. We will respond within one
        month. Do you have a complaint about how we handle your data? Let us know; you can also lodge a complaint with
        the{" "}
        <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
          Autoriteit Persoonsgegevens
        </a>{" "}
        (the Dutch Data Protection Authority).
      </p>

      <h2>10. Minors</h2>
      <p>Our service is intended only for people aged 18 and over.</p>

      <h2>11. Changes</h2>
      <p>
        We may amend this privacy policy. The most recent version can always be found on this page. We will inform you
        by email of any important changes.
      </p>
    </>
  );
}
