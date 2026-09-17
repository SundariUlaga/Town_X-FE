import TownLoader from "@/components/shared/TownLoader";

export function PageLoader({ label = "Loading Town-X" }: { label?: string }) {
  return <TownLoader size="lg" label={label} fullScreen />;
}

export default PageLoader;
