import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileBySlugInput } from '../schema';
import { getFileBySlug } from '../handlers/get_file_by_slug';

describe('getFileBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve file by slug successfully', async () => {
    // Create test file record
    const testFile = {
      slug: 'test-file-123',
      object_name: 'uploads/test-file-123.pdf',
      size_bytes: 2048,
      content_type: 'application/pdf'
    };

    const insertResult = await db.insert(filesTable)
      .values(testFile)
      .returning()
      .execute();

    const createdFile = insertResult[0];

    // Test the handler
    const input: GetFileBySlugInput = {
      slug: 'test-file-123'
    };

    const result = await getFileBySlug(input);

    // Validate response structure and values
    expect(result.slug).toEqual('test-file-123');
    expect(result.content_type).toEqual('application/pdf');
    expect(result.size_bytes).toEqual(2048);
    expect(result.public_url).toEqual('https://storage.example.com/uploads/test-file-123.pdf');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdFile.created_at);
  });

  it('should throw error when file does not exist', async () => {
    const input: GetFileBySlugInput = {
      slug: 'non-existent-file'
    };

    await expect(getFileBySlug(input)).rejects.toThrow(/file not found/i);
  });

  it('should handle different content types correctly', async () => {
    // Create test file with image content type
    const imageFile = {
      slug: 'test-image-456',
      object_name: 'images/photo.jpg',
      size_bytes: 1024000,
      content_type: 'image/jpeg'
    };

    await db.insert(filesTable)
      .values(imageFile)
      .returning()
      .execute();

    const input: GetFileBySlugInput = {
      slug: 'test-image-456'
    };

    const result = await getFileBySlug(input);

    expect(result.slug).toEqual('test-image-456');
    expect(result.content_type).toEqual('image/jpeg');
    expect(result.size_bytes).toEqual(1024000);
    expect(result.public_url).toEqual('https://storage.example.com/images/photo.jpg');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should generate correct public URL from object_name', async () => {
    // Test different object name patterns
    const testFiles = [
      {
        slug: 'doc-1',
        object_name: 'documents/2024/report.docx',
        size_bytes: 5000,
        content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      {
        slug: 'video-2',
        object_name: 'media/videos/presentation.mp4',
        size_bytes: 50000000,
        content_type: 'video/mp4'
      }
    ];

    for (const fileData of testFiles) {
      await db.insert(filesTable)
        .values(fileData)
        .returning()
        .execute();

      const input: GetFileBySlugInput = {
        slug: fileData.slug
      };

      const result = await getFileBySlug(input);

      expect(result.public_url).toEqual(`https://storage.example.com/${fileData.object_name}`);
      expect(result.slug).toEqual(fileData.slug);
      expect(result.content_type).toEqual(fileData.content_type);
      expect(result.size_bytes).toEqual(fileData.size_bytes);
    }
  });

  it('should preserve all file metadata fields', async () => {
    // Create test file with all required fields
    const completeFile = {
      slug: 'complete-test-file',
      object_name: 'files/complete/test.txt',
      size_bytes: 256,
      content_type: 'text/plain'
    };

    const insertResult = await db.insert(filesTable)
      .values(completeFile)
      .returning()
      .execute();

    const createdFile = insertResult[0];

    const input: GetFileBySlugInput = {
      slug: 'complete-test-file'
    };

    const result = await getFileBySlug(input);

    // Verify all fields are correctly mapped
    expect(result).toEqual({
      slug: createdFile.slug,
      content_type: createdFile.content_type,
      size_bytes: createdFile.size_bytes,
      public_url: `https://storage.example.com/${createdFile.object_name}`,
      created_at: createdFile.created_at
    });

    // Verify database ID is not exposed in response
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('object_name');
  });
});