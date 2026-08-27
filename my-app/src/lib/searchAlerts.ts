import notificationAPI from "@/services/notificationAPI";
import type { SavedSearchCriteria } from "@/types/notification";

/** Persist a search alert on the server (best-effort, silent on failure). */
export async function syncSearchAlert(
  criteria: SavedSearchCriteria,
  label?: string
): Promise<void> {
  const hasCriteria = Object.values(criteria).some(
    (value) => value !== undefined && value !== null && value !== ""
  );
  if (!hasCriteria) return;

  try {
    await notificationAPI.saveSearch(criteria, label);
  } catch (error) {
    console.warn("Could not save search alert:", error);
  }
}

export function criteriaFromFeedSearch({
  query,
  city,
  locality,
  propertyFor,
  propertyType,
  bhkType,
  minPrice,
  maxPrice,
  category,
  furnishingStatus,
}: {
  query?: string;
  city?: string;
  locality?: string;
  propertyFor?: string;
  propertyType?: string;
  bhkType?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  furnishingStatus?: string;
}): SavedSearchCriteria {
  return {
    q: query?.trim() || undefined,
    city: city?.trim() || undefined,
    locality: locality?.trim() || undefined,
    property_for: propertyFor || undefined,
    property_type: propertyType || undefined,
    bhk_type: bhkType || undefined,
    min_price: minPrice,
    max_price: maxPrice,
    category: category || undefined,
    furnishing_status: furnishingStatus || undefined,
  };
}
