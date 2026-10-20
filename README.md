# Afvallen & Afblijven

Website voor het verkopen van persoonlijke **voedingsschema's**, **trainingsschema's** en een **bundel**, los of als abonnement (1, 3, 6 of 12 maanden). De schema's worden na betaling automatisch gemaakt met **Claude** (Anthropic) en binnen enkele minuten geleverd.

## Wat zit erin

**Verkoop en conversie**
- Homepage, productpagina's (voeding, training, bundel), prijzen, hoe het werkt, voorbeeldschema, FAQ, over ons en contact.
- Vragenlijst in stappen (`/start`). De bezoeker ziet direct een persoonlijk resultaat: calorie- en macrodoel en een prognose met streefdatum. Daarna volgen de plankeuze en de betaling.
- Prijstabel met looptijd-schakelaar, kortingslabels, "Meest gekozen"-bundel en een losse aankoop als alternatief.
- Lanceringsactie (automatische korting op de eerste betaling, alleen binnen de ingestelde data).
- Tevredenheidsgarantie (aan/uit te zetten).
- Vaste startknop onderin op mobiel.
- Conversiemeting voor GA4 en Meta Pixel, pas na cookietoestemming.

**Na de betaling**
- De Stripe-webhook legt de bestelling vast en verstuurt een orderbevestiging.
- Claude maakt het schema. Het systeem controleert het automatisch op calorieën, eiwit en het aantal maaltijden; voldoet het niet, dan wordt het één keer opnieuw gemaakt.
- De bedankpagina laat live zien wanneer het schema klaar is. De klant krijgt ook een e-mail met een inloglink.
- "Mijn schema's" (inloggen zonder wachtwoord): schema's bekijken en printen of als PDF opslaan, check-in invullen, abonnement opzeggen of de opzegging intrekken, en betaalgegevens en facturen inzien via het Stripe-portaal.
- Abonnees krijgen elke 4 weken een nieuw schema, afgestemd op hun check-in. Is het streefgewicht bereikt, dan schakelt het schema automatisch over naar een onderhoudsplan ("afblijven").

**Juridisch (Nederland)**
- Algemene voorwaarden, privacybeleid, cookiebeleid en disclaimer.
- Herroepingsfunctie in twee stappen (`/herroepen`) met ontvangstbevestiging per e-mail. Deze functie is verplicht sinds 19 juni 2026.
- Online opzeggen (`/abonnement-opzeggen`).
- Cookiebanner volgens de richtlijnen van de Autoriteit Persoonsgegevens: weigeren is even makkelijk als accepteren, en scripts laden pas na toestemming.
- Uitdrukkelijke toestemming voor het verwerken van gezondheidsgegevens (art. 9 AVG).
- Instemming met directe levering, waardoor het herroepingsrecht voor digitale inhoud vervalt.
- Abonnementen van 3, 6 en 12 maanden lopen na de eerste periode **per maand** door en zijn dan maandelijks opzegbaar. Dat regelt een Stripe *subscription schedule* automatisch.
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
| `src/app/(pagina's)` | Alle pagina's, inclusief de juridische |

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
   - Zet in het dashboard de betaalmethoden aan: iDEAL | Wero, Bancontact, kaart en SEPA-incasso.
   - Maak een webhook naar `https://jouwdomein.nl/api/webhooks/stripe` met deze events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Zet het signing secret in `STRIPE_WEBHOOK_SECRET`.
   - Sla het **klantportaal** (Settings → Billing → Customer portal) één keer op. Zet daarin betaalmethode wijzigen en factuurhistorie aan. Opzeggen regelt de website zelf, dus die optie mag in het portaal uit.
   - Producten, prijzen en de lanceringscoupon worden automatisch aangemaakt bij de eerste bestelling.
   - Btw: de prijzen zijn inclusief 21%. Verkoop je ook aan België, overweeg dan Stripe Tax (OSS-regeling).
5. **E-mail**: zet de SMTP-gegevens van je e-mailaanbieder en stel SPF/DKIM in voor je domein, zodat mails niet in de spam belanden.
6. **Claude**: maak een API-sleutel aan op platform.claude.com, zet `ANTHROPIC_API_KEY` en draai `npm run schema:test` om de kwaliteit te beoordelen.
7. **Cron**: zet `CRON_SECRET`.
8. **Test** de hele flow in Stripe-testmodus: bestellen, schema ontvangen, check-in, opzeggen, opzegging intrekken en herroepen.
9. **Juridische controle**: laat de voorwaarden, het privacybeleid en de disclaimer controleren door een jurist. Sluit verwerkersovereenkomsten af met Anthropic, je hosting-, database- en e-mailpartij. Voeg de algemene voorwaarden eventueel als PDF toe aan de orderbevestiging.

## Prijzen, actie en garantie aanpassen

- **Prijzen**: `monthlyPrices` in `src/config/pricing.ts`, in centen en inclusief btw. Een gewijzigde prijs maakt automatisch een nieuwe Stripe-prijs aan voor nieuwe klanten; bestaande abonnees houden hun prijs.
- **Lanceringsactie**: `launchOffer` in `src/config/site.ts`. Hier stel je het percentage, de start- en einddatum in, of zet je de actie uit.
- **Garantie**: `guarantee` in `src/config/site.ts`. Zet je deze uit, dan verdwijnt de garantie overal, ook uit de voorwaarden.

## Reviews en social proof

Er staan bewust **geen verzonnen reviews** op de site; nep-reviews zijn verboden onder de Europese consumentenregels. Verzamel na de lancering echte reviews, bijvoorbeeld via Trustpilot of Kiyoh, en voeg die toe.

## Foto's

De foto's staan in `public/images` en komen van [Unsplash](https://unsplash.com/license). Ze zijn gratis te gebruiken, ook commercieel, en naamsvermelding is niet verplicht.
