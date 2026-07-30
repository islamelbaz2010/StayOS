import { Skeleton } from "@/components/ui/Skeleton";

export function ListingDetailSkeleton() {
  return (
    <article className="container mx-auto px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading listing details">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      <div className="mt-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>

        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />

        <Skeleton className="h-6 w-1/4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </article>
  );
}
