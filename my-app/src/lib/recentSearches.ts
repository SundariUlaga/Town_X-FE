const STORAGE_KEY = "townx_recent_searches";
const MAX_ITEMS = 5;

export function getRecentSearches(scope: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return Array.isArray(parsed[scope]) ? parsed[scope].slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(scope: string, query: string): void {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const all = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  })();

  const existing = all[scope] ?? [];
  const next = [trimmed, ...existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_ITEMS
  );
  all[scope] = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearRecentSearches(scope: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as Record<string, string[]>;
    delete all[scope];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}
