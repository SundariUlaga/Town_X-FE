import { cn } from "@/lib/utils";
import { HomeFinanceTools } from "@/components/home/HomeFinanceTools";
import { HomeNewsRail } from "@/components/home/HomeNewsRail";

type HomeInsightsRailProps = {
  className?: string;
};

export function HomeInsightsRail({ className }: HomeInsightsRailProps) {
  return (
    <aside className={cn("space-y-4 lg:sticky lg:top-20", className)}>
      <HomeNewsRail />
      <HomeFinanceTools />
    </aside>
  );
}

export default HomeInsightsRail;
