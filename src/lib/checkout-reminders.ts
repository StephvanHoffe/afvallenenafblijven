import "server-only";
import { productFor, isProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { localeUrl, toLocale } from "@/i18n/config";
import { db } from "@/lib/db";
import { amsterdamHour } from "@/lib/dates";
import { checkoutReminderEmail, sendMail } from "@/lib/email";
import { checkoutReminderSettings } from "@/lib/settings";

/**
 * Herinnering bij een begonnen maar niet afgeronde betaling. Alleen als de
 * herinnering aanstaat (Beheer → Instellingen) en de bezoeker bij de bestelling
 * toestemming gaf voor e-mail; maximaal één keer, en nooit als dezelfde persoon
 * inmiddels toch heeft besteld. Alleen overdag (08:00-21:00).
 */
export async function sendCheckoutReminders(limit = 20): Promise<number> {
  const settings = await checkoutReminderSettings();
  if (!settings.enabled) return 0;
  const hour = amsterdamHour(new Date());
  if (hour < 8 || hour >= 21) return 0;
  const sql = await db();
  const due = await sql<{ id: string; email: string; name: string; locale: string; product: string | null }[]>`
    update intakes i set reminded_at = now()
    where i.id in (
      select i2.id from intakes i2
      where i2.reminded_at is null
        and i2.created_at < now() - ${settings.delayHours + " hours"}::interval
        and i2.created_at > now() - interval '3 days'
        and coalesce((i2.consents->>'marketing')::boolean, false)
        and not exists (select 1 from orders o where o.intake_id = i2.id)
        and not exists (
          select 1 from orders o join customers c on c.id = o.customer_id
          where lower(c.email) = lower(i2.email) and o.created_at > i2.created_at - interval '1 day'
        )
        and not exists (
          select 1 from intakes i3 where lower(i3.email) = lower(i2.email) and i3.id <> i2.id
            and (i3.reminded_at > now() - interval '7 days' or i3.created_at > i2.created_at)
        )
      order by i2.created_at limit ${limit}
    )
    returning i.id, i.email, i.name, i.locale, i.data->>'product' as product`;
  let sent = 0;
  for (const r of due) {
    const l = toLocale(r.locale);
    try {
      await sendMail(
        checkoutReminderEmail({
          to: r.email,
          name: r.name,
          link: localeUrl(site.url, l, `/start?hervat=${r.id}`),
          productName: r.product && isProductId(r.product) ? productFor(r.product, "nl").name : site.name,
          locale: l,
        }),
      );
      sent++;
    } catch (err) {
      console.error(`Herinnering voor afrekenen ${r.id} mislukt`, err);
    }
  }
  return sent;
}
