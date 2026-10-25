import { after } from "next/server";
import { constructWebhookEvent, type Stripe } from "@/lib/stripe";
import { fulfillCheckoutSession, syncSubscription } from "@/lib/fulfillment";
import { processOrderPlans } from "@/lib/plans";
import { recordInvoicePaid } from "@/lib/payments";

export const maxDuration = 300;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Geen handtekening", { status: 400 });

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(await request.text(), signature);
  } catch (err) {
    console.error("Ongeldige Stripe-webhook", err);
    return new Response("Ongeldige handtekening", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const order = await fulfillCheckoutSession(event.data.object);
        // Schema's maken na het antwoord aan Stripe (dat wil binnen seconden een 200).
        if (order) after(() => processOrderPlans(order.id));
        break;
      }
      case "invoice.paid":
        await recordInvoicePaid(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook ${event.type} verwerken mislukt`, err);
    // 500 zodat Stripe het later opnieuw probeert.
    return new Response("Verwerken mislukt", { status: 500 });
  }
  return Response.json({ received: true });
}
