import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { companyAddressLine, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: `Hoe ${site.name} omgaat met je persoonsgegevens en gezondheidsgegevens.`,
  alternates: { canonical: "/privacybeleid" },
};

export default function PrivacyPage() {
  const c = site.company;
  return (
    <LegalPage
      title="Privacybeleid"
      intro="Om een persoonlijk schema voor je te maken, hebben we gegevens over jou nodig, waaronder gezondheidsgegevens. Daar gaan we zorgvuldig mee om. In dit privacybeleid lees je welke gegevens we verwerken, waarom, hoe lang en welke rechten je hebt."
    >
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
          <strong>Bestel- en betaalgegevens:</strong> wat je hebt besteld, bedragen, status van je abonnement en (via
          Stripe) je betaalmethode en factuurgegevens. Wij ontvangen geen volledige bank- of creditcardnummers.
        </li>
        <li>
          <strong>Je schema&apos;s:</strong> de voedings- en trainingsschema&apos;s die we voor je maken.
        </li>
        <li>
          <strong>Technische gegevens:</strong> gegevens die nodig zijn om de website veilig te laten werken (zoals
          serverlogs) en, alleen met je toestemming, analytische en marketinggegevens via cookies.
        </li>
        <li>
          <strong>Berichten:</strong> wat je ons stuurt via het contactformulier, e-mail of de herroepingsfunctie.
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
            <td>Klantenservice, klachten en herroepingen</td>
            <td>Contactgegevens, berichten</td>
            <td>Uitvoering van de overeenkomst; wettelijke verplichting</td>
          </tr>
          <tr>
            <td>Nieuwsbrief met tips en aanbiedingen</td>
            <td>Voornaam, e-mailadres</td>
            <td>Toestemming (altijd in te trekken)</td>
          </tr>
          <tr>
            <td>Website verbeteren en advertenties meten</td>
            <td>Cookiegegevens</td>
            <td>
              Toestemming via de cookiebanner (zie <Link href="/cookiebeleid">cookiebeleid</Link>)
            </td>
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
        eventueel je check-in naar Anthropic. Je e-mailadres en betaalgegevens sturen we niet mee. Anthropic verwerkt
        deze gegevens als verwerker in onze opdracht en gebruikt ze volgens haar zakelijke voorwaarden niet om haar
        modellen te trainen.
      </p>
      <p>
        Op basis van je antwoorden beslist ons systeem automatisch of we een schema kunnen maken (bijvoorbeeld niet bij
        zwangerschap of ondergewicht). Ben je het niet eens met zo&apos;n uitkomst? Neem dan contact met ons op; een
        mens bekijkt je situatie dan opnieuw.
      </p>

      <h2>5. Met wie delen we gegevens?</h2>
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
          <strong>Hosting- en databasepartij</strong> – het hosten van de website en het veilig opslaan van gegevens,
          waar mogelijk binnen de EU (verwerker).
        </li>
        <li>
          <strong>E-maildienst</strong> – het versturen van je schema&apos;s, inloglinks en bevestigingen (verwerker).
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

      <h2>6. Hoe lang bewaren we je gegevens?</h2>
      <ul>
        <li>
          <strong>Intake-, gezondheidsgegevens en schema&apos;s:</strong> zolang je klant bent, en daarna nog 12 maanden
          zodat je je schema&apos;s kunt terugzien. Daarna verwijderen we ze. Eerder verwijderen kan op verzoek.
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
          <strong>Nieuwsbrief:</strong> tot je je afmeldt.
        </li>
      </ul>

      <h2>7. Beveiliging</h2>
      <p>
        We nemen passende technische en organisatorische maatregelen, zoals versleutelde verbindingen (HTTPS),
        versleutelde opslag bij onze hostingpartij, inloggen met persoonlijke links waarvan we alleen een versleutelde
        versie (hash) opslaan, en beperkte toegang tot gegevens. Merk je iets dat niet klopt? Meld het via{" "}
        <a href={`mailto:${c.privacyEmail}`}>{c.privacyEmail}</a>.
      </p>

      <h2>8. Jouw rechten</h2>
      <p>Je hebt het recht om:</p>
      <ul>
        <li>je gegevens in te zien en een kopie te ontvangen;</li>
        <li>onjuiste gegevens te laten corrigeren;</li>
        <li>je gegevens te laten verwijderen (voor zover we ze niet wettelijk moeten bewaren);</li>
        <li>de verwerking te laten beperken of er bezwaar tegen te maken;</li>
        <li>je gegevens over te laten dragen (dataportabiliteit);</li>
        <li>
          je toestemming op elk moment in te trekken. Trek je je toestemming voor het verwerken van gezondheidsgegevens
          in, dan kunnen we geen nieuwe schema&apos;s meer voor je maken. Eerdere verwerkingen blijven rechtmatig.
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

      <h2>9. Minderjarigen</h2>
      <p>Onze dienst is alleen bedoeld voor personen van 18 jaar en ouder.</p>

      <h2>10. Wijzigingen</h2>
      <p>
        We kunnen dit privacybeleid aanpassen. De meest actuele versie staat altijd op deze pagina. Bij belangrijke
        wijzigingen informeren we je per e-mail.
      </p>
    </LegalPage>
  );
}
