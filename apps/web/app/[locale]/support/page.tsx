import { Suspense } from "react";

import { GuestLayout } from "@/components/layouts";
import { SupportPageClient } from "@/components/support/SupportPageClient";

export default function SupportPage() {
  return (
    <GuestLayout>
      <Suspense fallback={null}>
        <SupportPageClient />
      </Suspense>
    </GuestLayout>
  );
}
