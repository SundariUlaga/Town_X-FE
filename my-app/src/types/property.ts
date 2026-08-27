/** Mirrors backend PropertyResponse (Town_X-BE/schemas.py) exactly — keep in sync. */
export interface PropertyImage {
  url: string;
  public_id: string;
  thumbnail_url?: string | null;
}

export interface Property {
  id: number;
  property_for: string;
  property_type: string;
  user_type: string;
  bhk_type: string;
  apartment_type: string;
  apartment_name?: string | null;
  locality: string;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  built_up_area?: number | null;
  carpet_area: number;
  floor: number;
  total_floors: number;
  property_age: string;
  furnishing_status: string;
  parking: number;
  bathrooms: number;
  balconies: number;
  expected_price: number;
  maintenance_charges?: number | null;
  security_deposit?: number | null;
  available_from: string;
  description?: string | null;
  amenities: string[];
  images: PropertyImage[];
  is_favourite: boolean;
  status?: string;
  admin_notes?: string | null;
  review_notes?: PropertyReviewNote[];
  verification_tier?: string;
  survey_parcel_number?: string | null;
  encumbrance_certificate_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyReviewNote {
  id: number;
  property_id: number;
  admin_user_id?: number | null;
  admin_name?: string | null;
  note_type: string;
  note: string;
  created_at: string;
}

/**
 * Enrichment fields Town Exchange doesn't compute or store yet — no
 * verification workflow, no builder/possession data entry, no geo-POI
 * provider, no market/yield model exists in the backend today. Deliberately
 * optional and NEVER defaulted to a fake value inside PropertyCard — a
 * badge/score/distance only renders when a real value is actually supplied.
 * This is the seam where that future backend work plugs in.
 */
export interface PropertyEnrichment {
  isVerified?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  propertyScore?: number; // 0-100
  investmentScore?: number; // 0-100
  rentalYieldPercent?: number;
  expectedAppreciationPercent?: number;
  facing?: string;
  builderName?: string;
  possessionStatus?: string;
  nearbyMetroKm?: number;
  nearbySchoolKm?: number;
  nearbyHospitalKm?: number;
}
