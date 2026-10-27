import { after } from "next/server";
import { handleMolliePayment } from "@/lib/fulfillment";
import { MollieError } from "@/lib/mollie";
import { processOrderPlans } from "@/lib/plans";

// Een schema maken met Claude kan meer dan 5 minuten duren; 800 seconden is het maximum op Vercel Pro (Fluid compute).
export const maxDuration = 800;

/**
 * Meldingen van Mollie. Mollie stuurt alleen het ID van een betaling
 * ("id=tr_…"), nooit de status: die halen we zelf op bij Mollie, zodat een
 * vervalste melding niets kan doen. Mollie wil binnen 15 seconden een 200 en
 * probeert het anders tot 26 uur lang opnieuw.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const id = String(form?.get("id") ?? "");
  // Andere soorten meldingen gebruiken we niet; een 200 voorkomt dat Mollie blijft proberen.
  if (!/^tr_[A-Za-z0-9]+$/.test(id)) return new Response("Genegeerd");

  try {
    const order = await handleMolliePayment(id);
    // Schema's maken na het antwoord aan Mollie.
    if (order) after(() => processOrderPlans(order.id));
  } catch (err) {
    // Een onbekende betaling (bijv. uit een ander Mollie-profiel) is geen reden om opnieuw te proberen.
    if (err instanceof MollieError && err.status === 404) return new Response("Onbekend");
    console.error(`Mollie-melding ${id} verwerken mislukt`, err);
    // 500 zodat Mollie het later opnieuw probeert.
    return new Response("Verwerken mislukt", { status: 500 });
  }
  return new Response("OK");
}
