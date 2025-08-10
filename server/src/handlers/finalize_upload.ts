import { db } from '../db';
import { filesTable } from '../db/schema';
import { type FinalizeUploadInput, type File } from '../schema';

export const finalizeUpload = async (input: FinalizeUploadInput): Promise<File> => {
  try {
    // Insert file metadata into the database
    const result = await db.insert(filesTable)
      .values({
        slug: input.slug,
        object_name: input.object_name,
        size_bytes: input.size_bytes,
        content_type: input.content_type
      })
      .returning()
      .execute();

    // Return the complete file record
    return result[0];
  } catch (error) {
    console.error('File upload finalization failed:', error);
    throw error;
  }
};