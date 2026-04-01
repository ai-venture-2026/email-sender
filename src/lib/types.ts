export interface Lead {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  reviews: number | null;
  hours: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  facebook: string | null;
  instagram: string | null;
  keyword: string | null;
  location: string | null;
  github_repo: string | null;
  live_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

export interface EmailRecord {
  id: string;
  lead_id: number;
  to_email: string;
  subject: string;
  body: string;
  status: "sent" | "failed";
  sent_at: string;
}
