import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import { euro, formatDate } from "@/lib/format";
import type { InvoiceRow } from "@/lib/invoices";
import { pdfFontFamily } from "@/lib/pdf/fonts";

/**
 * Factuur en creditnota als PDF (A4), in de huisstijl. Hier staat wel het
 * bedrijfsadres: dat is verplicht op een factuur (op de website staat het
 * alleen in de algemene voorwaarden).
 */

const copy = defineCopy({
  nl: {
    invoice: "Factuur",
    credit: "Creditnota",
    from: "Van",
    to: "Aan",
    number: "Factuurnummer",
    creditNumber: "Creditnotanummer",
    date: "Datum",
    order: "Bestelnummer",
    creditFor: "Hoort bij factuur",
    description: "Omschrijving",
    period: "Periode",
    amount: "Bedrag",
    excl: "Bedrag zonder btw",
    vat: (pct: number) => `Btw ${pct}%`,
    total: "Totaal (inclusief btw)",
    paid: (date: string, method: string | null) => `Betaald op ${date}${method ? ` via ${method}` : ""}. Je hoeft niets meer te doen.`,
    refunded: "We storten dit bedrag terug op de rekening waarmee je hebt betaald.",
    kvk: "KvK",
    vatNo: "Btw",
    methods: { ideal: "iDEAL | Wero", bancontact: "Bancontact", creditcard: "creditcard", directdebit: "SEPA-incasso" } as Record<string, string>,
  },
  en: {
    invoice: "Invoice",
    credit: "Credit note",
    from: "From",
    to: "To",
    number: "Invoice number",
    creditNumber: "Credit note number",
    date: "Date",
    order: "Order number",
    creditFor: "Relates to invoice",
    description: "Description",
    period: "Period",
    amount: "Amount",
    excl: "Amount excluding VAT",
    vat: (pct: number) => `VAT ${pct}%`,
    total: "Total (including VAT)",
    paid: (date: string, method: string | null) => `Paid on ${date}${method ? ` by ${method}` : ""}. There's nothing more you need to do.`,
    refunded: "We'll refund this amount to the account you paid with.",
    kvk: "Chamber of Commerce no.",
    vatNo: "VAT no.",
    methods: { ideal: "iDEAL | Wero", bancontact: "Bancontact", creditcard: "credit card", directdebit: "SEPA Direct Debit" } as Record<string, string>,
  },
});

const c = {
  brand900: "#123f29",
  lime: "#c8f169",
  ink: "#10231a",
  muted: "#4d6156",
  line: "#e5e4dc",
  sand: "#f7f6f1",
};

const s = StyleSheet.create({
  page: { fontSize: 9.5, color: c.ink, lineHeight: 1.45, paddingTop: 40, paddingBottom: 56, paddingHorizontal: 44 },
  band: {
    backgroundColor: c.brand900,
    color: "#ffffff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 13, fontWeight: 800 },
  kind: { fontSize: 9, fontWeight: 700, color: c.lime, textTransform: "uppercase", letterSpacing: 0.8 },
  columns: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, gap: 24 },
  label: { fontSize: 7.5, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  strong: { fontWeight: 700 },
  meta: { flexDirection: "row", gap: 28, marginTop: 22, paddingVertical: 10, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: c.line },
  table: { marginTop: 22 },
  headRow: { flexDirection: "row", backgroundColor: c.sand, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  row: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 0.5, borderColor: c.line },
  colDesc: { flex: 1, paddingRight: 12 },
  colPeriod: { width: 150 },
  colAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 14, marginLeft: "auto", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 7, borderTopWidth: 1, borderColor: c.ink, fontSize: 11, fontWeight: 800 },
  note: { marginTop: 26, padding: 12, backgroundColor: c.sand, borderRadius: 8, color: c.muted },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 7.5,
    color: c.muted,
    borderTopWidth: 0.5,
    borderTopColor: c.line,
    paddingTop: 6,
    textAlign: "center",
  },
});

function InvoiceDocument({
  invoice,
  orderReference,
  creditForNumber,
  fontFamily,
  l,
}: {
  invoice: InvoiceRow;
  orderReference: string | null;
  creditForNumber: string | null;
  fontFamily: string;
  l: Locale;
}) {
  const t = copy[l];
  const credit = invoice.kind === "credit";
  const co = site.company;
  const period =
    invoice.period_start && invoice.period_end ? `${formatDate(invoice.period_start, l)} – ${formatDate(invoice.period_end, l)}` : "";
  const method = invoice.method ? (t.methods[invoice.method] ?? invoice.method) : null;
  return (
    <Document title={`${credit ? t.credit : t.invoice} ${invoice.number}`} author={co.legalName} language={l}>
      <Page size="A4" style={[s.page, { fontFamily }]}>
        <View style={s.band}>
          <Text style={s.brand}>{site.name}</Text>
          <Text style={s.kind}>{credit ? t.credit : t.invoice}</Text>
        </View>

        <View style={s.columns}>
          <View>
            <Text style={s.label}>{t.from}</Text>
            <Text style={s.strong}>{co.legalName}</Text>
            <Text>{co.address}</Text>
            <Text>
              {co.postalCode} {co.city}
            </Text>
            <Text>
              {t.kvk} {co.kvk} · {t.vatNo} {co.vat}
            </Text>
            <Text>{co.email}</Text>
          </View>
          <View style={{ width: 200 }}>
            <Text style={s.label}>{t.to}</Text>
            <Text style={s.strong}>{invoice.customer_name}</Text>
            <Text>{invoice.customer_email}</Text>
          </View>
        </View>

        <View style={s.meta}>
          <View>
            <Text style={s.label}>{credit ? t.creditNumber : t.number}</Text>
            <Text style={s.strong}>{invoice.number}</Text>
          </View>
          <View>
            <Text style={s.label}>{t.date}</Text>
            <Text>{formatDate(invoice.issued_at, l)}</Text>
          </View>
          {orderReference && (
            <View>
              <Text style={s.label}>{t.order}</Text>
              <Text>{orderReference}</Text>
            </View>
          )}
          {creditForNumber && (
            <View>
              <Text style={s.label}>{t.creditFor}</Text>
              <Text>{creditForNumber}</Text>
            </View>
          )}
        </View>

        <View style={s.table}>
          <View style={s.headRow}>
            <Text style={[s.label, s.colDesc, { marginBottom: 0 }]}>{t.description}</Text>
            <Text style={[s.label, s.colPeriod, { marginBottom: 0 }]}>{period ? t.period : ""}</Text>
            <Text style={[s.label, s.colAmount, { marginBottom: 0 }]}>{t.amount}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.colDesc}>{invoice.description}</Text>
            <Text style={s.colPeriod}>{period}</Text>
            <Text style={s.colAmount}>{euro(invoice.amount_cents, l)}</Text>
          </View>
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text>{t.excl}</Text>
            <Text>{euro(invoice.amount_cents - invoice.vat_cents, l)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text>{t.vat(invoice.vat_percent)}</Text>
            <Text>{euro(invoice.vat_cents, l)}</Text>
          </View>
          <View style={s.grand}>
            <Text>{t.total}</Text>
            <Text>{euro(invoice.amount_cents, l)}</Text>
          </View>
        </View>

        <Text style={s.note}>{credit ? t.refunded : t.paid(formatDate(invoice.issued_at, l), method)}</Text>

        <Text style={s.footer} fixed>
          {co.legalName} · {co.address}, {co.postalCode} {co.city} · {t.kvk} {co.kvk} · {t.vatNo} {co.vat} · {co.email}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(
  invoice: InvoiceRow,
  { orderReference = null, creditForNumber = null, l = "nl" }: { orderReference?: string | null; creditForNumber?: string | null; l?: Locale } = {},
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <InvoiceDocument invoice={invoice} orderReference={orderReference} creditForNumber={creditForNumber} fontFamily={pdfFontFamily()} l={l} />,
  );
  return new Uint8Array(buffer);
}

/** "factuur-2026-00012.pdf" of "creditnota-2026-00013.pdf" (Engels: invoice-…, credit-note-…). */
export function invoiceFileName(invoice: InvoiceRow, l: Locale = "nl"): string {
  const kind = invoice.kind === "credit" ? (l === "en" ? "credit-note" : "creditnota") : l === "en" ? "invoice" : "factuur";
  return `${kind}-${invoice.number}.pdf`;
}
