import { GuestLayout } from "@/components/layouts";
import { CategoryChips } from "@/components/search/CategoryChips";
import { FeaturedListings } from "@/components/search/FeaturedListings";
import { LandingSearchForm } from "@/components/search/LandingSearchForm";
import { PopularDestinations } from "@/components/search/PopularDestinations";
import { RecentlyViewed } from "@/components/search/RecentlyViewed";
import { TrustSignals } from "@/components/search/TrustSignals";

export default function LocalePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <GuestLayout>
      <LandingSearchForm locale={locale} />
      <CategoryChips locale={locale} />
      <PopularDestinations />
      <TrustSignals />
      <RecentlyViewed locale={locale} />
      <FeaturedListings />
    </GuestLayout>
  );
}
