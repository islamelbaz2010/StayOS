import { GuestLayout } from "@/components/layouts";
import { FeaturedListings } from "@/components/search/FeaturedListings";
import { LandingSearchForm } from "@/components/search/LandingSearchForm";
import { TrustSignals } from "@/components/search/TrustSignals";

export default function LocalePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <GuestLayout>
      <LandingSearchForm locale={locale} />
      <TrustSignals />
      <FeaturedListings />
    </GuestLayout>
  );
}
