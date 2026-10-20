import "server-only";
import { isAppleHealthEnabled, isJunctionConfigured, isWithingsConfigured, junctionProviders } from "@/lib/health/config";
import { connectionsForCustomer, healthDaysSince, healthWorkoutsSince } from "@/lib/health/repo";
import type { HealthView } from "@/lib/health/view";

const DAY = 24 * 60 * 60 * 1000;

/** De koppelingen en data van de afgelopen 120 dagen voor de persoonlijke omgeving. */
export async function loadHealthView(customerId: string, plannedPerWeek: number | null): Promise<HealthView> {
  const since = new Date(Date.now() - 120 * DAY);
  const [connections, days, workouts] = await Promise.all([
    connectionsForCustomer(customerId),
    healthDaysSince(customerId, since),
    healthWorkoutsSince(customerId, since),
  ]);
  return {
    available: { withings: isWithingsConfigured(), junction: isJunctionConfigured(), apple: isAppleHealthEnabled() },
    junctionProviders: junctionProviders(),
    connections: connections.map((c) => ({
      provider: c.provider,
      status: c.status,
      sources: c.sources,
      connectedAt: c.connected_at,
      lastSyncAt: c.last_sync_at,
      error: c.error,
    })),
    days,
    workouts,
    plannedPerWeek,
    now: new Date(),
  };
}
