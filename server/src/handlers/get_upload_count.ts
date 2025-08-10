import { db } from '../db';
import { filesTable } from '../db/schema';
import { count } from 'drizzle-orm';
import { type UploadCountResponse } from '../schema';

export const getUploadCount = async (): Promise<UploadCountResponse> => {
  try {
    // Query the database to count total number of files
    const result = await db.select({
      total_count: count(filesTable.id)
    })
    .from(filesTable)
    .execute();

    // Extract count from result (count returns number)
    const totalCount = Number(result[0].total_count);

    return {
      total_count: totalCount
    };
  } catch (error) {
    console.error('Failed to get upload count:', error);
    throw error;
  }
};