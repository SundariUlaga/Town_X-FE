import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { cn } from "@/lib/utils";

// Vite + Leaflet default-icon path fix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type PropertyLocalityMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  locality?: string | null;
  city?: string | null;
  className?: string;
};

/** Approximate locality pin — enough trust without exact street precision. */
export function PropertyLocalityMap({
  latitude,
  longitude,
  locality,
  city,
  className,
}: PropertyLocalityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  useEffect(() => {
    if (!hasCoords || !mapRef.current) return undefined;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([latitude!, longitude!], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    L.marker([latitude!, longitude!])
      .addTo(map)
      .bindPopup([locality, city].filter(Boolean).join(", ") || "Property locality");

    mapInstance.current = map;

    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapInstance.current = null;
    };
  }, [hasCoords, latitude, longitude, locality, city]);

  if (!hasCoords) return null;

  return (
    <div
      ref={mapRef}
      className={cn("h-56 w-full overflow-hidden rounded-card border border-gray-200 md:h-72", className)}
      role="img"
      aria-label={`Map near ${locality || city || "this property"}`}
    />
  );
}

export default PropertyLocalityMap;
