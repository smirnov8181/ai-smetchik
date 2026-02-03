export interface Estimate {
  id: string;
  user_id: string;
  status: "draft" | "processing" | "ready" | "error";
  input_type: "text" | "pdf" | "photo" | "mixed";
  input_text: string | null;
  input_data: NormalizedInput | null;
  result: EstimateResult | null;
  total_amount: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstimateFile {
  id: string;
  estimate_id: string;
  file_url: string;
  file_type: "pdf" | "image";
  original_name: string;
  created_at: string;
}

export interface PriceCatalogItem {
  id: string;
  category: string;
  work_name: string;
  unit: string;
  price_min: number;
  price_avg: number;
  price_max: number;
  region: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "business";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  estimates_used: number;
  estimates_limit: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

// AI Pipeline types

export interface RoomDescription {
  name: string;
  area_sqm: number;
  ceiling_height: number;
  works: string[];
}

export interface NormalizedInput {
  project_type: string;
  rooms: RoomDescription[];
  total_area_sqm: number;
  special_notes: string;
}

export interface WorkItem {
  category: string;
  work: string;
  unit: string;
  quantity: number;
  room: string;
}

export interface PricedWorkItem {
  category: string;
  work: string;
  unit: string;
  quantity: number;
  room: string;
  price_per_unit: number;
  material_cost: number;
  labor_cost: number;
  total: number;
}

export interface EstimateSection {
  category: string;
  items: PricedWorkItem[];
  subtotal: number;
}

export interface EstimateResult {
  sections: EstimateSection[];
  subtotal_labor: number;
  subtotal_materials: number;
  overhead: number;
  total: number;
  summary: string;
  confidence: "low" | "medium" | "high";
  caveats: string[];
}

// === Verification types (проверка сметы заказчиком) ===

export interface Verification {
  id: string;
  user_id: string;
  status: "draft" | "processing" | "ready" | "error";
  input_type: "text" | "pdf" | "photo" | "mixed";
  input_text: string | null;
  parsed_items: ContractorWorkItem[] | null;
  result: VerificationResult | null;
  total_contractor: number | null;
  total_market: number | null;
  overpay_amount: number | null;
  overpay_percent: number | null;
  is_paid: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorWorkItem {
  category: string;
  work: string;
  unit: string;
  quantity: number;
  contractor_price: number;
  contractor_total: number;
}

export type VerificationStatus = "ok" | "warning" | "overpay";

export interface VerifiedWorkItem {
  category: string;
  work: string;
  unit: string;
  quantity: number;
  contractor_price: number;
  contractor_total: number;
  market_min: number;
  market_avg: number;
  market_max: number;
  overpay_amount: number;
  overpay_percent: number;
  status: VerificationStatus;
}

export interface VerificationResult {
  items: VerifiedWorkItem[];
  total_contractor: number;
  total_market_avg: number;
  total_overpay: number;
  overpay_percent: number;
  summary: string;
  verdict: "fair" | "slightly_overpriced" | "overpriced" | "ripoff";
  recommendations: string[];
}
