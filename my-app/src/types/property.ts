/** Mirrors backend PropertyResponse (Town_X-BE/schemas.py) exactly — keep in sync. */
export interface PropertyImage {
  url: string;
  public_id: string;
  thumbnail_url?: string | null;
}

export interface ProjectDetails {
  id: number;
  property_id: number;
  rera_id?: string | null;
  builder_name?: string | null;
  builder_logo_url?: string | null;
  possession_date?: string | null;
  launch_date?: string | null;
  total_units?: number | null;
  available_units?: number | null;
  project_status?: string | null;
  total_towers?: number | null;
  total_floors?: number | null;
  price_starting_from?: number | null;
  price_per_sqft_range_min?: number | null;
  price_per_sqft_range_max?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  owner_id?: number | null;
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
  commercial_subtype?: string | null;
  frontage_ft?: number | null;
  floor_number?: number | null;
  washroom_count?: number | null;
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
  /** Present only for New Projects (1:1 ProjectDetails row). */
  project_details?: ProjectDetails | null;
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
 * Optional UI-only enrichment — scores/distances not stored in Property today.
 * Prefer `property.project_details` for builder/RERA/possession/units.
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
