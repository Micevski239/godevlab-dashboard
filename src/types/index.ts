// ============================================
// Supabase / Dashboard-owned types
// ============================================

export type EmployeeRole = "admin" | "editor" | "worker";

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: EmployeeRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
  created_at: string;
  employee?: Employee;
}

export interface Post {
  id: string;
  url: string;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  employee?: Employee;
}

export type GoDevLabProjectStatus =
  | "backlog"
  | "active"
  | "review"
  | "completed";

export type GoDevLabProjectPriority = "low" | "medium" | "high";

export type GoDevLabTaskStatus = "todo" | "in_progress" | "done";

export type GoDevLabUpdateType = "progress" | "note" | "blocker" | "decision";

export interface GoDevLabPost {
  id: string;
  url: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  employee?: Employee;
}

export interface GoDevLabNote {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  employee?: Employee;
}

export interface GoDevLabProject {
  id: string;
  title: string;
  description: string | null;
  status: GoDevLabProjectStatus;
  priority: GoDevLabProjectPriority;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface GoDevLabProjectTask {
  id: string;
  project_id: string;
  title: string;
  details: string | null;
  status: GoDevLabTaskStatus;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface GoDevLabProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  details: string;
  update_type: GoDevLabUpdateType;
  created_by: string;
  created_at: string;
  employee?: Employee;
}

export type GoGevgelijaUpdateIdeaLane =
  | "next-patch"
  | "minor-release"
  | "future-lab";

export interface GoGevgelijaUpdatePhoto {
  id: string;
  update_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number | null;
  sort_order: number;
  created_at: string;
}

export interface GoGevgelijaUpdateHighlight {
  id: string;
  update_id: string;
  title: string;
  details: string;
  sort_order: number;
  created_at: string;
}

export interface GoGevgelijaUpdateIdea {
  id: string;
  update_id: string;
  lane: GoGevgelijaUpdateIdeaLane;
  title: string;
  details: string;
  sort_order: number;
  created_at: string;
}

export interface GoGevgelijaUpdateDraft {
  id: string;
  name: string;
  version: string | null;
  target_date: string | null;
  summary: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  photos?: GoGevgelijaUpdatePhoto[];
  highlights?: GoGevgelijaUpdateHighlight[];
  ideas?: GoGevgelijaUpdateIdea[];
}

// ============================================
// Django API content types (read-only)
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  image: string | null;
  applies_to: string;
}

export interface DjangoListing {
  id: number;
  title: string;
  description: string;
  address: string;
  category: Category | null;
  image: string | null;
  image_thumbnail: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  phone_number: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  google_maps_url: string | null;
}

export interface DjangoEvent {
  id: number;
  title: string;
  description: string;
  date_time: string;
  location: string;
  entry_price: string;
  category: Category | null;
  image: string | null;
  image_thumbnail: string | null;
  is_active: boolean;
  featured: boolean;
  join_count: number;
  created_at: string;
}

export interface DjangoPromotion {
  id: number;
  title: string;
  description: string;
  valid_until: string | null;
  category: Category | null;
  image: string | null;
  image_thumbnail: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================
// AI Content Generator types (carried over)
// ============================================

export interface Expectation {
  icon: string;
  text: string;
}

export interface EventContent {
  title: string;
  description: string;
  date_time: string;
  location: string;
  entry_price: string;
  age_limit: string;
  expectations: Expectation[];
  title_mk: string;
  description_mk: string;
  location_mk: string;
  entry_price_mk: string;
  age_limit_mk: string;
  expectations_mk: Expectation[];
  // Contact Information
  phone_number?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  google_maps_url?: string;
  images: string[];
}

export interface PromotionContent {
  title: string;
  description: string;
  tags: string[];
  title_mk: string;
  description_mk: string;
  tags_mk: string[];
  // Promotion Details
  valid_until: string;
  has_discount_code: boolean;
  discount_code: string;
  // Contact Information
  phone_number?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  address?: string;
  google_maps_url?: string;
  images: string[];
}

export interface ScrapeResult {
  caption: string;
  images: string[];
  platform: "instagram" | "facebook" | "unknown";
  author: string;
  imagesNote?: string;
}

export interface CompressedImage {
  name: string;
  originalSize: number;
  compressedSize: number;
  thumbnailSize: number;
  mainBase64: string;
  thumbnailBase64: string;
}

export type ProcessingStep =
  | "idle"
  | "scraping"
  | "processing"
  | "compressing"
  | "done"
  | "error";
