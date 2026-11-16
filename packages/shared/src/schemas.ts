import { z } from "zod";

import { ENQUIRY_MODES, ENQUIRY_STATUSES, MEDIA_SECTIONS, MEDIA_TYPES } from "./types.js";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * Accepts Indian mobile numbers with an optional +91 / 91 / 0 prefix, and
 * international numbers of 8-15 digits. Mirrors the prototype's behaviour.
 */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-().]/g, "");
  if (!digits) return false;
  if (/^\+?\d{8,15}$/.test(digits) === false) return false;
  if (digits.replace(/^\+/, "").length <= 10) {
    return /^(?:(?:91)|(?:0))?[6-9]\d{9}$/.test(digits.replace(/^\+/, ""));
  }
  return true;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+${digits.slice(1)}`;
  return `+${digits}`;
}

export const enquiryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "That name is too long."),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number.")
    .max(20, "Enter a valid phone number.")
    .refine(isValidPhone, "Enter a valid phone number."),
  email: z
    .string()
    .trim()
    .max(160, "That email address is too long.")
    .optional()
    .refine((value) => !value || EMAIL_RE.test(value), "Enter a valid email address."),
  courseSlug: z.string().trim().min(1, "Choose a course.").max(80),
  mode: z.enum(ENQUIRY_MODES),
  message: z.string().trim().max(1000, "Keep your message under 1000 characters.").optional(),
});

export const enquiryApiSchema = enquiryFormSchema.extend({
  /** Honeypot. Bots fill it; humans never see it. */
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(4096).optional(),
});

export type EnquiryFormInput = z.input<typeof enquiryFormSchema>;
export type EnquiryApiInput = z.input<typeof enquiryApiSchema>;

export const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export const enquiryModeSchema = z.enum(ENQUIRY_MODES);
export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const mediaSectionSchema = z.enum(MEDIA_SECTIONS);

export const enquiryListQuerySchema = z.object({
  status: enquiryStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type EnquiryListQuery = z.input<typeof enquiryListQuerySchema>;

export const updateEnquirySchema = z
  .object({
    status: enquiryStatusSchema.optional(),
    adminNote: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.adminNote !== undefined, {
    message: "Nothing to update.",
  });

export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;

export const idParamSchema = z.object({
  id: z.string().trim().min(1).max(120),
});

export const presignUploadSchema = z.object({
  filename: z.string().trim().min(1, "Choose a file.").max(200),
  contentType: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^(image|video)\//, "Only images and videos can be uploaded."),
  size: z.coerce
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024, "The maximum file size is 50 MB."),
  section: mediaSectionSchema.default("RESULT"),
});

export const createMediaSchema = z.object({
  key: z.string().trim().min(1).max(400),
  url: z.string().trim().min(1).max(1000),
  posterUrl: z.string().trim().max(1000).nullable().optional(),
  type: mediaTypeSchema,
  alt: z.string().trim().min(1, "Describe the media for screen readers.").max(300),
  caption: z.string().trim().max(300).nullable().optional(),
  stat: z.string().trim().max(40).nullable().optional(),
  section: mediaSectionSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateMediaSchema = createMediaSchema
  .omit({ key: true, url: true, type: true, section: true })
  .partial()
  .extend({
    published: z.boolean().optional(),
    posterUrl: z.string().trim().max(1000).nullable().optional(),
    caption: z.string().trim().max(300).nullable().optional(),
    stat: z.string().trim().max(40).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update." });

export const courseSlugSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});
