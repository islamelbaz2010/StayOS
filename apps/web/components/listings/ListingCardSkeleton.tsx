import { Skeleton } from "@/components/ui/Skeleton";

export function ListingCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-card bg-white shadow-card"
      aria-label="Loading listing"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
