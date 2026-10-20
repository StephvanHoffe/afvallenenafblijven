import type { DashboardOrder, DashboardPlan } from "@/components/account/AccountDashboard";

/**
 * Voorbeelddata voor de demo van Mijn schema's (/voorbeeld/mijn-schemas).
 * Fictieve klant; vaste datums zodat de pagina statisch kan blijven.
 */
export const demoCustomerName = "Sanne";

/** Datum waarop de schema's van periode 2 in de demo zijn gemaakt. */
export const demoPlanDate = new Date("2027-02-03T09:14:00+01:00");

export const demoOrders: DashboardOrder[] = [
  {
    id: "demo-order",
    reference: "3F2A9C1B",
    product: "bundel",
    duration: "3m",
    status: "active",
    cancelAt: null,
    createdAt: new Date("2027-01-06T09:12:00+01:00"),
    manageable: true,
    commitmentEndsAt: new Date("2027-04-06T09:12:00+02:00"),
    // In de demo staat de check-in voor periode 3 open.
    checkin: {
      seq: 3,
      status: "open",
      opensAt: new Date("2027-02-28T09:14:00+01:00"),
      dueAt: new Date("2027-03-03T09:14:00+01:00"),
    },
    lastWeightKg: 75.6,
  },
];

export const demoPlans: DashboardPlan[] = [
  {
    id: "demo-voeding-2",
    type: "voeding",
    seq: 2,
    status: "ready",
    generatedAt: new Date("2027-02-03T09:14:00+01:00"),
    failed: false,
    href: "/voorbeeld/mijn-schemas/voedingsschema",
    pdfHref: "/voorbeeld/pdf/voedingsschema",
  },
  {
    id: "demo-training-2",
    type: "training",
    seq: 2,
    status: "ready",
    generatedAt: new Date("2027-02-03T09:15:00+01:00"),
    failed: false,
    href: "/voorbeeld/mijn-schemas/trainingsschema",
    pdfHref: "/voorbeeld/pdf/trainingsschema",
  },
  {
    id: "demo-voeding-1",
    type: "voeding",
    seq: 1,
    status: "ready",
    generatedAt: new Date("2027-01-06T09:16:00+01:00"),
    failed: false,
    href: "/voorbeeld/mijn-schemas/voedingsschema",
    pdfHref: "/voorbeeld/pdf/voedingsschema",
  },
  {
    id: "demo-training-1",
    type: "training",
    seq: 1,
    status: "ready",
    generatedAt: new Date("2027-01-06T09:17:00+01:00"),
    failed: false,
    href: "/voorbeeld/mijn-schemas/trainingsschema",
    pdfHref: "/voorbeeld/pdf/trainingsschema",
  },
];
