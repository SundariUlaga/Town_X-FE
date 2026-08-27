import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded-control skeleton-shimmer", className)} aria-hidden />;
}

type PropertyCardSkeletonProps = {
  className?: string;
  compact?: boolean;
};

export function PropertyCardSkeleton({ className, compact = false }: PropertyCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-soft-sm",
        className
      )}
      aria-hidden
    >
      <Bone className={cn("w-full", compact ? "h-40" : "h-44")} />
      <div className="flex flex-col gap-2.5 p-4">
        <Bone className="h-4 w-4/5" />
        <Bone className="h-6 w-1/3" />
        <Bone className="h-3 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Bone className="h-3 w-12" />
          <Bone className="h-3 w-12" />
          <Bone className="h-3 w-16" />
        </div>
        {!compact && <Bone className="mt-2 h-9 w-full" />}
      </div>
    </div>
  );
}

type PropertyCardSkeletonGridProps = {
  count?: number;
  compact?: boolean;
  className?: string;
};

export function PropertyCardSkeletonGrid({
  count = 6,
  compact = false,
  className,
}: PropertyCardSkeletonGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      role="status"
      aria-label="Loading properties"
    >
      {Array.from({ length: count }).map((_, index) => (
        <PropertyCardSkeleton key={index} compact={compact} />
      ))}
    </div>
  );
}

export default PropertyCardSkeleton;
