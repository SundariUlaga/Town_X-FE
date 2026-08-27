import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("rounded-control skeleton-shimmer", className)} aria-hidden />;
}

export function PropertyDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6" role="status" aria-label="Loading property details">
      <Bone className="aspect-[16/10] w-full rounded-card" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Bone className="h-8 w-2/3" />
          <Bone className="h-6 w-1/4" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-16" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Bone className="h-48 rounded-card" />
          <Bone className="h-32 rounded-card" />
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailsSkeleton;
