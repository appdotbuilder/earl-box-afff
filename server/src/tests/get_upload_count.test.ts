import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { getUploadCount } from '../handlers/get_upload_count';

describe('getUploadCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero count when no files exist', async () => {
    const result = await getUploadCount();

    expect(result.total_count).toEqual(0);
    expect(typeof result.total_count).toEqual('number');
  });

  it('should return correct count with one file', async () => {
    // Insert a test file
    await db.insert(filesTable)
      .values({
        slug: 'test-file-1',
        object_name: 'uploads/test-file-1.txt',
        size_bytes: 1024,
        content_type: 'text/plain'
      })
      .execute();

    const result = await getUploadCount();

    expect(result.total_count).toEqual(1);
  });

  it('should return correct count with multiple files', async () => {
    // Insert multiple test files
    await db.insert(filesTable)
      .values([
        {
          slug: 'test-file-1',
          object_name: 'uploads/test-file-1.txt',
          size_bytes: 1024,
          content_type: 'text/plain'
        },
        {
          slug: 'test-file-2',
          object_name: 'uploads/test-file-2.pdf',
          size_bytes: 2048,
          content_type: 'application/pdf'
        },
        {
          slug: 'test-file-3',
          object_name: 'uploads/test-file-3.jpg',
          size_bytes: 4096,
          content_type: 'image/jpeg'
        }
      ])
      .execute();

    const result = await getUploadCount();

    expect(result.total_count).toEqual(3);
  });

  it('should return correct count after files are added incrementally', async () => {
    // Start with zero files
    let result = await getUploadCount();
    expect(result.total_count).toEqual(0);

    // Add first file
    await db.insert(filesTable)
      .values({
        slug: 'incremental-file-1',
        object_name: 'uploads/incremental-file-1.txt',
        size_bytes: 512,
        content_type: 'text/plain'
      })
      .execute();

    result = await getUploadCount();
    expect(result.total_count).toEqual(1);

    // Add second file
    await db.insert(filesTable)
      .values({
        slug: 'incremental-file-2',
        object_name: 'uploads/incremental-file-2.txt',
        size_bytes: 1024,
        content_type: 'text/plain'
      })
      .execute();

    result = await getUploadCount();
    expect(result.total_count).toEqual(2);
  });

  it('should handle large number of files', async () => {
    // Insert 100 test files in batch
    const testFiles = Array.from({ length: 100 }, (_, index) => ({
      slug: `bulk-file-${index + 1}`,
      object_name: `uploads/bulk-file-${index + 1}.txt`,
      size_bytes: 1024 * (index + 1),
      content_type: 'text/plain'
    }));

    await db.insert(filesTable)
      .values(testFiles)
      .execute();

    const result = await getUploadCount();

    expect(result.total_count).toEqual(100);
  });

  it('should return consistent results on multiple calls', async () => {
    // Insert test files
    await db.insert(filesTable)
      .values([
        {
          slug: 'consistent-file-1',
          object_name: 'uploads/consistent-file-1.txt',
          size_bytes: 1024,
          content_type: 'text/plain'
        },
        {
          slug: 'consistent-file-2',
          object_name: 'uploads/consistent-file-2.txt',
          size_bytes: 2048,
          content_type: 'text/plain'
        }
      ])
      .execute();

    // Call multiple times and verify consistency
    const result1 = await getUploadCount();
    const result2 = await getUploadCount();
    const result3 = await getUploadCount();

    expect(result1.total_count).toEqual(2);
    expect(result2.total_count).toEqual(2);
    expect(result3.total_count).toEqual(2);
    expect(result1.total_count).toEqual(result2.total_count);
    expect(result2.total_count).toEqual(result3.total_count);
  });
});