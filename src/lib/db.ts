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
