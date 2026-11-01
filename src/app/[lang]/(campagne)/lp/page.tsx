import { CampaignLanding, landingMetadata } from "@/components/campaign/CampaignLanding";

export function generateMetadata() {
  return landingMetadata("afvallen");
}

/** Landingspagina voor campagnes (afvallen). Zie README → "Campagnes". */
export default function LandingPage({ searchParams }: PageProps<"/[lang]/lp">) {
  return <CampaignLanding variant="afvallen" searchParams={searchParams} />;
}
