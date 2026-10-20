import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { companyAddressLine, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: `De algemene voorwaarden van ${site.name} voor voedingsschema's, trainingsschema's en abonnementen.`,
  alternates: { canonical: "/algemene-voorwaarden" },
};

export default function AlgemeneVoorwaardenPage() {
  const c = site.company;
  const g = site.guarantee;
  return (
    <LegalPage
      title="Algemene voorwaarden"
      intro={`Deze algemene voorwaarden gelden voor alle aankopen bij ${site.name}. We hebben ze zo duidelijk mogelijk geschreven. Heb je een vraag? Mail ons gerust.`}
    >
      <h2 id="artikel-1">Artikel 1 – Definities</h2>
      <ul>
        <li>
          <strong>Wij / ondernemer:</strong> {c.legalName}, handelend onder de naam {site.name}.
        </li>
        <li>
          <strong>Jij / klant:</strong> de natuurlijke persoon die niet handelt in de uitoefening van beroep of bedrijf
          (consument) en een overeenkomst met ons sluit.
        </li>
        <li>
          <strong>Schema:</strong> een persoonlijk voedingsschema en/of trainingsschema in digitale vorm, gemaakt op basis
          van de antwoorden in de vragenlijst.
        </li>
        <li>
          <strong>Abonnement:</strong> een overeenkomst waarbij je gedurende een bepaalde periode periodiek (elke 4 weken)
          een nieuw schema ontvangt.
        </li>
        <li>
          <strong>Los schema:</strong> een eenmalige aankoop van één schema voor 4 weken, zonder abonnement.
        </li>
        <li>
          <strong>Herroepingstermijn:</strong> de termijn waarbinnen je gebruik kunt maken van je herroepingsrecht.
        </li>
        <li>
          <strong>Duurzame gegevensdrager:</strong> elk middel waarmee informatie zo kan worden opgeslagen dat je die later
          ongewijzigd kunt raadplegen, zoals e-mail.
        </li>
      </ul>

      <h2 id="artikel-2">Artikel 2 – Identiteit van de ondernemer</h2>
      <p>
        {c.legalName}
        <br />
        {companyAddressLine()}, {c.country}
        <br />
        E-mail: <a href={`mailto:${c.email}`}>{c.email}</a>
        <br />
        KvK-nummer: {c.kvk}
        <br />
        Btw-identificatienummer: {c.vat}
      </p>

      <h2 id="artikel-3">Artikel 3 – Toepasselijkheid</h2>
      <p>
        Deze voorwaarden zijn van toepassing op elk aanbod van ons en op elke overeenkomst die via de website{" "}
        {site.domain} tot stand komt. Voordat de overeenkomst wordt gesloten, stellen we deze voorwaarden aan je
        beschikbaar. Je kunt ze opslaan en printen. Je ontvangt ze bovendien bij de bevestiging van je bestelling.
      </p>

      <h2 id="artikel-4">Artikel 4 – Het aanbod</h2>
      <ol>
        <li>
          Het aanbod bevat een volledige en nauwkeurige omschrijving van de schema&apos;s, de looptijden en de prijzen.
          Kennelijke vergissingen of fouten in het aanbod binden ons niet.
        </li>
        <li>
          Afbeeldingen op de website zijn sfeerbeelden (stockfoto&apos;s) en geven niet de exacte inhoud van je schema weer.
        </li>
        <li>
          Een voorbeeldschema op de website is een voorbeeld voor een fictieve persoon. Jouw schema wordt op jouw gegevens
          afgestemd en kan daardoor anders zijn.
        </li>
      </ol>

      <h2 id="artikel-5">Artikel 5 – De overeenkomst</h2>
      <ol>
        <li>
          De overeenkomst komt tot stand op het moment dat je de bestelling afrondt en de betaling is gelukt of, bij een
          abonnement, de SEPA-machtiging is afgegeven. We bevestigen de bestelling zo snel mogelijk per e-mail.
        </li>
        <li>Je moet minimaal 18 jaar oud zijn om een overeenkomst met ons te sluiten.</li>
        <li>
          Je bent ervoor verantwoordelijk dat de gegevens die je in de vragenlijst invult juist en volledig zijn. Je schema
          is gebaseerd op deze gegevens.
        </li>
        <li>
          We mogen een bestelling weigeren of een overeenkomst niet uitvoeren als er gegronde redenen zijn, bijvoorbeeld
          als een schema op basis van je antwoorden niet verantwoord is (zoals bij zwangerschap, een eetstoornis of
          ondergewicht). Je hebt dan recht op terugbetaling van wat je al betaald hebt.
        </li>
      </ol>

      <h2 id="artikel-6">Artikel 6 – De schema&apos;s en levering</h2>
      <ol>
        <li>
          Een schema wordt automatisch samengesteld door onze software, op basis van jouw antwoorden, onze berekeningen,
          instructies en kwaliteitscontroles. We doen ons best om een zorgvuldig en passend schema te maken
          (inspanningsverplichting).
        </li>
        <li>
          We streven ernaar je schema binnen enkele minuten na de betaling te leveren, en in elk geval binnen 2 werkdagen.
          Levering vindt plaats via je persoonlijke omgeving &quot;Mijn schema&apos;s&quot; en een e-mail met een link.
        </li>
        <li>
          Bij een abonnement ontvang je elke 4 weken een nieuw schema, zolang het abonnement loopt. Je kunt via een
          check-in je voortgang doorgeven; het volgende schema wordt daarop afgestemd.
        </li>
        <li>
          Een schema is leefstijladvies en geen medisch advies, geen diagnose en geen behandeling. Zie ook artikel 12 en
          onze <Link href="/disclaimer">disclaimer</Link>.
        </li>
        <li>
          We geven geen garantie op een bepaald resultaat, zoals een bepaald aantal kilo&apos;s gewichtsverlies.
          Resultaten verschillen per persoon en hangen onder meer af van hoe je het schema volgt.
        </li>
      </ol>

      <h2 id="artikel-7">Artikel 7 – Herroepingsrecht</h2>
      <ol>
        <li>
          Je kunt een overeenkomst op afstand in principe binnen 14 dagen na het sluiten ervan zonder opgave van redenen
          herroepen (ontbinden).
        </li>
        <li>
          <strong>Uitzondering voor digitale inhoud.</strong> Een schema is digitale inhoud die niet op een materiële
          drager wordt geleverd. Bij het bestellen vragen we je uitdrukkelijke toestemming om direct na de betaling met
          de levering te beginnen, en verklaar je dat je weet dat je daardoor je herroepingsrecht verliest. Je
          herroepingsrecht vervalt zodra we met de levering zijn begonnen (artikel 6:230p onder g Burgerlijk Wetboek).
          We bevestigen je toestemming in de orderbevestiging.
        </li>
        <li>
          Voor zover het herroepingsrecht nog van toepassing is (bijvoorbeeld als de levering nog niet is begonnen), kun je
          herroepen via de <Link href="/herroepen">herroepingsfunctie op onze website</Link>, met het
          modelformulier hieronder of met een andere ondubbelzinnige verklaring per e-mail of post. We sturen je direct
          een ontvangstbevestiging op een duurzame gegevensdrager.
        </li>
        <li>
          Na een geldige herroeping betalen we alle betalingen binnen 14 dagen terug, via dezelfde betaalmethode die je
          hebt gebruikt, tenzij je uitdrukkelijk met een andere methode instemt. Je betaalt hiervoor geen kosten.
        </li>
        <li>
          Los van het herroepingsrecht kun je een abonnement altijd opzeggen volgens artikel 9
          {g.enabled ? " en geldt de tevredenheidsgarantie uit artikel 10" : ""}.
        </li>
      </ol>

      <h2 id="artikel-8">Artikel 8 – Prijzen en betaling</h2>
      <ol>
        <li>Alle prijzen zijn in euro&apos;s en inclusief 21% btw. Er zijn geen bijkomende kosten.</li>
        <li>
          Een abonnement betaal je per maand, vooraf. De eerste maand betaal je bij het bestellen via onze betaalpartner
          Stripe met iDEAL | Wero, Bancontact of je IBAN. Daarmee geef je een SEPA-machtiging voor doorlopende
          incasso: de volgende maanden schrijven we het maandbedrag automatisch af van je rekening, rond dezelfde datum als
          je eerste betaling. Op je bankafschrift staat de afschrijving van Stripe.
        </li>
        <li>
          De hoogte van het maandbedrag hangt af van de minimale looptijd die je kiest. Het maandbedrag en de datum van
          afschrijving staan in je orderbevestiging; die geldt als vooraankondiging van de maandelijkse incasso. Verandert
          het bedrag, dan laten we je dat minimaal 14 dagen vooraf weten.
        </li>
        <li>
          Je kunt een afschrijving binnen 8 weken via je bank laten terugboeken. Daarmee is het abonnement niet opgezegd
          en blijft het bedrag verschuldigd; wil je stoppen, zeg dan op volgens artikel 9.
        </li>
        <li>Een los schema betaal je eenmalig vooraf, met iDEAL | Wero, Bancontact, creditcard of een andere aangeboden methode.</li>
        <li>
          Lukt een afschrijving niet, dan proberen we het opnieuw en ontvang je een bericht. Blijft betaling uit, dan mogen we
          de levering van nieuwe schema&apos;s opschorten tot de betaling binnen is.
        </li>
        <li>
          Een actiekorting (zoals een lanceringsactie) geldt alleen voor de periode en voorwaarden die bij de actie staan
          vermeld, meestal alleen voor de eerste maand.
        </li>
        <li>
          We kunnen de prijzen van een abonnement wijzigen. Een prijsverhoging maken we minimaal 30 dagen van tevoren
          bekend. Je mag het abonnement dan kosteloos opzeggen tegen de datum waarop de verhoging ingaat. Een
          prijsverhoging binnen 3 maanden na het sluiten van de overeenkomst geven we niet door, tenzij de wet dat
          toestaat.
        </li>
      </ol>

      <h2 id="artikel-9">Artikel 9 – Duur, verlenging en opzegging van abonnementen</h2>
      <ol>
        <li>
          Je kiest bij het bestellen een abonnement per maand, of een abonnement met een minimale looptijd van 3, 6 of 12
          maanden tegen een lagere maandprijs. Ook dan betaal je per maand.
        </li>
        <li>
          Na de minimale looptijd loopt het abonnement automatisch door voor onbepaalde tijd, tegen dezelfde maandprijs.
          Je kunt het dan op elk moment opzeggen met een opzegtermijn van maximaal één maand.
        </li>
        <li>
          Een maandabonnement kun je op elk moment opzeggen tegen het einde van de lopende maand. Zeg je een abonnement met
          een minimale looptijd binnen die looptijd op, dan loopt het nog door (en betaal je de resterende maanden) tot het
          einde van de minimale looptijd, en stopt het daarna.
        </li>
        <li>
          Opzeggen doe je online, op dezelfde eenvoudige manier als waarop je het abonnement hebt afgesloten: via &quot;Mijn
          schema&apos;s&quot; of via de pagina <Link href="/abonnement-opzeggen">abonnement opzeggen</Link>. Je kunt ook
          opzeggen per e-mail. We bevestigen de opzegging en de einddatum per e-mail. Na de einddatum schrijven we niets
          meer af.
        </li>
        <li>Na het einde van het abonnement houd je toegang tot de schema&apos;s die je al hebt ontvangen.</li>
        <li>
          We kunnen een abonnement met een opzegtermijn van minimaal één maand beëindigen, bijvoorbeeld als we de dienst
          stoppen. Wat je al betaalde voor de periode na de beëindiging, betalen we terug.
        </li>
      </ol>

      {g.enabled && (
        <>
          <h2 id="garantie">Artikel 10 – Tevredenheidsgarantie</h2>
          <ol>
            <li>
              Ben je niet tevreden, dan kun je binnen {g.days} dagen na je eerste aankoop per e-mail aan{" "}
              <a href={`mailto:${c.email}`}>{c.email}</a> om terugbetaling vragen. We betalen dan het volledige bedrag van
              je eerste betaling terug en beëindigen het abonnement direct.
            </li>
            <li>
              De garantie geldt één keer per klant en alleen voor de eerste betaling, niet voor latere termijnen of
              verlengingen.
            </li>
            <li>Deze garantie komt bovenop je wettelijke rechten en beperkt die niet.</li>
          </ol>
        </>
      )}

      <h2 id="artikel-11">Artikel {g.enabled ? 11 : 10} – Gebruik en intellectueel eigendom</h2>
      <ol>
        <li>Je schema is uitsluitend bestemd voor persoonlijk, niet-commercieel gebruik.</li>
        <li>
          Het is niet toegestaan om schema&apos;s, teksten of andere inhoud van de website te verkopen, openbaar te maken of
          op grote schaal te verspreiden zonder onze schriftelijke toestemming.
        </li>
        <li>Je persoonlijke inloglink is vertrouwelijk; deel deze niet met anderen.</li>
      </ol>

      <h2 id="artikel-12">Artikel {g.enabled ? 12 : 11} – Gezondheid en eigen verantwoordelijkheid</h2>
      <ol>
        <li>
          Raadpleeg een arts voordat je met een nieuw voedings- of trainingsschema begint als je een medische aandoening
          hebt, medicijnen gebruikt, ouder bent dan 65, of twijfelt of het voor jou verantwoord is.
        </li>
        <li>
          Stop met trainen en raadpleeg een arts of fysiotherapeut als je tijdens het trainen pijn, duizeligheid,
          benauwdheid of andere klachten krijgt.
        </li>
        <li>
          Heb je een allergie of intolerantie? Controleer dan altijd zelf de etiketten van de producten die je gebruikt;
          samenstellingen van producten kunnen wijzigen.
        </li>
        <li>
          Het opvolgen van een schema gebeurt op eigen verantwoordelijkheid, binnen de grenzen van wat redelijk is en
          met inachtneming van artikel {g.enabled ? 13 : 12}.
        </li>
      </ol>

      <h2 id="artikel-13">Artikel {g.enabled ? 13 : 12} – Aansprakelijkheid</h2>
      <ol>
        <li>
          Onze aansprakelijkheid is beperkt tot het bedrag dat je in de 12 maanden voorafgaand aan de schadeveroorzakende
          gebeurtenis aan ons hebt betaald.
        </li>
        <li>
          We zijn niet aansprakelijk voor schade die ontstaat doordat je onjuiste of onvolledige gegevens hebt ingevuld,
          of doordat je de adviezen uit artikel {g.enabled ? 12 : 11} niet opvolgt.
        </li>
        <li>
          Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van ons, en laten je dwingende wettelijke rechten
          als consument onverlet.
        </li>
      </ol>

      <h2 id="artikel-14">Artikel {g.enabled ? 14 : 13} – Conformiteit</h2>
      <p>
        We staan ervoor in dat de schema&apos;s voldoen aan de overeenkomst, de omschrijving op de website en de redelijke
        verwachtingen. Voldoet een schema niet (bijvoorbeeld omdat het een product bevat dat je als allergie hebt
        opgegeven), meld het ons dan. We maken dan kosteloos een aangepast schema. Lukt dat niet, dan heb je recht op een
        passende prijsvermindering of ontbinding, conform de wet.
      </p>

      <h2 id="artikel-15">Artikel {g.enabled ? 15 : 14} – Klachten</h2>
      <ol>
        <li>
          Heb je een klacht? Stuur die zo snel mogelijk, volledig en duidelijk omschreven naar{" "}
          <a href={`mailto:${c.email}`}>{c.email}</a>.
        </li>
        <li>
          We bevestigen je klacht binnen {site.responseTimeDays} werkdagen en geven binnen 14 dagen inhoudelijk antwoord.
          Hebben we meer tijd nodig, dan laten we je dat weten met een indicatie van wanneer je antwoord krijgt.
        </li>
        <li>
          Komen we er samen niet uit, dan kun je het geschil voorleggen aan de bevoegde rechter. Als consument kun je ook
          kiezen voor de rechter van je eigen woonplaats.
        </li>
      </ol>

      <h2 id="artikel-16">Artikel {g.enabled ? 16 : 15} – Persoonsgegevens</h2>
      <p>
        We verwerken je persoonsgegevens, waaronder gezondheidsgegevens, zorgvuldig en alleen met jouw uitdrukkelijke
        toestemming. Lees hierover meer in ons <Link href="/privacybeleid">privacybeleid</Link>.
      </p>

      <h2 id="artikel-17">Artikel {g.enabled ? 17 : 16} – Wijzigingen en toepasselijk recht</h2>
      <ol>
        <li>
          We mogen deze voorwaarden wijzigen. Wijzigingen die nadelig voor je zijn, maken we minimaal 30 dagen vooraf
          bekend; je mag een abonnement dan kosteloos opzeggen tegen de ingangsdatum.
        </li>
        <li>Op alle overeenkomsten is Nederlands recht van toepassing.</li>
      </ol>

      <h2 id="modelformulier">Bijlage – Modelformulier voor herroeping</h2>
      <p>
        Vul dit formulier alleen in en stuur het terug als je de overeenkomst wilt herroepen. Online herroepen kan
        sneller via de <Link href="/herroepen">herroepingsfunctie</Link>.
      </p>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p>
          Aan: {c.legalName}, {companyAddressLine()}, {c.email}
        </p>
        <p>
          Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de levering van de
          volgende digitale inhoud/dienst (*) herroep/herroepen (*):
        </p>
        <p>
          ______________________________________________
          <br />
          Besteld op (*) / ontvangen op (*): ____________________
          <br />
          Naam/Namen consument(en): ____________________
          <br />
          Adres consument(en): ____________________
          <br />
          Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend): ____________________
          <br />
          Datum: ____________________
        </p>
        <p className="text-sm text-muted">(*) Doorhalen wat niet van toepassing is.</p>
      </div>
    </LegalPage>
  );
}
