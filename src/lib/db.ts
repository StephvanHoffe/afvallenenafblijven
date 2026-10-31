import postgres from "postgres";
import { STORED_CONFIG_KEYS, STORED_CONFIG_SETTING } from "@/lib/config-keys";

/**
 * PostgreSQL-verbinding. Werkt met elke Postgres-aanbieder (bijv. Neon of
 * Supabase in een EU-regio). De tabellen worden bij het eerste gebruik
 * automatisch aangemaakt, zodat je alleen DATABASE_URL hoeft in te stellen.
 */

declare global {
  var __afbSql: postgres.Sql | undefined;
  var __afbSchemaReady: Promise<void> | undefined;
  var __afbConfig: { loadedAt: number; envAtStart: Record<string, string | undefined> } | undefined;
}

/** De database-link. Koppel je Neon via Vercel (Storage), dan zet Vercel hem zelf. */
function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl());
}

function client(): postgres.Sql {
  const url = databaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is niet ingesteld");
  }
  globalThis.__afbSql ??= postgres(url, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
    onnotice: () => {},
  });
  return globalThis.__afbSql;
}

const SCHEMA = /* sql */ `
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  mollie_customer_id text unique,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists intakes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  email text not null,
  name text not null,
  data jsonb not null,
  consents jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  intake_id uuid not null references intakes(id),
  product text not null,
  duration text not null,
  checkout_id text not null unique,
  subscription_id text unique,
  status text not null default 'active',
  cancel_at timestamptz,
  amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Van Stripe naar Mollie: de oude kolomnamen in een eerder aangemaakte database omzetten.
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'customers' and column_name = 'stripe_customer_id') then
    alter table customers rename column stripe_customer_id to mollie_customer_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'stripe_session_id') then
    alter table orders rename column stripe_session_id to checkout_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'stripe_subscription_id') then
    alter table orders rename column stripe_subscription_id to subscription_id;
  end if;
end $$;

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  type text not null,
  seq integer not null default 1,
  status text not null default 'pending',
  content jsonb,
  error text,
  attempts integer not null default 0,
  started_at timestamptz,
  generated_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, type, seq)
);
create index if not exists plans_status_idx on plans(status);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists login_tokens (
  token_hash text primary key,
  customer_id uuid not null references customers(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists sessions (
  token_hash text primary key,
  customer_id uuid not null references customers(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  order_reference text not null,
  message text,
  created_at timestamptz not null default now()
);

-- Latere uitbreidingen (veilig om vaker uit te voeren)
alter table orders add column if not exists monthly_cents integer not null default 0;
alter table withdrawals add column if not exists handled_at timestamptz;
-- Meldingen aan de beheerder: soort, inhoud en over wie (zie Beheer → E-mails → Meldingen aan jou).
alter table email_log add column if not exists topic text;
alter table email_log add column if not exists body text;
alter table email_log add column if not exists about_email text;
create index if not exists email_log_kind_idx on email_log(kind, created_at);
create index if not exists orders_status_idx on orders(status);
-- Check-in per abonnement en periode (verplicht voor elk vervolgschema)
alter table checkins add column if not exists order_id uuid references orders(id) on delete cascade;
alter table checkins add column if not exists for_seq integer;
create unique index if not exists checkins_order_seq_idx on checkins(order_id, for_seq);
alter table orders add column if not exists checkin_reminded_seq integer;
alter table orders add column if not exists checkin_reminders integer not null default 0;
-- Wekelijkse weegmomenten tussen de check-ins
create table if not exists weekly_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  seq integer not null,
  week integer not null,
  data jsonb not null,
  adjustment jsonb,
  status text not null default 'ready',
  started_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, seq, week)
);
alter table customers add column if not exists weekly_reminders boolean not null default true;
alter table orders add column if not exists weekly_reminded_at timestamptz;
create index if not exists intakes_created_idx on intakes(created_at);

-- Taal van de klant: e-mails, schema's en PDF's in het Nederlands of Engels.
alter table intakes add column if not exists locale text not null default 'nl';
alter table customers add column if not exists locale text not null default 'nl';

-- Via welke campagne (utm) en landingspagina de klant binnenkwam.
alter table intakes add column if not exists campaign jsonb;

-- Start van de periode van een schema: een nieuw schema kan al klaarstaan
-- voordat de periode (op maandag) begint.
alter table plans add column if not exists starts_at timestamptz;
update plans set starts_at = created_at where starts_at is null;
alter table plans alter column starts_at set default now();
alter table plans alter column starts_at set not null;

-- Levering: een schema wordt direct gemaakt maar pas na release_after (een
-- willekeurig moment binnen 2 uur) vrijgegeven aan de klant, eventueel pas na
-- goedkeuring door de beheerder. Bestaande schema's waren al zichtbaar.
alter table plans add column if not exists release_after timestamptz;
update plans set release_after = created_at where release_after is null;
alter table plans alter column release_after set default now();
alter table plans alter column release_after set not null;
alter table plans add column if not exists approved_at timestamptz;
alter table plans add column if not exists review_requested_at timestamptz;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'released_at') then
    alter table plans add column released_at timestamptz;
    update plans set released_at = coalesce(emailed_at, generated_at, created_at) where status = 'ready';
    update plans set emailed_at = released_at where emailed_at is null and released_at is not null;
  end if;
end $$;
create index if not exists plans_unreleased_idx on plans(order_id, seq) where released_at is null;

-- Instellingen uit het beheer (bijv. schema's eerst goedkeuren) en de laatste dagelijkse run.
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Funnel: anonieme stappen van bezoekers (geen cookies, geen IP-adres of persoonsgegevens).
-- visit_id is een willekeurig nummer per tabblad (sessionStorage), zodat we stappen van één
-- bezoek kunnen koppelen. Wordt na 13 maanden opgeruimd.
create table if not exists funnel_events (
  id bigserial primary key,
  visit_id text,
  event text not null,
  step text,
  path text,
  product text,
  duration text,
  locale text,
  device text,
  source text,
  campaign text,
  landing text,
  created_at timestamptz not null default now()
);
alter table funnel_events add column if not exists referrer text;
alter table funnel_events add column if not exists seconds integer;
alter table funnel_events add column if not exists scroll smallint;
alter table funnel_events add column if not exists medium text;
alter table funnel_events add column if not exists content text;
alter table funnel_events add column if not exists country text;
alter table funnel_events add column if not exists region text;
alter table funnel_events add column if not exists city text;
create index if not exists funnel_events_created_idx on funnel_events(created_at);
create index if not exists funnel_events_visit_idx on funnel_events(visit_id);
alter table intakes add column if not exists visit_id text;
alter table intakes add column if not exists device text;
alter table intakes add column if not exists discount_code text;
alter table intakes add column if not exists reminded_at timestamptz;
alter table intakes add column if not exists duration text;

-- Ontvangen betalingen en terugbetalingen (uit de Mollie-webhook en het beheer).
create table if not exists payments (
  id text primary key,
  order_id uuid references orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  amount_cents integer not null,
  kind text not null default 'payment',
  description text,
  paid_at timestamptz not null default now()
);
create index if not exists payments_paid_idx on payments(paid_at);
-- De factuur (of creditnota) bij een betaling, voor het tabblad Betalingen.
alter table payments add column if not exists invoice_id text;
-- De actie waarmee een bestelling is gedaan (korting op de eerste maand(en)).
alter table orders add column if not exists promotion text;
create index if not exists payments_customer_idx on payments(customer_id, paid_at);

-- Kortingscodes (de website rekent de korting zelf uit in de betalingen).
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  percent_off integer,
  amount_off_cents integer,
  duration text not null default 'once',
  duration_months integer,
  products text[] not null default '{}',
  durations text[] not null default '{}',
  max_redemptions integer,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table orders add column if not exists discount_code text;
alter table orders add column if not exists cancel_reason text;
alter table orders add column if not exists cancel_comment text;
alter table orders add column if not exists ended_at timestamptz;
alter table orders add column if not exists refunded_cents integer not null default 0;

-- Mollie: de bedragen van het abonnement en de abonnementen bij Mollie. Een korting
-- op meer dan één maand is een kort abonnement (intro) voor maand 2 t/m intro_months,
-- daarna loopt het gewone abonnement (subscription_id) tegen monthly_cents.
alter table orders add column if not exists intro_cents integer;
alter table orders add column if not exists intro_months integer not null default 1;
alter table orders add column if not exists intro_subscription_id text unique;
-- Wanneer de abonnementen bij Mollie zijn stopgezet (na een opzegging of terugbetaling).
alter table orders add column if not exists subscription_canceled_at timestamptz;
-- De laatste mislukte afschrijving (zodat de klant er één mail over krijgt).
alter table orders add column if not exists failed_payment_id text;
-- De Mollie-betaling en -klant bij een gestarte betaling (voor de bedankpagina).
alter table intakes add column if not exists payment_id text;
alter table intakes add column if not exists mollie_customer_id text;

-- Facturen en creditnota's: de website maakt ze zelf, met een doorlopend nummer per jaar.
-- Naam en e-mail staan op de factuur zelf, zodat facturen de fiscale bewaartermijn van
-- 7 jaar halen, ook als de klantgegevens eerder worden verwijderd.
create table if not exists invoice_counters (
  year integer primary key,
  last integer not null
);
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  payment_id text not null unique,
  kind text not null default 'invoice',
  credit_for uuid references invoices(id),
  order_id uuid references orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  description text not null,
  period_start date,
  period_end date,
  amount_cents integer not null,
  vat_cents integer not null,
  vat_percent integer not null,
  method text,
  issued_at timestamptz not null default now()
);
create index if not exists invoices_customer_idx on invoices(customer_id);

-- Aangepaste e-mailteksten uit het beheer (lege velden = standaardtekst).
create table if not exists email_templates (
  kind text not null,
  locale text not null,
  subject text,
  intro text,
  button text,
  updated_at timestamptz not null default now(),
  primary key (kind, locale)
);

-- Alle verstuurde e-mails (12 maanden bewaard).
create table if not exists email_log (
  id bigserial primary key,
  to_email text not null,
  kind text,
  subject text not null,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_created_idx on email_log(created_at);
create index if not exists email_log_to_idx on email_log(lower(to_email));

-- Notities bij een klant en het logboek van beheeracties.
create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create table if not exists admin_log (
  id bigserial primary key,
  action text not null,
  details text,
  customer_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists admin_log_created_idx on admin_log(created_at);

-- Schema opnieuw maken met een aanwijzing, en je eigen beoordeling van een schema.
alter table plans add column if not exists admin_instruction text;
alter table plans add column if not exists rating integer;
alter table plans add column if not exists rating_note text;

-- Aanvragen onder de tevredenheidsgarantie (eerste betaling terug), één per klant.
create table if not exists guarantee_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references customers(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

-- Gekoppelde gezondheidsapps (Withings direct, overige via een aggregator).
create table if not exists health_connections (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  provider text not null,
  external_user_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  sources text[] not null default '{}',
  status text not null default 'active',
  error text,
  consent_at timestamptz not null default now(),
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  unique (customer_id, provider)
);
create index if not exists health_connections_external_idx on health_connections(provider, external_user_id);

-- Eén regel per klant, dag en koppeling: stappen, actieve calorieën en gewicht.
create table if not exists health_days (
  customer_id uuid not null references customers(id) on delete cascade,
  day date not null,
  provider text not null,
  source text not null default '',
  steps integer,
  active_kcal integer,
  active_minutes integer,
  weight_kg numeric(5,2),
  updated_at timestamptz not null default now(),
  primary key (customer_id, day, provider)
);

-- Geregistreerde trainingen (workouts) uit de gekoppelde apps.
create table if not exists health_workouts (
  customer_id uuid not null references customers(id) on delete cascade,
  provider text not null,
  external_id text not null,
  source text not null default '',
  started_at timestamptz not null,
  minutes integer not null,
  kcal integer,
  sport text,
  primary key (customer_id, provider, external_id)
);
create index if not exists health_workouts_started_idx on health_workouts(customer_id, started_at);

-- Instagram-posts die Claude maakt op basis van een opdracht (Beheer → Instagram).
-- status: pending (in de wachtrij) → generating → draft (concept) of scheduled
-- (publish_at) → publishing → published; failed bij een fout, met in failed_step
-- of het maken (generate) of het plaatsen (publish) mislukte. container_id: de
-- container bij Instagram, zodat een nieuwe poging nooit dubbel plaatst.
create table if not exists instagram_posts (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  format text not null default 'auto',
  instruction text,
  status text not null default 'pending',
  content jsonb,
  publish_at timestamptz,
  attempts integer not null default 0,
  error text,
  failed_step text,
  started_at timestamptz,
  container_id text,
  media_id text,
  permalink text,
  generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists instagram_posts_status_idx on instagram_posts(status, publish_at);
`;

/** Hoe lang de instellingen uit het beheer (Koppelingen) in het geheugen blijven voordat we ze opnieuw lezen. */
const CONFIG_TTL_MS = 30_000;

/** De waarden die de hosting zelf meegaf, vóórdat we er instellingen uit het beheer overheen legden. */
export function hostingValue(key: string): string | undefined {
  return (globalThis.__afbConfig?.envAtStart ?? process.env)[key] || undefined;
}

/**
 * Legt de instellingen uit het beheer over process.env (een waarde uit het
 * beheer gaat voor op die van de hosting). Gebeurt bij elk gebruik van de
 * database, hooguit eens per 30 seconden; `force` leest ze direct opnieuw.
 */
async function applyStoredConfig(sql: postgres.Sql, force = false): Promise<void> {
  const state = (globalThis.__afbConfig ??= {
    loadedAt: 0,
    envAtStart: Object.fromEntries(STORED_CONFIG_KEYS.map((k) => [k, process.env[k]])),
  });
  if (!force && Date.now() - state.loadedAt < CONFIG_TTL_MS) return;
  const [row] = await sql<{ value: Record<string, string> }[]>`select value from settings where key = ${STORED_CONFIG_SETTING}`;
  const stored = row?.value ?? {};
  for (const key of STORED_CONFIG_KEYS) {
    const value = stored[key] || state.envAtStart[key];
    if (value) process.env[key] = value;
    else delete process.env[key];
  }
  state.loadedAt = Date.now();
}

/** Geeft de SQL-client terug nadat het schema gegarandeerd bestaat (en de instellingen uit het beheer zijn geladen). */
export async function db(): Promise<postgres.Sql> {
  const sql = client();
  globalThis.__afbSchemaReady ??= sql
    .unsafe(SCHEMA)
    .then(() => undefined)
    .catch((err) => {
      globalThis.__afbSchemaReady = undefined;
      throw err;
    });
  await globalThis.__afbSchemaReady;
  await applyStoredConfig(sql);
  return sql;
}

/**
 * Laadt de instellingen uit het beheer, voor code die process.env leest vóórdat
 * de database is gebruikt (bijv. "is Mollie ingesteld?"). Zonder database: niets.
 */
export async function loadStoredConfig({ force = false }: { force?: boolean } = {}): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const sql = await db();
    if (force) await applyStoredConfig(sql, true);
  } catch (err) {
    console.error("Instellingen uit het beheer laden mislukt", err);
  }
}
