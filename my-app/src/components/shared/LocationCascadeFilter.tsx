import { useEffect, useState } from "react";

import LocationSearchSelect from "@/components/shared/LocationSearchSelect";
import { useDistricts, useTaluks, useVillages } from "@/hooks/useLocationOptions";
import { useLocationContext } from "@/context/LocationContext";
import {
  districtToSelected,
  type SelectedLocation,
} from "@/lib/locationUtils";
import { cn } from "@/lib/utils";

type LocationCascadeFilterProps = {
  className?: string;
  /** When true, changes write through to global location context immediately */
  syncToContext?: boolean;
};

/**
 * Compact District → Taluk → Zone cascade for filter panels.
 * Zone = village in the TN location hierarchy.
 */
export function LocationCascadeFilter({
  className,
  syncToContext = true,
}: LocationCascadeFilterProps) {
  const { selectedLocation, setSelectedLocation } = useLocationContext();
  const [districtId, setDistrictId] = useState("");
  const [talukId, setTalukId] = useState("");
  const [zoneId, setZoneId] = useState("");

  const { data: districts = [], isLoading: districtsLoading } = useDistricts();
  const { data: taluks = [], isLoading: taluksLoading } = useTaluks(
    districtId ? Number(districtId) : null
  );
  const { data: zones = [], isLoading: zonesLoading } = useVillages(
    talukId ? Number(talukId) : null
  );

  // Hydrate from navbar / global location
  useEffect(() => {
    if (!selectedLocation) {
      setDistrictId("");
      setTalukId("");
      setZoneId("");
      return;
    }
    if (selectedLocation.type === "district") {
      setDistrictId(String(selectedLocation.id));
      setTalukId("");
      setZoneId("");
      return;
    }
    if (selectedLocation.district_id) {
      setDistrictId(String(selectedLocation.district_id));
    }
    if (selectedLocation.type === "taluk") {
      setTalukId(String(selectedLocation.id));
      setZoneId("");
      return;
    }
    if (selectedLocation.taluk_id) {
      setTalukId(String(selectedLocation.taluk_id));
    }
    if (selectedLocation.type === "village") {
      setZoneId(String(selectedLocation.id));
    }
  }, [selectedLocation?.id, selectedLocation?.type]);

  const pushLocation = (next: SelectedLocation | null) => {
    if (syncToContext) setSelectedLocation(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Location
      </p>
      <div className="grid grid-cols-1 gap-2">
        <LocationSearchSelect
          label="District"
          options={districts}
          value={districtId}
          onChange={(district) => {
            setDistrictId(district ? String(district.id) : "");
            setTalukId("");
            setZoneId("");
            pushLocation(district ? districtToSelected(district) : null);
          }}
          placeholder="All districts"
          disabled={districtsLoading && districts.length === 0}
          loading={districtsLoading && districts.length === 0}
          emptyMessage="No districts found"
        />
        <LocationSearchSelect
          label="Taluk"
          options={taluks}
          value={talukId}
          onChange={(taluk) => {
            setTalukId(taluk ? String(taluk.id) : "");
            setZoneId("");
            if (!taluk) {
              const district = districts.find((d) => String(d.id) === districtId);
              pushLocation(district ? districtToSelected(district) : null);
              return;
            }
            const district = districts.find((d) => String(d.id) === districtId);
            pushLocation({
              id: taluk.id,
              name: taluk.name,
              type: "taluk",
              label: district ? `${taluk.name} · ${district.name}` : taluk.name,
              district_id: district?.id ?? (districtId ? Number(districtId) : undefined),
              district_name: district?.name,
              taluk_id: taluk.id,
              taluk_name: taluk.name,
            });
          }}
          placeholder={districtId ? "All taluks" : "Select district first"}
          disabled={!districtId}
          loading={taluksLoading && !!districtId && !taluks.length}
          emptyMessage="No taluks found"
        />
        <LocationSearchSelect
          label="Zone"
          options={zones}
          value={zoneId}
          onChange={(zone) => {
            setZoneId(zone ? String(zone.id) : "");
            if (!zone) {
              const taluk = taluks.find((t) => String(t.id) === talukId);
              const district = districts.find((d) => String(d.id) === districtId);
              if (taluk) {
                pushLocation({
                  id: taluk.id,
                  name: taluk.name,
                  type: "taluk",
                  label: district ? `${taluk.name} · ${district.name}` : taluk.name,
                  district_id: district?.id ?? (districtId ? Number(districtId) : undefined),
                  district_name: district?.name,
                  taluk_id: taluk.id,
                  taluk_name: taluk.name,
                });
              }
              return;
            }
            const taluk = taluks.find((t) => String(t.id) === talukId);
            const district = districts.find((d) => String(d.id) === districtId);
            const next: SelectedLocation = {
              id: zone.id,
              name: zone.name,
              type: "village",
              label: [zone.name, taluk?.name, district?.name].filter(Boolean).join(" · "),
              district_id: district?.id ?? (districtId ? Number(districtId) : undefined),
              district_name: district?.name,
              taluk_id: taluk?.id ?? (talukId ? Number(talukId) : undefined),
              taluk_name: taluk?.name,
            };
            if ("pincode" in zone && zone.pincode) {
              next.pincode = String(zone.pincode);
            }
            pushLocation(next);
          }}
          placeholder={talukId ? "All zones" : "Select taluk first"}
          disabled={!talukId}
          loading={zonesLoading && !!talukId && !zones.length}
          emptyMessage="No zones found"
        />
      </div>
      {selectedLocation ? (
        <button
          type="button"
          onClick={() => {
            setDistrictId("");
            setTalukId("");
            setZoneId("");
            pushLocation(null);
          }}
          className="text-[11px] font-medium text-brand-700 hover:underline"
        >
          Clear location
        </button>
      ) : null}
    </div>
  );
}

export default LocationCascadeFilter;
