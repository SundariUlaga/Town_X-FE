export type LocationType = "district" | "taluk" | "village";

export type SelectedLocation = {
  id: number;
  name: string;
  type: LocationType;
  label: string;
  district_id?: number;
  district_name?: string;
  taluk_id?: number;
  taluk_name?: string;
  pincode?: string;
};

export type LocationSearchHit = {
  id: number;
  name: string;
  type: LocationType;
  label: string;
  district_id?: number;
  district_name?: string;
  taluk_id?: number;
  taluk_name?: string;
  pincode?: string;
};

export function districtToSelected(district: { id: number; name: string }): SelectedLocation {
  return {
    id: district.id,
    name: district.name,
    type: "district",
    label: district.name,
    district_id: district.id,
    district_name: district.name,
  };
}

export function searchResultToSelected(item: LocationSearchHit): SelectedLocation {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    label: item.label,
    district_id: item.district_id,
    district_name: item.district_name,
    taluk_id: item.taluk_id,
    taluk_name: item.taluk_name,
    pincode: item.pincode,
  };
}

export function isSelectedLocation(value: unknown): value is SelectedLocation {
  if (!value || typeof value !== "object") return false;
  const loc = value as SelectedLocation;
  return (
    typeof loc.id === "number" &&
    typeof loc.name === "string" &&
    (loc.type === "district" || loc.type === "taluk" || loc.type === "village") &&
    typeof loc.label === "string"
  );
}

/** District name used for property `city` API filter. */
export function getLocationCityFilter(location: SelectedLocation | null): string | undefined {
  if (!location) return undefined;
  if (location.type === "district") return location.name;
  return location.district_name;
}

export function buildPropertySearchQuery(
  location: SelectedLocation | null,
  query: string
): string {
  const trimmed = query.trim();
  if (!location?.name) return trimmed;
  if (!trimmed) return location.name;

  const lower = trimmed.toLowerCase();
  if (lower.includes(location.name.toLowerCase())) {
    return trimmed;
  }

  return `${trimmed} ${location.name}`;
}

export function locationDisplayName(location: SelectedLocation | null): string {
  if (!location) return "Select location";
  return location.name;
}
