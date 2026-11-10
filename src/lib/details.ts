import "server-only";
import { productFor, products, type ProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { localeUrl, toLocale, type Locale } from "@/i18n/config";
import { adminNotificationEmail, detailsReminderEmail, sendMail } from "@/lib/email";
import { createPlans, intakesNeedingDetailsReminder, markDetailsReminded, type Order } from "@/lib/repo";
import { firstPeriodStart } from "@/lib/schedule";
import { scheduledDelivery } from "@/lib/settings";

/**
 * Korte route (zie README): de klant betaalt na een korte gezondheidscheck en
 * vult daarna de rest van de vragenlijst in. Pas dan maken we het eerste
 * schema; "binnen 2 uur" telt vanaf dat moment.
 */

/** Link om de vragenlijst aan te vullen (het nummer van de vragenlijst is geheim, net als op de bedankpagina). */
export function detailsUrl(intakeId: string, l: Locale): string {
  return `${localeUrl(site.url, l, "/schema-aanvullen")}?bestelling=${encodeURIComponent(intakeId)}`;
}

/**
 * Maakt de schema's van de eerste periode. Die begint op de gekozen startdatum
 * (als die nog niet voorbij is), anders nu; het schema staat op een
 * willekeurig moment binnen 2 uur klaar.
 */
export async function createFirstPeriodPlans(order: Pick<Order, "id" | "customer_id"> & { product: string }, startDay: string | null): Promise<Date> {
  const startsAt = firstPeriodStart(startDay);
  await createPlans(order.id, order.customer_id, products[order.product as ProductId].includes, 1, startsAt, await scheduledDelivery("purchase"));
  return startsAt;
}

/**
 * Herinneringen voor wie na het betalen de vragenlijst nog niet heeft
 * aangevuld: na 2 uur, na 1 dag en na 3 dagen (servicemails, dus ook zonder
 * toestemming voor marketing). Bij de laatste krijgt de beheerder een melding.
 */
export async function sendDetailsReminders(limit = 20): Promise<number> {
  let sent = 0;
  for (const row of (await intakesNeedingDetailsReminder()).slice(0, limit)) {
    const l = toLocale(row.locale);
    const reminder = row.details_reminders;
    try {
      await sendMail(detailsReminderEmail({ to: row.email, name: row.name, link: detailsUrl(row.id, l), reminder, locale: l }));
      await markDetailsReminded(row.id);
      sent++;
      if (reminder >= 2) {
        await sendMail(
          adminNotificationEmail(
            "vragenlijst-niet-aangevuld",
            `Vragenlijst nog niet aangevuld: ${row.name}`,
            {
              Klant: `${row.name} (${row.email})`,
              Product: productFor(row.product as ProductId, "nl").name,
              Besteld: new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(row.created_at),
              Situatie: "De klant heeft betaald en 3 herinneringen gehad, maar de vragenlijst nog niet aangevuld. Er is nog geen schema gemaakt.",
              Link: detailsUrl(row.id, l),
              Bekijken: row.customer_id ? `${site.url}/beheer/klanten/${row.customer_id}` : undefined,
            },
            { about: row.email },
          ),
        ).catch((err) => console.error("Melding vragenlijst niet aangevuld versturen mislukt", err));
      }
    } catch (err) {
      console.error(`Herinnering vragenlijst aanvullen (${row.id}) mislukt`, err);
    }
  }
  return sent;
}
