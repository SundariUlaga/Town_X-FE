import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

import { formatInr } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite + Leaflet default-icon path fix
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type PropertyMapViewProps = {
  properties: Property[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onOpenDetails?: (id: number) => void;
  className?: string;
};

function hasCoords(p: Property) {
  return (
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude)
  );
}

export function PropertyMapView({
  properties,
  selectedId,
  onSelect,
  onOpenDetails,
  className,
}: PropertyMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const mappable = useMemo(() => properties.filter(hasCoords), [properties]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const group = markersRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (mappable.length === 0) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }

    const bounds = L.latLngBounds([]);
    mappable.forEach((p) => {
      const lat = p.latitude as number;
      const lng = p.longitude as number;
      const marker = L.marker([lat, lng]);
      const title =
        p.property_type === "Commercial"
          ? `${p.commercial_subtype || p.apartment_type || "Commercial"}`
          : `${p.bhk_type} ${p.apartment_type}`;
      const price = formatInr(p.expected_price, { compact: true });
      marker.bindPopup(
        `<div style="min-width:140px">
          <strong>${title}</strong><br/>
          <span>${price}</span><br/>
          <span style="color:#666;font-size:12px">${p.locality}, ${p.city}</span>
        </div>`
      );
      marker.on("click", () => onSelect?.(p.id));
      marker.on("dblclick", () => onOpenDetails?.(p.id));
      group.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.18), { maxZoom: 14 });
    }
  }, [mappable, onSelect, onOpenDetails]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || selectedId == null) return;
    const selected = mappable.find((p) => p.id === selectedId);
    if (!selected) return;
    map.panTo([selected.latitude as number, selected.longitude as number], { animate: true });
  }, [selectedId, mappable]);

  return (
    <div className={cn("relative overflow-hidden rounded-card border border-border bg-card", className)}>
      <div ref={mapRef} className="h-full min-h-[420px] w-full" />
      {mappable.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[color:var(--bg-page)]/80 p-6 text-center">
          <div>
            <MapPin className="mx-auto mb-2 size-8 text-brand-500" />
            <p className="text-sm font-medium text-gray-900">Map pins unavailable</p>
            <p className="mt-1 text-xs text-gray-600">
              These listings don’t have coordinates yet. Switch to list view to browse them.
            </p>
          </div>
        </div>
      ) : (
        <p className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow-soft-sm">
          {mappable.length} of {properties.length} on map
        </p>
      )}
    </div>
  );
}

export default PropertyMapView;
