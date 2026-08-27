import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, Camera, Eye, Megaphone, TrendingUp } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsResponse {
  properties: { total: number };
  stories: { total_stories: number; active_stories: number; total_views: number };
}

interface CategoryStatsResponse {
  categories: Record<string, number>;
  total: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["admin-stats"],
    queryFn: () => propertyAPI.getStats(),
  });

  const { data: categoryStats, isLoading: categoryLoading } = useQuery<CategoryStatsResponse>({
    queryKey: ["admin-category-stats"],
    queryFn: () => propertyAPI.getCategoryStats(),
  });

  return (
    <DashboardShell title="Platform overview" subtitle="Live metrics across all listings and stories">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total properties" value={statsLoading ? "…" : stats?.properties.total ?? 0} icon={Building2} />
        <MetricCard label="Active stories" value={statsLoading ? "…" : stats?.stories.active_stories ?? 0} icon={Camera} />
        <MetricCard label="Total story views" value={statsLoading ? "…" : stats?.stories.total_views ?? 0} icon={Eye} />
        <MetricCard label="Total stories posted" value={statsLoading ? "…" : stats?.stories.total_stories ?? 0} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listings by category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !categoryStats || categoryStats.total === 0 ? (
            <p className="text-sm text-muted-foreground">No properties listed yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryStats.categories).map(([category, count]) => {
                const pct = categoryStats.total > 0 ? Math.round((count / categoryStats.total) * 100) : 0;
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-foreground">{category}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Advertisements</CardTitle>
          <Link
            to="/admin/advertisements"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Megaphone className="size-4" />
            Manage ads
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Review user submissions, schedule homepage slider banners, and track ad performance.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
