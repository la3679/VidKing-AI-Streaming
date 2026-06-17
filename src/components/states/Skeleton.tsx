/**
 * Loading skeletons that mirror the real layouts (hero, rows, grids, details)
 * so the page doesn't reflow when content arrives.
 */

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const HeroSkeleton = () => (
  <div className="h-full w-full p-8 md:p-16 flex flex-col justify-end gap-6">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-16 md:h-24 w-2/3 rounded-2xl" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-4 pt-2">
      <Skeleton className="h-12 w-40 rounded-lg" />
      <Skeleton className="h-12 w-40 rounded-lg" />
    </div>
  </div>
);

export const CardSkeleton = ({ large = false }: { large?: boolean }) => (
  <Skeleton
    className={`flex-none rounded-2xl ${large ? 'w-48 md:w-56 aspect-[2/3]' : 'w-64 md:w-72 aspect-video'}`}
  />
);

export const RowSkeleton = ({ large = false }: { large?: boolean }) => (
  <div className="space-y-4" role="status" aria-label="Loading titles">
    <Skeleton className="h-4 w-48" />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} large={large} />
      ))}
    </div>
  </div>
);

export const GridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div
    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
    role="status"
    aria-label="Loading titles"
  >
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
    ))}
  </div>
);

export const DetailsSkeleton = () => (
  <div className="space-y-8" role="status" aria-label="Loading details">
    <Skeleton className="aspect-video w-full rounded-xl" />
    <div className="px-8 space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);
