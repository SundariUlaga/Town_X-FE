import { MapPin } from "lucide-react";

import LocationSearchSelect from "@/components/shared/LocationSearchSelect";
import LocationSearchInput from "@/components/shared/LocationSearchInput";
import { useDistricts, useTaluks, useVillages } from "@/hooks/useLocationOptions";
import type { SelectedLocation } from "@/lib/locationUtils";
import { cn } from "@/lib/utils";
import { requiredMark } from "@/lib/statusStyles";
import { getRecentSearches, addRecentSearch } from "@/lib/recentSearches";

export type CascadingLocationHandlers = {
  selectedDistrictId: string;
  selectedTalukId: string;
  selectedVillageId: string;
  onDistrictSelect: (district: { id: number; name: string } | null) => void;
  onTalukSelect: (taluk: { id: number; name: string } | null) => void;
  onVillageSelect: (village: { id: number; name: string; pincode?: string } | null) => void;
  locationError?: string | null;
};

type CascadingProps = {
  mode: "cascading";
} & CascadingLocationHandlers;

type FreetextProps = {
  mode: "freetext";
  value: string;
  onChange: (value: string) => void;
  onSelectLocation?: (item: { name: string }) => void;
  onSubmit?: () => void;
  placeholder?: string;
  recentScope?: string;
  className?: string;
};

type DisplayProps = {
  mode: "display";
  location: SelectedLocation | null;
  className?: string;
};

export type LocationPickerProps = CascadingProps | FreetextProps | DisplayProps;

function CascadingLocationPicker({
  selectedDistrictId,
  selectedTalukId,
  selectedVillageId,
  onDistrictSelect,
  onTalukSelect,
  onVillageSelect,
  locationError,
}: CascadingLocationHandlers) {
  const { data: districts = [], isLoading: districtsLoading } = useDistricts();
  const { data: taluks = [], isLoading: taluksLoading } = useTaluks(
    selectedDistrictId ? Number(selectedDistrictId) : null
  );
  const { data: villages = [], isLoading: villagesLoading } = useVillages(
    selectedTalukId ? Number(selectedTalukId) : null
  );

  return (
    <div className="space-y-2">
      {locationError ? (
        <p className="rounded-control border border-status-error/25 bg-status-error-bg px-3 py-2 text-xs text-status-error">
          {locationError}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <LocationSearchSelect
          label="District"
          required
          options={districts}
          value={selectedDistrictId}
          onChange={onDistrictSelect}
          placeholder="Search district"
          disabled={districtsLoading && districts.length === 0}
          loading={districtsLoading && districts.length === 0}
          emptyMessage="No districts found"
        />
        <LocationSearchSelect
          label="Taluk"
          required
          options={taluks}
          value={selectedTalukId}
          onChange={onTalukSelect}
          placeholder={selectedDistrictId ? "Search taluk" : "Select district first"}
          disabled={!selectedDistrictId}
          loading={taluksLoading && !!selectedDistrictId && !taluks.length}
          emptyMessage="No taluks found"
        />
        <LocationSearchSelect
          label="Village"
          required
          options={villages}
          value={selectedVillageId}
          onChange={onVillageSelect}
          placeholder={selectedTalukId ? "Search village" : "Select taluk first"}
          disabled={!selectedTalukId}
          loading={villagesLoading && !!selectedTalukId && !villages.length}
          emptyMessage="No villages found"
          getOptionLabel={(village) =>
            village.pincode ? `${village.name} (${village.pincode})` : village.name
          }
        />
      </div>
    </div>
  );
}

function FreetextLocationPicker({
  value,
  onChange,
  onSelectLocation,
  onSubmit,
  placeholder = "Search location, type, keyword...",
  recentScope = "feed",
  className = "",
}: Omit<FreetextProps, "mode">) {
  const recent = getRecentSearches(recentScope);
  const showRecent = !value.trim() && recent.length > 0;

  return (
    <div className={className}>
      <LocationSearchInput
        value={value}
        onChange={onChange}
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim().length >= 2) addRecentSearch(recentScope, value);
          onSubmit?.();
        }}
        onSelectLocation={(item) => {
          addRecentSearch(recentScope, item.name);
          onSelectLocation?.(item);
        }}
        placeholder={placeholder}
      />
      {showRecent ? (
        <div className="mt-2 rounded-control border border-border bg-card px-2 py-1">
          <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Recent searches
          </p>
          <ul>
            {recent.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  className="w-full rounded-control px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                  onClick={() => onChange(term)}
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DisplayLocationChip({
  location,
  className,
}: {
  location: SelectedLocation | null;
  className?: string;
}) {
  if (!location) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full bg-status-pending-bg px-2.5 py-1 text-xs font-medium text-status-pending",
        className
      )}
      title={location.label}
    >
      <MapPin className="size-3 shrink-0" />
      <span className="truncate">{location.name}</span>
    </span>
  );
}

export function LocationPicker(props: LocationPickerProps) {
  if (props.mode === "cascading") {
    const { mode: _mode, ...rest } = props;
    return <CascadingLocationPicker {...rest} />;
  }
  if (props.mode === "freetext") {
    const { mode: _mode, ...rest } = props;
    return <FreetextLocationPicker {...rest} />;
  }
  const { mode: _mode, location, className } = props;
  return <DisplayLocationChip location={location} className={className} />;
}

export { requiredMark };

export default LocationPicker;
