import "server-only";
import { db } from "@/lib/db";
import type { HealthConnection, HealthDay, HealthProvider, HealthWorkout, WorkoutKind } from "@/lib/health/types";

export async function connectionsForCustomer(customerId: string): Promise<HealthConnection[]> {
  const sql = await db();
  return sql<HealthConnection[]>`select * from health_connections where customer_id = ${customerId} order by connected_at`;
}

export async function getConnection(customerId: string, provider: HealthProvider): Promise<HealthConnection | null> {
  const sql = await db();
  const [row] = await sql<HealthConnection[]>`
    select * from health_connections where customer_id = ${customerId} and provider = ${provider}`;
  return row ?? null;
}

export async function connectionByExternalId(provider: HealthProvider, externalUserId: string): Promise<HealthConnection | null> {
  const sql = await db();
  const [row] = await sql<HealthConnection[]>`
    select * from health_connections where provider = ${provider} and external_user_id = ${externalUserId}
    order by connected_at desc limit 1`;
  return row ?? null;
}

/** Legt een koppeling vast (of werkt hem bij), met het moment van toestemming. */
export async function saveConnection(input: {
  customerId: string;
  provider: HealthProvider;
  externalUserId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  status: HealthConnection["status"];
  sources?: string[];
}): Promise<HealthConnection> {
  const sql = await db();
  const [row] = await sql<HealthConnection[]>`
    insert into health_connections (customer_id, provider, external_user_id, access_token, refresh_token, expires_at, status, sources)
    values (${input.customerId}, ${input.provider}, ${input.externalUserId}, ${input.accessToken ?? null},
            ${input.refreshToken ?? null}, ${input.expiresAt ?? null}, ${input.status}, ${input.sources ?? []})
    on conflict (customer_id, provider) do update set
      external_user_id = excluded.external_user_id,
      access_token = coalesce(excluded.access_token, health_connections.access_token),
      refresh_token = coalesce(excluded.refresh_token, health_connections.refresh_token),
      expires_at = coalesce(excluded.expires_at, health_connections.expires_at),
      status = excluded.status,
      sources = case when cardinality(excluded.sources) > 0 then excluded.sources else health_connections.sources end,
      error = null,
      consent_at = now()
    returning *`;
  return row;
}

export async function updateTokens(id: string, tokens: { accessToken: string; refreshToken: string; expiresAt: Date }): Promise<void> {
  const sql = await db();
  await sql`update health_connections set access_token = ${tokens.accessToken}, refresh_token = ${tokens.refreshToken},
            expires_at = ${tokens.expiresAt} where id = ${id}`;
}

export async function updateConnectionState(
  id: string,
  state: { status?: HealthConnection["status"]; error?: string | null; sources?: string[]; synced?: boolean },
): Promise<void> {
  const sql = await db();
  await sql`
    update health_connections set
      status = coalesce(${state.status ?? null}, status),
      error = ${state.error === undefined ? sql`error` : state.error},
      sources = coalesce(${state.sources ?? null}, sources),
      last_sync_at = ${state.synced ? sql`now()` : sql`last_sync_at`}
    where id = ${id}`;
}

/** Verwijdert de koppeling én alle gegevens die via die koppeling zijn binnengekomen. */
export async function deleteConnection(customerId: string, provider: HealthProvider): Promise<void> {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`delete from health_days where customer_id = ${customerId} and provider = ${provider}`;
    await tx`delete from health_workouts where customer_id = ${customerId} and provider = ${provider}`;
    await tx`delete from health_connections where customer_id = ${customerId} and provider = ${provider}`;
  });
}

export async function saveHealthData(
  customerId: string,
  provider: HealthProvider,
  data: { days: HealthDay[]; workouts: HealthWorkout[] },
): Promise<void> {
  const sql = await db();
  for (const d of data.days) {
    if (d.steps === null && d.activeKcal === null && d.activeMinutes === null && d.weightKg === null) continue;
    await sql`
      insert into health_days (customer_id, day, provider, source, steps, active_kcal, active_minutes, weight_kg, updated_at)
      values (${customerId}, ${d.day}, ${provider}, ${d.source}, ${d.steps}, ${d.activeKcal}, ${d.activeMinutes}, ${d.weightKg}, now())
      on conflict (customer_id, day, provider) do update set
        source = excluded.source,
        steps = coalesce(excluded.steps, health_days.steps),
        active_kcal = coalesce(excluded.active_kcal, health_days.active_kcal),
        active_minutes = coalesce(excluded.active_minutes, health_days.active_minutes),
        weight_kg = coalesce(excluded.weight_kg, health_days.weight_kg),
        updated_at = now()`;
  }
  for (const w of data.workouts) {
    await sql`
      insert into health_workouts (customer_id, provider, external_id, source, started_at, minutes, kcal, sport)
      values (${customerId}, ${provider}, ${w.id}, ${w.source}, ${w.startedAt}, ${w.minutes}, ${w.kcal}, ${w.sport})
      on conflict (customer_id, provider, external_id) do update set
        minutes = excluded.minutes, kcal = excluded.kcal, sport = excluded.sport, started_at = excluded.started_at`;
  }
}

/** Gezondheidsdata van een klant vanaf een datum, per dag samengevoegd over alle koppelingen. */
export async function healthDaysSince(customerId: string, since: Date): Promise<HealthDay[]> {
  const sql = await db();
  const rows = await sql<{ day: string; source: string; steps: number | null; active_kcal: number | null; active_minutes: number | null; weight_kg: string | null; weight_source: string | null }[]>`
    select to_char(day, 'YYYY-MM-DD') as day,
           (array_agg(source order by steps desc nulls last))[1] as source,
           max(steps) as steps, max(active_kcal) as active_kcal, max(active_minutes) as active_minutes,
           (array_agg(weight_kg order by updated_at desc) filter (where weight_kg is not null))[1] as weight_kg,
           (array_agg(source order by updated_at desc) filter (where weight_kg is not null))[1] as weight_source
    from health_days
    where customer_id = ${customerId} and day >= ${since.toISOString().slice(0, 10)}
    group by day order by day`;
  return rows.map((r) => ({
    day: r.day,
    source: r.source,
    steps: r.steps,
    activeKcal: r.active_kcal,
    activeMinutes: r.active_minutes,
    weightKg: r.weight_kg === null ? null : Number(r.weight_kg),
    ...(r.weight_source ? { weightSource: r.weight_source } : {}),
  }));
}

export async function healthWorkoutsSince(customerId: string, since: Date): Promise<HealthWorkout[]> {
  const sql = await db();
  const rows = await sql<{ external_id: string; source: string; started_at: Date; minutes: number; kcal: number | null; sport: string }[]>`
    select external_id, source, started_at, minutes, kcal, sport from health_workouts
    where customer_id = ${customerId} and started_at >= ${since} order by started_at`;
  return rows.map((r) => ({
    id: r.external_id,
    source: r.source,
    startedAt: new Date(r.started_at),
    minutes: r.minutes,
    kcal: r.kcal,
    sport: r.sport as WorkoutKind,
  }));
}

/** Koppelingen om (opnieuw) te synchroniseren door de dagelijkse taak. */
export async function connectionsToSync(limit = 200): Promise<HealthConnection[]> {
  const sql = await db();
  return sql<HealthConnection[]>`
    select * from health_connections
    where status in ('active', 'pending') and (last_sync_at is null or last_sync_at < now() - interval '6 hours')
    order by last_sync_at nulls first limit ${limit}`;
}
