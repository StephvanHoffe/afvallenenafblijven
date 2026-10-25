import postgres from "postgres";

/**
 * PostgreSQL-verbinding. Werkt met elke Postgres-aanbieder (bijv. Neon of
 * Supabase in een EU-regio). De tabellen worden bij het eerste gebruik
 * automatisch aangemaakt, zodat je alleen DATABASE_URL hoeft in te stellen.
 */

declare global {
  var __afbSql: postgres.Sql | undefined;
  var __afbSchemaReady: Promise<void> | undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function client(): postgres.Sql {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is niet ingesteld");
  }
  globalThis.__afbSql ??= postgres(process.env.DATABASE_URL, {
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
  stripe_customer_id text unique,
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
  stripe_session_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'active',
  cancel_at timestamptz,
  amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
create index if not exists funnel_events_created_idx on funnel_events(created_at);
create index if not exists funnel_events_visit_idx on funnel_events(visit_id);
alter table intakes add column if not exists visit_id text;
alter table intakes add column if not exists device text;
alter table intakes add column if not exists discount_code text;
alter table intakes add column if not exists reminded_at timestamptz;
alter table intakes add column if not exists duration text;

-- Ontvangen betalingen en terugbetalingen (uit de Stripe-webhooks en het beheer).
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
-- De Stripe-factuur bij een betaling, voor het tabblad Betalingen (abonnementen: de factuur zelf; losse schema's: de factuur van de checkout).
alter table payments add column if not exists invoice_id text;
-- De actie waarmee een bestelling is gedaan (korting op de eerste maand(en)).
alter table orders add column if not exists promotion text;
update payments set invoice_id = id where invoice_id is null and kind = 'payment' and id like 'in\_%';
create index if not exists payments_customer_idx on payments(customer_id, paid_at);

-- Kortingscodes (de bijbehorende Stripe-coupon wordt bij het eerste gebruik aangemaakt).
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
  stripe_coupon_id text,
  created_at timestamptz not null default now()
);
alter table orders add column if not exists discount_code text;
alter table orders add column if not exists cancel_reason text;
alter table orders add column if not exists cancel_comment text;
alter table orders add column if not exists ended_at timestamptz;
alter table orders add column if not exists refunded_cents integer not null default 0;

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
`;

/** Geeft de SQL-client terug nadat het schema gegarandeerd bestaat. */
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
  return sql;
}
