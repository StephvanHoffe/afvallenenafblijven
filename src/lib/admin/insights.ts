import "server-only";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import {
  demoAdminLog,
  demoCustomerEmails,
  demoCustomerJourney,
  demoCustomerNotes,
  demoDiscountCodes,
  demoEmailCounts,
  demoEmailLog,
  demoFeedbackReport,
} from "@/lib/admin/demo-reports";
import { listDiscountCodes, type DiscountCodeRow } from "@/lib/discounts-server";
import type { CheckinData } from "@/lib/checkin";

/** Overige gegevens voor het beheer: feedback, e-maillog, logboek, notities en kortingscodes. */

export interface FeedbackReport {
  checkins: {
    createdAt: Date;
    customerId: string;
    customerName: string;
    seq: number | null;
    data: CheckinData;
  }[];
  distributions: { key: string; label: string; answers: { answer: string; count: number }[] }[];
  weekly: { createdAt: Date; customerId: string; customerName: string; week: number; comment: string }[];
  cancellations: { at: Date; customerId: string; customerName: string; reason: string | null; comment: string | null; product: string; duration: string }[];
  guarantees: { at: Date; customerId: string; customerName: string; reason: string | null }[];
  ratings: { at: Date; planId: string; customerName: string; type: string; seq: number; rating: number; note: string | null }[];
}

export const FEEDBACK_QUESTIONS: { key: keyof CheckinData; label: string }[] = [
  { key: "nutritionAdherence", label: "Voedingsschema gevolgd" },
  { key: "hunger", label: "Honger" },
  { key: "energy", label: "Energie" },
  { key: "sleep", label: "Slaap" },
  { key: "trainingAdherence", label: "Trainingen gedaan" },
  { key: "difficulty", label: "Zwaarte trainingen" },
];

export async function feedbackReport(days = 90): Promise<FeedbackReport> {
  if (isDemoMode()) return demoFeedbackReport();
  const sql = await db();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const checkins = await sql<{ created_at: Date; customer_id: string; name: string; for_seq: number | null; data: CheckinData }[]>`
    select ch.created_at, ch.customer_id, c.name, ch.for_seq, ch.data
    from checkins ch join customers c on c.id = ch.customer_id
    where ch.created_at >= ${from} order by ch.created_at desc limit 300`;
  const distributions = FEEDBACK_QUESTIONS.map((q) => {
    const counts = new Map<string, number>();
    for (const ch of checkins) {
      const v = ch.data[q.key];
      if (typeof v === "string" && v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return { key: q.key, label: q.label, answers: [...counts.entries()].map(([answer, count]) => ({ answer, count })).sort((a, b) => b.count - a.count) };
  });
  const weekly = await sql<{ created_at: Date; customer_id: string; name: string; week: number; comment: string }[]>`
    select w.created_at, w.customer_id, c.name, w.week, w.data->>'comments' as comment
    from weekly_logs w join customers c on c.id = w.customer_id
    where w.created_at >= ${from} and coalesce(w.data->>'comments', '') <> '' order by w.created_at desc limit 100`;
  const cancellations = await sql<
    { at: Date; customer_id: string; name: string; reason: string | null; comment: string | null; product: string; duration: string }[]
  >`
    select o.updated_at as at, o.customer_id, c.name, o.cancel_reason as reason, o.cancel_comment as comment, o.product, o.duration
    from orders o join customers c on c.id = o.customer_id
    where (o.cancel_at is not null or o.status = 'canceled') and o.updated_at >= ${from}
    order by o.updated_at desc limit 100`;
  const guarantees = await sql<{ at: Date; customer_id: string; name: string; reason: string | null }[]>`
    select g.created_at as at, g.customer_id, c.name, g.reason from guarantee_requests g join customers c on c.id = g.customer_id
    where g.created_at >= ${from} order by g.created_at desc limit 100`;
  const ratings = await sql<{ at: Date; id: string; name: string; type: string; seq: number; rating: number; rating_note: string | null }[]>`
    select coalesce(p.generated_at, p.created_at) as at, p.id, c.name, p.type, p.seq, p.rating, p.rating_note
    from plans p join customers c on c.id = p.customer_id where p.rating is not null order by p.created_at desc limit 50`;
  return {
    checkins: checkins.map((r) => ({ createdAt: r.created_at, customerId: r.customer_id, customerName: r.name, seq: r.for_seq, data: r.data })),
    distributions,
    weekly: weekly.map((r) => ({ createdAt: r.created_at, customerId: r.customer_id, customerName: r.name, week: r.week, comment: r.comment })),
    cancellations: cancellations.map((r) => ({
      at: r.at,
      customerId: r.customer_id,
      customerName: r.name,
      reason: r.reason,
      comment: r.comment,
      product: r.product,
      duration: r.duration,
    })),
    guarantees: guarantees.map((r) => ({ at: r.at, customerId: r.customer_id, customerName: r.name, reason: r.reason })),
    ratings: ratings.map((r) => ({ at: r.at, planId: r.id, customerName: r.name, type: r.type, seq: r.seq, rating: r.rating, note: r.rating_note })),
  };
}

export interface EmailLogRow {
  id: number;
  to: string;
  kind: string | null;
  subject: string;
  status: "sent" | "skipped" | "failed";
  error: string | null;
  createdAt: Date;
  customerId: string | null;
}

export async function emailLog(filters: { q?: string; status?: string; kind?: string; limit?: number } = {}): Promise<EmailLogRow[]> {
  if (isDemoMode()) return demoEmailLog(filters);
  const sql = await db();
  const q = filters.q?.trim().toLowerCase();
  const rows = await sql<{ id: number; to_email: string; kind: string | null; subject: string; status: EmailLogRow["status"]; error: string | null; created_at: Date; customer_id: string | null }[]>`
    select l.*, c.id as customer_id from email_log l left join customers c on lower(c.email) = lower(l.to_email)
    where true
      ${q ? sql`and (lower(l.to_email) like ${"%" + q + "%"} or lower(l.subject) like ${"%" + q + "%"})` : sql``}
      ${filters.status ? sql`and l.status = ${filters.status}` : sql``}
      ${filters.kind ? sql`and l.kind = ${filters.kind}` : sql``}
    order by l.created_at desc limit ${filters.limit ?? 200}`;
  return rows.map((r) => ({
    id: r.id,
    to: r.to_email,
    kind: r.kind,
    subject: r.subject,
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
    customerId: r.customer_id,
  }));
}

/** Aantal verstuurde mails per soort in de laatste 30 dagen. */
export async function emailCounts30(): Promise<Record<string, number>> {
  if (isDemoMode()) return demoEmailCounts();
  const sql = await db();
  const rows = await sql<{ kind: string; n: number }[]>`
    select kind, count(*)::int as n from email_log where created_at > now() - interval '30 days' and status = 'sent' and kind is not null group by 1`;
  return Object.fromEntries(rows.map((r) => [r.kind, r.n]));
}

export async function customerEmails(email: string): Promise<EmailLogRow[]> {
  if (isDemoMode()) return demoCustomerEmails(email);
  const sql = await db();
  const rows = await sql<{ id: number; to_email: string; kind: string | null; subject: string; status: EmailLogRow["status"]; error: string | null; created_at: Date }[]>`
    select * from email_log where lower(to_email) = lower(${email}) order by created_at desc limit 50`;
  return rows.map((r) => ({ id: r.id, to: r.to_email, kind: r.kind, subject: r.subject, status: r.status, error: r.error, createdAt: r.created_at, customerId: null }));
}

export interface AdminLogRow {
  id: number;
  action: string;
  details: string | null;
  customerId: string | null;
  createdAt: Date;
}

export async function adminLog(limit = 100): Promise<AdminLogRow[]> {
  if (isDemoMode()) return demoAdminLog();
  const sql = await db();
  const rows = await sql<{ id: number; action: string; details: string | null; customer_id: string | null; created_at: Date }[]>`
    select * from admin_log order by created_at desc limit ${limit}`;
  return rows.map((r) => ({ id: r.id, action: r.action, details: r.details, customerId: r.customer_id, createdAt: r.created_at }));
}

export interface NoteRow {
  id: string;
  text: string;
  createdAt: Date;
}

export async function customerNotes(customerId: string): Promise<NoteRow[]> {
  if (isDemoMode()) return demoCustomerNotes(customerId);
  const sql = await db();
  const rows = await sql<{ id: string; text: string; created_at: Date }[]>`
    select id, text, created_at from admin_notes where customer_id = ${customerId} order by created_at desc`;
  return rows.map((r) => ({ id: r.id, text: r.text, createdAt: r.created_at }));
}

export interface CustomerJourney {
  firstAt: Date;
  landing: string | null;
  source: string | null;
  campaign: string | null;
  device: string | null;
  pages: string[];
  stepsSeen: number;
  minutesToOrder: number | null;
}

/** Hoe de klant bij de bestelling kwam (uit de anonieme funnelmeting van dat bezoek). */
export async function customerJourney(customerId: string): Promise<CustomerJourney | null> {
  if (isDemoMode()) return demoCustomerJourney(customerId);
  const sql = await db();
  const [intake] = await sql<{ visit_id: string | null }[]>`
    select visit_id from intakes where customer_id = ${customerId} and visit_id is not null order by created_at asc limit 1`;
  if (!intake?.visit_id) return null;
  const events = await sql<{ event: string; step: string | null; path: string | null; source: string | null; campaign: string | null; device: string | null; created_at: Date }[]>`
    select event, step, path, source, campaign, device, created_at from funnel_events where visit_id = ${intake.visit_id} order by created_at`;
  if (events.length === 0) return null;
  const pages = [...new Set(events.filter((e) => e.event === "page_view" && e.path).map((e) => e.path!))];
  const purchase = events.find((e) => e.event === "purchase");
  return {
    firstAt: events[0].created_at,
    landing: pages[0] ?? null,
    source: events.find((e) => e.source)?.source ?? null,
    campaign: events.find((e) => e.campaign)?.campaign ?? null,
    device: events.find((e) => e.device)?.device ?? null,
    pages,
    stepsSeen: new Set(events.filter((e) => e.event === "quiz_step").map((e) => e.step)).size,
    minutesToOrder: purchase ? Math.round((purchase.created_at.getTime() - events[0].created_at.getTime()) / 60000) : null,
  };
}

export async function discountCodes(): Promise<DiscountCodeRow[]> {
  if (isDemoMode()) return demoDiscountCodes();
  return listDiscountCodes();
}
