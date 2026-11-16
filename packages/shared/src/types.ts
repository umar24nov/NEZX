/**
 * Shared API contract between the web app and the API.
 *
 * Keep this file framework-free: it is imported by React, Express, tests and
 * the Prisma seed script.
 */

export const ENQUIRY_MODES = ["ONLINE", "OFFLINE"] as const;
export type EnquiryMode = (typeof ENQUIRY_MODES)[number];

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_SECTIONS = ["WORK", "RESULT"] as const;
export type MediaSection = (typeof MEDIA_SECTIONS)[number];

export interface SiteConfigDto {
  phone: string;
  phoneHref: string;
  whatsapp: string;
  location: string;
  replyTime: string;
  formatChips: string[];
  resultsNote: string;
  whatsappGreeting: string;
}

export interface CourseDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  features: string[];
  sortOrder: number;
}

export interface ModuleDto {
  id: string;
  slug: string;
  title: string;
  items: string[];
  sortOrder: number;
}

export interface JourneyStepDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface AudienceDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface MediaDto {
  id: string;
  key: string;
  url: string;
  posterUrl: string | null;
  type: MediaType;
  alt: string;
  caption: string | null;
  stat: string | null;
  sortOrder: number;
}

export interface SitePayload {
  config: SiteConfigDto;
  courses: CourseDto[];
  modules: ModuleDto[];
  steps: JourneyStepDto[];
  audience: AudienceDto[];
  work: MediaDto[];
  results: MediaDto[];
}

export interface EnquiryDto {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  courseSlug: string | null;
  courseLabel: string;
  mode: EnquiryMode;
  message: string | null;
  status: EnquiryStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EnquiryStats {
  total: number;
  newCount: number;
  last7Days: number;
  byStatus: Record<EnquiryStatus, number>;
}

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
