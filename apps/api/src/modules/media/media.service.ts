import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import {
  createMediaSchema,
  presignUploadSchema,
  updateMediaSchema,
  type PresignedUpload,
} from "@nezx/shared";
import type { z } from "zod";

import { env } from "../../env.js";
import { ApiError } from "../../lib/api-error.js";
import { prisma } from "../../lib/prisma.js";
import { createPresignedUpload, deleteObject, publicUrlFor } from "../../lib/r2.js";

type CreateInput = z.infer<typeof createMediaSchema>;
type UpdateInput = z.infer<typeof updateMediaSchema>;
type PresignInput = z.infer<typeof presignUploadSchema>;

export async function listAdminMedia() {
  return prisma.mediaAsset.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });
}

export async function createMedia(input: CreateInput) {
  if (!input.key.startsWith("uploads/")) {
    throw new ApiError(400, "INVALID_KEY", "Uploaded media must live under the uploads/ prefix.");
  }

  if (env.r2 && !input.url.startsWith(`${env.r2.publicBaseUrl}/`)) {
    throw new ApiError(400, "INVALID_URL", "The media URL must point at the configured R2 domain.");
  }

  const existing = await prisma.mediaAsset.findUnique({ where: { key: input.key } });
  if (existing) throw new ApiError(409, "DUPLICATE_MEDIA", "That file is already in the gallery.");

  let sortOrder = input.sortOrder;
  if (sortOrder === 0) {
    const aggregate = await prisma.mediaAsset.aggregate({
      where: { section: input.section },
      _max: { sortOrder: true },
    });
    sortOrder = (aggregate._max.sortOrder ?? 0) + 1;
  }

  return prisma.mediaAsset.create({
    data: {
      key: input.key,
      url: input.url,
      posterUrl: input.posterUrl ?? null,
      type: input.type,
      section: input.section,
      alt: input.alt,
      caption: input.caption ?? null,
      stat: input.stat ?? null,
      sortOrder,
    },
  });
}

export async function updateMedia(id: string, input: UpdateInput) {
  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "That media item no longer exists.");

  return prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(input.alt !== undefined ? { alt: input.alt } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
      ...(input.stat !== undefined ? { stat: input.stat } : {}),
      ...(input.posterUrl !== undefined ? { posterUrl: input.posterUrl } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
    },
  });
}

export async function deleteMedia(id: string) {
  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "That media item no longer exists.");

  await prisma.mediaAsset.delete({ where: { id } });
  if (existing.key.startsWith("uploads/")) {
    await deleteObject(existing.key);
  }
}

export async function presignUpload(input: PresignInput): Promise<PresignedUpload> {
  const extension = extname(input.filename).toLowerCase().slice(0, 12);
  const safeExtension = /^\.[a-z0-9]+$/.test(extension) ? extension : "";
  const key = `uploads/${input.section.toLowerCase()}/${randomUUID()}${safeExtension}`;

  const uploadUrl = await createPresignedUpload({
    key,
    contentType: input.contentType,
    size: input.size,
    expiresIn: 600,
  });

  return {
    uploadUrl,
    key,
    publicUrl: publicUrlFor(key),
    expiresIn: 600,
  };
}
