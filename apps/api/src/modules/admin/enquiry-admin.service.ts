import { type EnquiryStatus, type EnquiryDto, type EnquiryStats } from "@nezx/shared";
import type { z } from "zod";

import { enquiryListQuerySchema, type Paginated, type updateEnquirySchema } from "@nezx/shared";
import { Prisma } from "../../generated/prisma/client.js";
import { ApiError } from "../../lib/api-error.js";
import { prisma } from "../../lib/prisma.js";
import { toEnquiryDto } from "../enquiries/enquiry.service.js";

type ListQuery = z.infer<typeof enquiryListQuerySchema>;
type UpdateInput = z.infer<typeof updateEnquirySchema>;

export async function listEnquiries(query: ListQuery): Promise<Paginated<EnquiryDto>> {
  const where: Prisma.EnquiryWhereInput = {};

  if (query.status) where.status = query.status;

  if (query.q) {
    const term = query.q;
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
      { courseLabel: { contains: term, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return {
    items: items.map(toEnquiryDto),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getEnquiryStats(): Promise<EnquiryStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, newCount, last7Days, groups] = await Promise.all([
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.enquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const byStatus: Record<EnquiryStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    ENROLLED: 0,
    CLOSED: 0,
  };

  for (const group of groups) {
    byStatus[group.status] = group._count._all;
  }

  return { total, newCount, last7Days, byStatus };
}

export async function updateEnquiry(id: string, input: UpdateInput): Promise<EnquiryDto> {
  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "That enquiry no longer exists.");

  const updated = await prisma.enquiry.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
    },
  });

  return toEnquiryDto(updated);
}
