import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  districtToSelected,
  isSelectedLocation,
  locationDisplayName,
  type SelectedLocation,
} from "@/lib/locationUtils";
import { configAPI } from "@/services/configAPI";
import { locationAPI } from "@/services/api";

type District = {
  id: number;
  name: string;
};

type LocationContextValue = {
  selectedLocation: SelectedLocation | null;
  setSelectedLocation: (location: SelectedLocation | null) => void;
  districts: District[];
  loading: boolean;
  locationLabel: string;
};

const STORAGE_KEY = "townx_selected_location";

const LocationContext = createContext<LocationContextValue | null>(null);

export type { SelectedLocation };

export function LocationProvider({ children }: { children: ReactNode }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedLocation, setSelectedLocationState] = useState<SelectedLocation | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const setSelectedLocation = useCallback((location: SelectedLocation | null) => {
    setSelectedLocationState(location);
    if (location) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const districtList = await locationAPI.getDistricts();
        if (cancelled) return;

        setDistricts(districtList);

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);
            if (isSelectedLocation(parsed)) {
              setSelectedLocationState(parsed);
              return;
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }

        let defaultId = 568;
        try {
          const config = await configAPI.getLandingConfigCached();
          if (config?.defaultLocation?.id) {
            defaultId = config.defaultLocation.id;
          }
        } catch {
          // fall back to Chennai
        }

        const fallback =
          districtList.find((district) => district.id === defaultId) ?? districtList[0];

        if (fallback) {
          setSelectedLocationState(districtToSelected(fallback));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const locationLabel = locationDisplayName(selectedLocation);

  const value = useMemo(
    () => ({
      selectedLocation,
      setSelectedLocation,
      districts,
      loading,
      locationLabel,
    }),
    [selectedLocation, setSelectedLocation, districts, loading, locationLabel]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within LocationProvider");
  }
  return context;
}
