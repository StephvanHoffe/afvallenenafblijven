import { CampaignLanding, landingMetadata } from "@/components/campaign/CampaignLanding";

export function generateMetadata() {
  return landingMetadata("voeding");
}

/** Landingspagina voor campagnes (voeding). Zie README → "Campagnes". */
export default function LandingPage() {
  return <CampaignLanding variant="voeding" />;
}
