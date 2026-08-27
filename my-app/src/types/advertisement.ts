export type AdStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "EXPIRED";

export type AdType = "property" | "project" | "general";

export interface Advertisement {
  id: number;
  user_id?: number | null;
  property_id?: number | null;
  ad_type: AdType;
  title: string;
  location: string;
  property_type?: string | null;
  description?: string | null;
  price_text?: string | null;
  selling_point?: string | null;
  badge_text?: string | null;
  button_text: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  banner_url?: string | null;
  status: AdStatus;
  admin_notes?: string | null;
  created_by_admin: boolean;
  display_position: number;
  show_on_homepage: boolean;
  start_date?: string | null;
  end_date?: string | null;
  impressions: number;
  views: number;
  clicks: number;
  enquiries: number;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  submitter_name?: string | null;
}

export interface ApproveAdvertisementPayload {
  display_position: number;
  start_date: string;
  end_date: string;
  show_on_homepage: boolean;
}
