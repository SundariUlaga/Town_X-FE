import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useLocationContext } from "@/context/LocationContext";
import { useDistricts, useLocationSearch } from "@/hooks/useLocationOptions";
import {
  districtToSelected,
  searchResultToSelected,
  type LocationSearchHit,
} from "@/lib/locationUtils";
import { cn } from "@/lib/utils";
import { WithTooltip } from "@/components/ui/WithTooltip";

const TYPE_LABELS: Record<string, string> = {
  district: "District",
  taluk: "Taluk",
  village: "Zone",
};

function locationKey(item: { type: string; id: number }) {
  return `${item.type}-${item.id}`;
}

export default function NavbarLocationPicker() {
  const { selectedLocation, setSelectedLocation } = useLocationContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;

  const { data: districts = [], isLoading: districtsLoading } = useDistricts(open);
  const { data: searchResults = [], isLoading: searchLoading } = useLocationSearch(
    trimmedQuery,
    open && isSearching
  );

  const filteredDistricts = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    if (!needle || needle.length < 2) return districts;
    return districts.filter((district) => district.name.toLowerCase().includes(needle));
  }, [districts, trimmedQuery]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleSelectDistrict = (district: { id: number; name: string }) => {
    setSelectedLocation(districtToSelected(district));
    setOpen(false);
    setQuery("");
  };

  const handleSelectResult = (item: LocationSearchHit) => {
    setSelectedLocation(searchResultToSelected(item));
    setOpen(false);
    setQuery("");
  };

  const selectedKey = selectedLocation ? locationKey(selectedLocation) : null;

  const showEmpty = isSearching
    ? !searchLoading && searchResults.length === 0
    : filteredDistricts.length === 0;

  return (
    <div ref={rootRef} className="relative hidden sm:block shrink-0">
      <WithTooltip
        label={
          selectedLocation?.label
            ? `Location: ${selectedLocation.label}`
            : "Choose your search location"
        }
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex max-w-[120px] items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700 sm:max-w-[160px]"
          aria-label="Select location"
          aria-expanded={open}
        >
          <MapPin className="size-3 shrink-0" />
          <span className="truncate font-medium">
            {districtsLoading && !selectedLocation ? "Loading..." : selectedLocation?.name ?? "Location"}
          </span>
          <ChevronDown
            className={cn("size-3 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      </WithTooltip>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-card border border-gray-200 bg-white shadow-soft-lg"
          >
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="District, taluk, or village..."
                  className="w-full rounded-control border border-gray-200 py-1.5 pl-8 pr-2 text-xs focus:border-brand-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="border-b border-gray-100 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {isSearching ? "Search results" : "Districts"}
            </div>

            <ul className="max-h-56 overflow-y-auto py-1">
              {searchLoading || (districtsLoading && !isSearching) ? (
                <li className="px-3 py-2 text-xs text-gray-500">Searching...</li>
              ) : showEmpty ? (
                <li className="px-3 py-2 text-xs text-gray-400">
                  {isSearching
                    ? "No matching districts, taluks, or villages"
                    : "No districts found"}
                </li>
              ) : isSearching ? (
                searchResults.map((item) => (
                  <li key={locationKey(item)}>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(item)}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-brand-50",
                        selectedKey === locationKey(item) && "bg-brand-50"
                      )}
                    >
                      <MapPin className="mt-0.5 size-3 shrink-0 text-brand-500" />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-xs text-gray-800",
                            selectedKey === locationKey(item) && "font-semibold text-brand-700"
                          )}
                        >
                          {item.name}
                        </p>
                        <p className="truncate text-[10px] text-gray-500">{item.label}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
                        {TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </button>
                  </li>
                ))
              ) : (
                filteredDistricts.map((district) => (
                  <li key={district.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDistrict(district)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-brand-50",
                        selectedLocation?.type === "district" &&
                          selectedLocation.id === district.id &&
                          "bg-brand-50 font-semibold text-brand-700"
                      )}
                    >
                      {district.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
