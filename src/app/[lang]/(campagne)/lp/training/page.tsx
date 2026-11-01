import { CampaignLanding, landingMetadata } from "@/components/campaign/CampaignLanding";

export function generateMetadata() {
  return landingMetadata("training");
}

/** Landingspagina voor campagnes (training). Zie README → "Campagnes". */
export default function LandingPage({ searchParams }: PageProps<"/[lang]/lp/training">) {
  return <CampaignLanding variant="training" searchParams={searchParams} />;
}
