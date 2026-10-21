import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { CheckinData, CheckinWindow } from "@/lib/checkin";
import type { Intake } from "@/lib/intake";
import type { WeeklyLog, WeeklyWindow } from "@/lib/weekly";
import type { OrderStatus, PlanStatus } from "@/lib/repo";
import type { HealthView } from "@/lib/health/view";

/** Wat Mijn schema's van een bestelling toont. */
export interface DashboardOrder {
  id: string;
  reference: string;
  product: ProductId;
  duration: DurationId;
  status: OrderStatus;
  cancelAt: Date | null;
  createdAt: Date;
  /** Heeft een lopend Stripe-abonnement dat de klant kan beheren. */
  manageable: boolean;
  commitmentEndsAt: Date | null;
  /** De verplichte check-in voor de volgende periode (null als die er niet is). */
  checkin: CheckinWindow | null;
  /** Het wekelijkse weegmoment van de lopende periode (null als er geen is). */
  weekly: WeeklyWindow | null;
  lastWeightKg: number | null;
}

/** De tevredenheidsgarantie op de eerste aankoop, zoals Mijn schema's die toont. */
export interface GuaranteeView {
  orderId: string;
  reference: string;
  /** De eerste betaling, die de klant terugkrijgt. */
  amountCents: number;
  /** Stopt er een abonnement bij de aanvraag? (Niet bij een los schema.) */
  subscription: boolean;
  /** Tot en met dit moment kan de garantie worden aangevraagd. */
  deadline: Date;
  /** Kan de klant de garantie nu (nog) aanvragen? */
  open: boolean;
  requestedAt: Date | null;
  handledAt: Date | null;
}

export interface DashboardPlan {
  id: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  generatedAt: Date | null;
  failed: boolean;
  href: string;
  pdfHref: string;
}

/** Alles wat de persoonlijke omgeving (alle tabbladen) van een klant toont. */
export interface AccountView {
  name: string;
  orders: DashboardOrder[];
  plans: DashboardPlan[];
  /** Antwoorden uit de vragenlijst bij de start. */
  intake: Intake | null;
  /** Moment van de eerste bestelling: het startpunt van de voortgang. */
  startedAt: Date | null;
  /** Ingevulde check-ins, oudste eerst. */
  checkins: { seq: number | null; date: Date; data: CheckinData }[];
  /** Wekelijkse weegmomenten, oudste eerst. */
  weekly: WeeklyLog[];
  /** Wil de klant een wekelijkse herinnering per e-mail? */
  weeklyReminders: boolean;
  /** Dagdoelen van elk voedingsschema, oudste eerst. */
  targets: { seq: number; date: Date | null; calories: number; proteinG: number; carbsG: number; fatG: number }[];
  /** Gekoppelde gezondheidsapps en hun data (null als de site geen koppelingen heeft). */
  health: HealthView | null;
  /** Alleen binnen de garantietermijn, of als de klant de garantie heeft aangevraagd. */
  guarantee: GuaranteeView | null;
}

export type AccountTab = "overzicht" | "schemas" | "voortgang" | "check-in" | "gegevens" | "abonnement";

export type AccountNotice = "opgezegd" | "opzeggen" | "checkin" | "weegmoment" | "garantie" | null;
