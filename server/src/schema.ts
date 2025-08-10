import { z } from 'zod';

// File metadata schema
export const fileSchema = z.object({
  id: z.number(),
  slug: z.string(),
  object_name: z.string(),
  size_bytes: z.number().int(),
  content_type: z.string(),
  created_at: z.coerce.date()
});

export type File = z.infer<typeof fileSchema>;

// Input schema for requesting signed upload URL
export const requestUploadUrlInputSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number().int().positive().max(200 * 1024 * 1024) // 200MB limit
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlInputSchema>;

// Response schema for signed upload URL
export const signedUploadUrlResponseSchema = z.object({
  upload_url: z.string().url(),
  object_name: z.string(),
  slug: z.string()
});

export type SignedUploadUrlResponse = z.infer<typeof signedUploadUrlResponseSchema>;

// Input schema for finalizing upload
export const finalizeUploadInputSchema = z.object({
  slug: z.string(),
  object_name: z.string(),
  size_bytes: z.number().int().positive(),
  content_type: z.string()
});

export type FinalizeUploadInput = z.infer<typeof finalizeUploadInputSchema>;

// Input schema for getting file by slug
export const getFileBySlugInputSchema = z.object({
  slug: z.string()
});

export type GetFileBySlugInput = z.infer<typeof getFileBySlugInputSchema>;

// Response schema for file info with public URL
export const fileInfoResponseSchema = z.object({
  slug: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  public_url: z.string().url(),
  created_at: z.coerce.date()
});

export type FileInfoResponse = z.infer<typeof fileInfoResponseSchema>;

// Response schema for upload count
export const uploadCountResponseSchema = z.object({
  total_count: z.number().int().nonnegative()
});

export type UploadCountResponse = z.infer<typeof uploadCountResponseSchema>;