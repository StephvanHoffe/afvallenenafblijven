import { CampaignLanding, landingMetadata } from "@/components/campaign/CampaignLanding";

export function generateMetadata() {
  return landingMetadata("voeding");
}

/** Landingspagina voor campagnes (voeding). Zie README → "Campagnes". */
export default function LandingPage({ searchParams }: PageProps<"/[lang]/lp/voeding">) {
  return <CampaignLanding variant="voeding" searchParams={searchParams} />;
}
