import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../env.js";
import { ApiError } from "./api-error.js";

let client: S3Client | null = null;

export function isStorageConfigured(): boolean {
  return env.r2 !== null;
}

function getClient(): S3Client {
  if (!env.r2) {
    throw new ApiError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured on this environment.",
    );
  }

  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey,
    },
  });

  return client;
}

export function publicUrlFor(key: string): string {
  if (!env.r2) {
    throw new ApiError(503, "STORAGE_NOT_CONFIGURED", "File storage is not configured.");
  }
  return `${env.r2.publicBaseUrl}/${key}`;
}

export async function createPresignedUpload(options: {
  key: string;
  contentType: string;
  size: number;
  expiresIn?: number;
}): Promise<string> {
  const expiresIn = options.expiresIn ?? 600;

  const command = new PutObjectCommand({
    Bucket: env.r2?.bucket,
    Key: options.key,
    ContentType: options.contentType,
    ContentLength: options.size,
  });

  return getSignedUrl(getClient(), command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  if (!env.r2) return;

  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: env.r2.bucket,
        Key: key,
      }),
    );
  } catch {
    // Deleting the database row matters more than the orphaned object.
  }
}
