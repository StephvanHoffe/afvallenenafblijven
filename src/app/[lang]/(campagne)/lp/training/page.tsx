import { CampaignLanding, landingMetadata } from "@/components/campaign/CampaignLanding";

export function generateMetadata() {
  return landingMetadata("training");
}

/** Landingspagina voor campagnes (training). Zie README → "Campagnes". */
export default function LandingPage() {
  return <CampaignLanding variant="training" />;
}
