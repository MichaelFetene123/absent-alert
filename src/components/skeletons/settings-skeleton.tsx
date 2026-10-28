import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-3 border-b border-border space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>

      {/* Card-Based Menu Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Icon Container + Badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <Skeleton className="size-10 rounded-lg shrink-0" />
                <Skeleton className="h-5 w-22 rounded-full" />
              </div>

              {/* Title, Subtitle, and Multi-line Description */}
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-48" />
                <div className="pt-1.5 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>

            {/* Bottom CTA Row */}
            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="size-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
