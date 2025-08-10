import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileBySlugInput, type FileInfoResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFileBySlug(input: GetFileBySlugInput): Promise<FileInfoResponse> {
  try {
    // Query the database for file metadata using the slug
    const results = await db.select()
      .from(filesTable)
      .where(eq(filesTable.slug, input.slug))
      .execute();

    if (results.length === 0) {
      throw new Error('File not found');
    }

    const file = results[0];

    // Generate a public URL for the file in object storage
    // Using the object_name to construct the storage URL
    const public_url = `https://storage.example.com/${file.object_name}`;

    // Return file info with the public URL
    return {
      slug: file.slug,
      content_type: file.content_type,
      size_bytes: file.size_bytes,
      public_url,
      created_at: file.created_at
    };
  } catch (error) {
    console.error('Failed to get file by slug:', error);
    throw error;
  }
}