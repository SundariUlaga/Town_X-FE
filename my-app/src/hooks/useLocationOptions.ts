import { useQuery } from "@tanstack/react-query";

import { locationAPI } from "@/services/api";

export const locationQueryKeys = {
  districts: ["locations", "districts"] as const,
  taluks: (districtId: number) => ["locations", "taluks", districtId] as const,
  villages: (talukId: number) => ["locations", "villages", talukId] as const,
  search: (query: string) => ["locations", "search", query] as const,
};

export function useDistricts(enabled = true) {
  return useQuery({
    queryKey: locationQueryKeys.districts,
    queryFn: () => locationAPI.getDistricts(),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTaluks(districtId: number | null | undefined) {
  const id = districtId ? Number(districtId) : 0;
  return useQuery({
    queryKey: locationQueryKeys.taluks(id),
    queryFn: () => locationAPI.getTaluks(id),
    enabled: id > 0,
    staleTime: 30 * 60 * 1000,
  });
}

export function useVillages(talukId: number | null | undefined) {
  const id = talukId ? Number(talukId) : 0;
  return useQuery({
    queryKey: locationQueryKeys.villages(id),
    queryFn: () => locationAPI.getVillages(id),
    enabled: id > 0,
    staleTime: 15 * 60 * 1000,
  });
}

export function useLocationSearch(query: string, enabled = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: locationQueryKeys.search(trimmed),
    queryFn: ({ signal }) =>
      locationAPI.search(trimmed, 20, signal),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
