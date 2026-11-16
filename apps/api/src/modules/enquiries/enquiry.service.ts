import {
  enquiryApiSchema,
  FALLBACK_COURSE_LABEL,
  normalizePhone,
  type EnquiryDto,
} from "@nezx/shared";
import type { z } from "zod";

import type { Enquiry } from "../../generated/prisma/client.js";
import { ApiError } from "../../lib/api-error.js";
import { prisma } from "../../lib/prisma.js";

type ParsedEnquiry = z.infer<typeof enquiryApiSchema>;

export function toEnquiryDto(enquiry: Enquiry): EnquiryDto {
  return {
    id: enquiry.id,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    courseSlug: enquiry.courseSlug,
    courseLabel: enquiry.courseLabel,
    mode: enquiry.mode,
    message: enquiry.message,
    status: enquiry.status,
    adminNote: enquiry.adminNote,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

export async function createEnquiry(
  input: ParsedEnquiry,
  meta: { ipHash?: string; userAgent?: string },
): Promise<EnquiryDto> {
  const wantsCourse = input.courseSlug && input.courseSlug !== "unsure";

  const course = wantsCourse
    ? await prisma.course.findFirst({
        where: { slug: input.courseSlug, published: true },
        select: { slug: true, name: true },
      })
    : null;

  if (wantsCourse && !course) {
    throw new ApiError(400, "UNKNOWN_COURSE", "Choose a course from the list.");
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      name: input.name,
      phone: normalizePhone(input.phone),
      email: input.email ? input.email : null,
      courseSlug: course?.slug ?? null,
      courseLabel: course?.name ?? FALLBACK_COURSE_LABEL,
      mode: input.mode,
      message: input.message ? input.message : null,
      source: "website",
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
    },
  });

  return toEnquiryDto(enquiry);
}
