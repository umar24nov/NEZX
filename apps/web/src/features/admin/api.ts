import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  EnquiryDto,
  EnquiryStats,
  EnquiryStatus,
  MediaSection,
  MediaType,
  Paginated,
  PresignedUpload,
  UpdateEnquiryInput,
} from "@nezx/shared";

import { apiFetch, ApiError } from "@/lib/api";
import { siteQueryKey } from "@/features/site/use-site";

export interface AdminMedia {
  id: string;
  key: string;
  url: string;
  posterUrl: string | null;
  type: MediaType;
  section: MediaSection;
  alt: string;
  caption: string | null;
  stat: string | null;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryFilters {
  status: EnquiryStatus | "ALL";
  q: string;
  page: number;
  pageSize: number;
}

export const adminKeys = {
  enquiries: (filters: EnquiryFilters) => ["admin", "enquiries", filters] as const,
  stats: ["admin", "enquiries", "stats"] as const,
  media: ["admin", "media"] as const,
};

export function useAdminEnquiries(filters: EnquiryFilters) {
  return useQuery({
    queryKey: adminKeys.enquiries(filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.q.trim()) params.set("q", filters.q.trim());

      return apiFetch<Paginated<EnquiryDto>>(`/api/admin/enquiries?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useEnquiryStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => apiFetch<EnquiryStats>("/api/admin/enquiries/stats"),
  });
}

export function useUpdateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEnquiryInput }) =>
      apiFetch<EnquiryDto>(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    },
  });
}

export function useAdminMedia() {
  return useQuery({
    queryKey: adminKeys.media,
    queryFn: () => apiFetch<{ items: AdminMedia[] }>("/api/admin/media").then((data) => data.items),
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        alt?: string;
        caption?: string | null;
        stat?: string | null;
        published?: boolean;
        sortOrder?: number;
      };
    }) =>
      apiFetch<AdminMedia>(`/api/admin/media/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.media });
      void queryClient.invalidateQueries({ queryKey: siteQueryKey });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/admin/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.media });
      void queryClient.invalidateQueries({ queryKey: siteQueryKey });
    },
  });
}

export interface UploadMediaInput {
  file: File;
  alt: string;
  caption?: string;
  stat?: string;
  section: MediaSection;
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      const presign = await apiFetch<PresignedUpload>("/api/admin/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          filename: input.file.name,
          contentType: input.file.type,
          size: input.file.size,
          section: input.section,
        }),
      });

      let upload: Response;
      try {
        upload = await fetch(presign.uploadUrl, {
          method: "PUT",
          body: input.file,
          headers: { "Content-Type": input.file.type },
        });
      } catch {
        throw new ApiError(0, "UPLOAD_FAILED", "Could not upload the file to storage.");
      }

      if (!upload.ok) {
        throw new ApiError(0, "UPLOAD_FAILED", "Cloudflare R2 rejected the upload.");
      }

      return apiFetch<AdminMedia>("/api/admin/media", {
        method: "POST",
        body: JSON.stringify({
          key: presign.key,
          url: presign.publicUrl,
          type: input.file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
          alt: input.alt,
          caption: input.caption || null,
          stat: input.stat || null,
          section: input.section,
          sortOrder: 0,
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.media });
      void queryClient.invalidateQueries({ queryKey: siteQueryKey });
    },
  });
}
