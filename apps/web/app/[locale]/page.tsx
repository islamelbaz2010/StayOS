import { GuestLayout } from "@/components/layouts";
import { LandingSearchForm } from "@/components/search/LandingSearchForm";

export default function LocalePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <GuestLayout>
      <LandingSearchForm locale={locale} />
    </GuestLayout>
  );
}
