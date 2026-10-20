# Afvallen & Afblijven

Website voor het verkopen van persoonlijke **voedingsschema's**, **trainingsschema's** en een **bundel**, los of als abonnement. Abonnementen worden maandelijks afgeschreven via SEPA-incasso, met een minimale looptijd van 1, 3, 6 of 12 maanden. De schema's worden na betaling automatisch gemaakt met **Claude** (Anthropic) en binnen enkele minuten geleverd.

## Wat zit erin

**Verkoop en conversie**
- Homepage, productpagina's (voeding, training, bundel), prijzen, hoe het werkt, voorbeeldschema (inclusief een voorbeeld van Mijn schema's), over ons en contact met veelgestelde vragen.
- Vragenlijst in stappen (`/start`). De bezoeker ziet direct een persoonlijk resultaat: calorie- en macrodoel en een prognose met streefdatum. Daarna volgen de plankeuze en de betaling.
- Prijstabel met looptijd-schakelaar (vanaf € 8,95 per maand), kortingslabels, "Meest gekozen"-bundel en een losse aankoop als alternatief.
- Lanceringsactie (automatische korting op de eerste maand, alleen binnen de ingestelde data).
- Tevredenheidsgarantie (aan/uit te zetten).
- Vaste startknop onderin op mobiel.
- Conversiemeting voor GA4 en Meta Pixel, pas na cookietoestemming.

**Na de betaling**
- De Stripe-webhook legt de bestelling vast en verstuurt een orderbevestiging.
- Claude maakt het schema. Het systeem controleert het automatisch op calorieën, eiwit en het aantal maaltijden; voldoet het niet, dan wordt het één keer opnieuw gemaakt.
- De bedankpagina laat live zien wanneer het schema klaar is. De klant krijgt ook een e-mail met een inloglink.
- "Mijn schema's" (inloggen zonder wachtwoord) met tabbladen: **Overzicht**, **Schema's**, **Voortgang**, **Check-in**, **Mijn gegevens** en **Abonnement**. Elk tabblad heeft een eigen adres (`/account/voortgang` enz.).
  - Voortgang: grafiek van je gewicht (start uit de vragenlijst plus elke check-in) naast het verwachte verloop en je streefgewicht, een voortgangsbalk, taille-omtrek, BMI-schaal, je caloriedoel per periode en een overzicht van je check-in-antwoorden per periode.
  - Mijn gegevens: je antwoorden uit de vragenlijst (bijgewerkt met je check-ins), je energiebehoefte en de verdeling van eiwit, koolhydraten en vet.
  - Abonnement: opzeggen of de opzegging intrekken, en betaalgegevens en facturen inzien via het Stripe-portaal.
- Overzichtelijke schema's met tabbladen. Voeding: weekmenu in één oogopslag, recepten per dag (inklapbaar), boodschappenlijst om af te vinken en tips. Training: weekoverzicht, per training een compacte oefeningenlijst, opbouw in 4 weken en herstel.
- Alles als PDF: elk schema, alleen de boodschappenlijst, of alle schema's van een periode in één bestand. Het trainingsschema bevat een logboek om gewichten bij te houden. De PDF's worden op de server gemaakt (`src/lib/pdf/`), in het lettertype van de site.
- **Verplichte check-in**: elke periode duurt 4 weken. Drie dagen voor het einde opent de check-in en krijgt de klant een uitnodiging, met herinneringen na 3, 7 en 14 dagen (`checkin` in `src/config/site.ts`). Pas na de check-in maakt Claude het nieuwe schema, op basis van de antwoorden: gewicht en taille, hoe goed het schema lukte, honger, energie, slaap, wat de klant lekker vond, hoe zwaar de trainingen waren, aantal trainingsdagen en nieuwe klachten. Het caloriedoel wordt in stappen van 100 kcal bijgesteld als het gewicht anders verloopt dan gepland (maximaal 300 kcal in totaal). Bovenaan elk vervolgschema staat wat er is aangepast en waarom.
- **Wekelijks weegmoment** (rond dag 7, 14 en 21 van elke periode, ook bij een los schema): gewicht en een paar korte vragen. Vaste regels beslissen of het lopende schema wordt bijgestuurd: ±100 kcal per dag als het gewicht anders verloopt dan gepland (pas na ongeveer 2 weken, of meteen bij veel honger en weinig energie), en zwaarder, lichter of eenvoudiger trainen. Claude zet dat om in concrete aanpassingen binnen het bestaande schema (met een vaste tekst als terugval). De bijsturing staat bovenaan het schema en in de PDF, en telt mee in het volgende schema. Herinnering per e-mail (uit te zetten door de klant). Logica: `src/lib/weekly.ts`.
- Is het streefgewicht bereikt, dan schakelt het schema automatisch over naar een onderhoudsplan ("afblijven").

**Beheer (`/beheer`)**
- Inloggen met één wachtwoord (`ADMIN_PASSWORD`, minimaal 12 tekens).
- Overzicht: terugkerende omzet per maand, nieuwe bestellingen, conversie van gestarte betalingen, bestellingen per dag en actieve abonnementen per plan.
- Klanten: zoeken, alle antwoorden uit de vragenlijst, check-ins per periode, de status van de volgende check-in, bestellingen en schema's. Acties: inloglink sturen, een nieuwe periode starten zonder check-in (als de klant zijn gegevens anders heeft doorgegeven), abonnement opzeggen namens de klant, klant volledig verwijderen (AVG).
- Bestellingen en schema's met filters. Schema's bekijk je zoals de klant ze ziet, ook als PDF. Je kunt ze opnieuw laten maken en de e-mail opnieuw sturen.
- Herroepingen afhandelen, en een pagina Instellingen die laat zien welke koppelingen werken (met testmail).
- `BEHEER_DEMO=1` toont het beheer met fictieve voorbeelddata en zonder wachtwoord. Alleen voor een demo; zet dit nooit aan op de live site.

**Juridisch (Nederland)**
- Algemene voorwaarden, privacybeleid, cookiebeleid en disclaimer.
- Herroepingsfunctie in twee stappen (`/herroepen`) met ontvangstbevestiging per e-mail. Deze functie is verplicht sinds 19 juni 2026.
- Online opzeggen (`/abonnement-opzeggen`).
- Cookiebanner volgens de richtlijnen van de Autoriteit Persoonsgegevens: weigeren is even makkelijk als accepteren, en scripts laden pas na toestemming.
- Uitdrukkelijke toestemming voor het verwerken van gezondheidsgegevens (art. 9 AVG).
- Instemming met directe levering, waardoor het herroepingsrecht voor digitale inhoud vervalt.
- Abonnementen worden **per maand** afgeschreven via SEPA-incasso. De eerste maand betaalt de klant met iDEAL | Wero, Bancontact of IBAN; daarmee ontstaat de incassomachtiging. Na de minimale looptijd lopen abonnementen door tegen dezelfde maandprijs en zijn ze maandelijks opzegbaar. Opzeggen binnen de minimale looptijd laat het abonnement aan het einde daarvan stoppen.
- Veiligheidscheck: geen schema bij zwangerschap of borstvoeding, een eetstoornis, ondergewicht of een ongezond streefgewicht. Bij medische aandoeningen moet de klant eerst bevestigen dat er met een arts is overlegd.
- Automatisch opschonen van gegevens volgens de bewaartermijnen uit het privacybeleid.

## Techniek

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Stripe · Anthropic SDK (Claude Opus 5.5, structured outputs) · PostgreSQL · SMTP (nodemailer).

Belangrijke bestanden:

| Bestand | Wat |
| --- | --- |
| `src/config/site.ts` | Bedrijfsgegevens, garantie, lanceringsactie |
| `src/config/pricing.ts` | Producten, looptijden en **alle prijzen** |
| `src/lib/ai/prompts.ts` | Instructies voor Claude (kwaliteit van de schema's) |
| `src/lib/ai/generate.ts` | Generatie en automatische kwaliteitscontrole |
| `src/lib/calculations.ts` | Berekening van calorieën en macro's |
| `src/lib/safety.ts` | Veiligheidscheck vóór betaling |
| `src/app/(site)/` | Alle publieke pagina's, inclusief de juridische |
| `src/app/beheer/` | De beheeromgeving |

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul in wat je hebt; de site werkt ook zonder
npm run dev                  # http://localhost:3000
```

Zonder Stripe en database werkt de hele website, inclusief de vragenlijst. De betaalstap meldt dan dat betalen nog niet is geactiveerd.

### Kwaliteit van de schema's testen

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run schema:test          # voeding + training
ANTHROPIC_API_KEY=sk-ant-... npm run schema:test voeding
```

Het resultaat komt in `schema-test/`, met per dag een overzicht van kcal en eiwit. Elke run kost API-tegoed: enkele tientallen eurocenten per schema met Claude Opus 5.5. Wil je de instructies verbeteren, pas dan `src/lib/ai/prompts.ts` aan en test opnieuw.

## Live zetten (checklist)

1. **Bedrijfsgegevens** invullen in `src/config/site.ts`: naam, adres, KvK, btw en e-mailadressen. Deze verschijnen in de footer, de voorwaarden en de e-mails.
2. **Hosting**: zet het project op [Vercel](https://vercel.com). De dagelijkse taak in `vercel.json` werkt daar automatisch. Zet de omgevingsvariabelen uit `.env.example`.
3. **Database**: maak een PostgreSQL-database aan in een EU-regio (bijv. Neon of Supabase) en zet `DATABASE_URL`. De tabellen worden automatisch aangemaakt.
4. **Stripe**
   - Zet in het dashboard de betaalmethoden aan: iDEAL | Wero, Bancontact en SEPA-incasso (voor abonnementen) en kaart (voor losse schema's). Stripe zet iDEAL en Bancontact bij abonnementen automatisch om in een SEPA-machtiging.
   - Zet bij Settings → Billing → Customer emails de e-mails voor mislukte betalingen aan, zodat klanten bericht krijgen als een incasso niet lukt.
   - Maak een webhook naar `https://jouwdomein.nl/api/webhooks/stripe` met deze events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Zet het signing secret in `STRIPE_WEBHOOK_SECRET`.
   - Sla het **klantportaal** (Settings → Billing → Customer portal) één keer op. Zet daarin betaalmethode wijzigen en factuurhistorie aan. Zet **opzeggen in het portaal uit**: de website regelt opzeggen zelf, zodat de minimale looptijd klopt.
   - Producten, prijzen en de lanceringscoupon worden automatisch aangemaakt bij de eerste bestelling.
   - Btw: de prijzen zijn inclusief 21%. Verkoop je ook aan België, overweeg dan Stripe Tax (OSS-regeling).
5. **E-mail**: zet de SMTP-gegevens van je e-mailaanbieder en stel SPF/DKIM in voor je domein, zodat mails niet in de spam belanden.
6. **Claude**: maak een API-sleutel aan op platform.claude.com, zet `ANTHROPIC_API_KEY` en draai `npm run schema:test` om de kwaliteit te beoordelen.
7. **Cron en beheer**: zet `CRON_SECRET` en een sterk `ADMIN_PASSWORD`. Kijk daarna op `/beheer/instellingen` of alle koppelingen groen zijn.
8. **Test** de hele flow in Stripe-testmodus: bestellen, schema ontvangen, check-in, opzeggen, opzegging intrekken en herroepen.
9. **Juridische controle**: laat de voorwaarden, het privacybeleid en de disclaimer controleren door een jurist. Sluit verwerkersovereenkomsten af met Anthropic, je hosting-, database- en e-mailpartij. Voeg de algemene voorwaarden eventueel als PDF toe aan de orderbevestiging.

## Prijzen, actie en garantie aanpassen

- **Prijzen**: `monthlyPrices` in `src/config/pricing.ts`, per maand, in centen en inclusief btw. Een gewijzigde prijs maakt automatisch een nieuwe Stripe-prijs aan voor nieuwe klanten; bestaande abonnees houden hun prijs.
- **Lanceringsactie**: `launchOffer` in `src/config/site.ts`. Hier stel je het percentage, de start- en einddatum in, of zet je de actie uit.
- **Garantie**: `guarantee` in `src/config/site.ts`. Zet je deze uit, dan verdwijnt de garantie overal, ook uit de voorwaarden.

## Reviews en social proof

Er staan bewust **geen verzonnen reviews** op de site; nep-reviews zijn verboden onder de Europese consumentenregels. Verzamel na de lancering echte reviews, bijvoorbeeld via Trustpilot of Kiyoh, en voeg die toe.

## Foto's

De foto's staan in `public/images` en komen van [Unsplash](https://unsplash.com/license). Ze zijn gratis te gebruiken, ook commercieel, en naamsvermelding is niet verplicht.
