import {
  Waves,
  Dumbbell,
  Shield,
  Car,
  Zap,
  Droplets,
  Wifi,
  Wind,
  Flame,
  Trees,
  Building2,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const AMENITY_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /pool|swim/i, icon: Waves },
  { match: /gym|fitness/i, icon: Dumbbell },
  { match: /secur|cctv|guard/i, icon: Shield },
  { match: /park/i, icon: Car },
  { match: /power|backup|generator/i, icon: Zap },
  { match: /water/i, icon: Droplets },
  { match: /wifi|internet/i, icon: Wifi },
  { match: /ac|air.?cond/i, icon: Wind },
  { match: /gas|kitchen/i, icon: Flame },
  { match: /park(?!ing)|garden|green|landscape/i, icon: Trees },
  { match: /lift|elevator/i, icon: Building2 },
];

function iconForAmenity(name: string): LucideIcon {
  for (const row of AMENITY_ICONS) {
    if (row.match.test(name)) return row.icon;
  }
  return CheckCircle2;
}

type AmenityIconGridProps = {
  amenities: string[];
  className?: string;
};

export function AmenityIconGrid({ amenities, className }: AmenityIconGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3", className)}>
      {amenities.map((amenity) => {
        const Icon = iconForAmenity(amenity);
        return (
          <div
            key={amenity}
            className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 text-sm text-gray-800"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-white text-brand-600 shadow-soft-sm">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 leading-snug">{amenity}</span>
          </div>
        );
      })}
    </div>
  );
}

export default AmenityIconGrid;
