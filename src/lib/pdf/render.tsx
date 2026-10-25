import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlansDocument, ShoppingListDocument, planDocumentTitle, type PdfPlan } from "@/lib/pdf/documents";
import { pdfFontFamily } from "@/lib/pdf/fonts";
import type { Locale } from "@/i18n/config";

export type { PdfPlan };
export type PdfPart = "schema" | "boodschappen";

/**
 * Maakt een PDF van één of meer schema's, of alleen de boodschappenlijst van
 * een voedingsschema. De taal geldt voor de vaste teksten; de inhoud van het
 * schema staat al in de taal van de klant.
 */
export async function renderPlansPdf(plans: PdfPlan[], name: string, part: PdfPart = "schema", l: Locale = "nl"): Promise<Uint8Array> {
  const fontFamily = pdfFontFamily();
  const shopping = part === "boodschappen" ? plans.find((p) => p.content.type === "voeding") : undefined;
  const buffer = await renderToBuffer(
    shopping ? (
      <ShoppingListDocument plan={shopping} name={name} fontFamily={fontFamily} l={l} />
    ) : (
      <PlansDocument plans={plans} name={name} fontFamily={fontFamily} l={l} />
    ),
  );
  return new Uint8Array(buffer);
}

/** Bestandsnaam zoals "voedingsschema-periode-2.pdf" (Engels: "nutrition-plan-period-2.pdf"). */
export function pdfFileName(plans: PdfPlan[], part: PdfPart = "schema", l: Locale = "nl"): string {
  const en = l === "en";
  if (part === "boodschappen") {
    const seq = plans.find((p) => p.content.type === "voeding")?.seq ?? 1;
    if (en) return seq > 1 ? `shopping-list-period-${seq}.pdf` : "shopping-list.pdf";
    return seq > 1 ? `boodschappenlijst-periode-${seq}.pdf` : "boodschappenlijst.pdf";
  }
  const later = plans[0] && plans[0].seq > 1 ? plans[0].seq : null;
  const base =
    plans.length === 1
      ? planDocumentTitle(plans[0], l)
      : en
        ? `my plans${later ? ` – period ${later}` : ""}`
        : `mijn schemas${later ? ` – periode ${later}` : ""}`;
  return `${base
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")}.pdf`;
}

export function pdfResponse(pdf: Uint8Array, fileName: string, { cache = "private, no-store" } = {}): Response {
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": cache,
      "X-Robots-Tag": "noindex",
    },
  });
}
