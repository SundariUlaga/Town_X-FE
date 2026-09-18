export type NotificationType =
  | "search_match"
  | "new_property"
  | "listing_live"
  | "question_answered"
  | "ad_submitted"
  | "ad_approved"
  | "ad_rejected"
  | "ad_changes_requested"
  | "ad_published"
  | "property_approved"
  | "property_rejected"
  | "property_changes_requested"
  | "property_enquiry"
  | "advertisement_enquiry"
  | "enquiry_closed"
  | "testimonial_pending"
  | "property_submitted"
  | "property_resubmitted"
  | "ad_expired"
  | "admin_review_queue";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  property_id?: number | null;
  saved_search_id?: number | null;
  payload?: {
    path?: string;
    saved_search_label?: string;
    city?: string;
    question_id?: number;
  } | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: AppNotification[];
  total: number;
  unread_count: number;
}

export interface SavedSearchCriteria {
  q?: string;
  city?: string;
  locality?: string;
  property_for?: string;
  property_type?: string;
  bhk_type?: string;
  min_price?: number;
  max_price?: number;
  category?: string;
  furnishing_status?: string;
}

export interface SavedSearch {
  id: number;
  label: string;
  criteria: SavedSearchCriteria;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
