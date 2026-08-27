const STORAGE_KEY = "townx_recently_viewed";
const MAX_ITEMS = 10;

export function getRecentlyViewedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number").slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(propertyId: number): void {
  const ids = getRecentlyViewedIds().filter((id) => id !== propertyId);
  ids.unshift(propertyId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
}
