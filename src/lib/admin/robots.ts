import "server-only";
import type postgres from "postgres";

/**
 * Plaatsen met grote datacenters van Meta, Google, Amazon en Microsoft (land
 * zoals Vercel het meegeeft + stad). Een bezoek vandaar is vrijwel altijd een
 * robot: Meta bekijkt zo bijvoorbeeld de landingspagina van elke advertentie,
 * Google en anderen controleren links. Zulke robots doen zich voor als een
 * gewone telefoon of tablet, dus de user-agent verraadt ze niet. Voor een
 * Nederlandse website is een bezoek uit deze plaatsen vrijwel nooit een klant;
 * de rapporten in het beheer laten ze daarom weg (en zeggen hoeveel).
 */
export const DATACENTER_PLACES: readonly (readonly [country: string, city: string])[] = [
  // Meta
  ["US", "Prineville"],
  ["US", "Forest City"],
  ["US", "Altoona"],
  ["US", "Fort Worth"],
  ["US", "Los Lunas"],
  ["US", "Papillion"],
  ["US", "Sandston"],
  ["US", "New Albany"],
  ["US", "Eagle Mountain"],
  ["US", "Gallatin"],
  ["US", "Kuna"],
  ["US", "Stanton Springs"],
  ["SE", "Luleå"],
  ["IE", "Clonee"],
  // Google
  ["US", "Council Bluffs"],
  ["US", "The Dalles"],
  ["US", "Lenoir"],
  ["US", "Moncks Corner"],
  ["US", "Pryor"],
  ["US", "Midlothian"],
  ["FI", "Hamina"],
  // Amazon
  ["US", "Ashburn"],
  ["US", "Boardman"],
  ["US", "Hilliard"],
  // Microsoft
  ["US", "Boydton"],
  ["US", "Quincy"],
];

const KEYS = DATACENTER_PLACES.map(([country, city]) => `${country}|${city.toLowerCase()}`);

/** De bezoeknummers van bezoeken uit een datacenter (als subquery). */
function datacenterVisitIds(sql: postgres.Sql) {
  return sql`
    select visit_id from funnel_events
    where event = 'page_view' and visit_id is not null and country is not null and city is not null
      and (country || '|' || lower(city)) = any(${KEYS}::text[])`;
}

/**
 * SQL-voorwaarde: het bezoek komt niet uit een datacenter. Gebruik na `and`;
 * geef een kolom mee als de tabel een alias heeft (bijv. sql`e.visit_id`).
 * Een stap zonder bezoeknummer telt gewoon mee.
 */
export function notFromDatacenter(sql: postgres.Sql, column?: postgres.PendingQuery<postgres.Row[]>) {
  return sql`coalesce(${column ?? sql`visit_id`}, '') not in (${datacenterVisitIds(sql)})`;
}

/** Hoeveel bezoeken sinds `from` uit een datacenter kwamen, en uit welke plaatsen (meeste eerst). */
export async function datacenterVisits(sql: postgres.Sql, from: Date): Promise<{ visits: number; places: string[] }> {
  const rows = await sql<{ city: string; n: number }[]>`
    select min(city) as city, count(distinct visit_id)::int as n from funnel_events
    where created_at >= ${from} and event = 'page_view' and visit_id is not null and country is not null and city is not null
      and (country || '|' || lower(city)) = any(${KEYS}::text[])
    group by lower(city) order by n desc`;
  return { visits: rows.reduce((sum, r) => sum + r.n, 0), places: rows.map((r) => r.city) };
}
