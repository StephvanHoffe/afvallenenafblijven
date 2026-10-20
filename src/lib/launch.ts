import { cacheLife } from "next/cache";
import { isLaunchOfferActive } from "@/config/site";

/**
 * Of de lanceringsactie nu loopt. Gecachet per uur, zodat pagina's statisch
 * kunnen blijven en de actie toch automatisch start en stopt.
 */
export async function launchOfferActive(): Promise<boolean> {
  "use cache";
  cacheLife("hours");
  return isLaunchOfferActive(new Date());
}
