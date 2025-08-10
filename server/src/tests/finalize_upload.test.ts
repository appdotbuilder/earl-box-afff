import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type FinalizeUploadInput } from '../schema';
import { finalizeUpload } from '../handlers/finalize_upload';
import { eq } from 'drizzle-orm';

// Test input for a typical file upload
const testInput: FinalizeUploadInput = {
  slug: 'test-file-12345',
  object_name: 'uploads/test-file-12345.pdf',
  size_bytes: 1024 * 500, // 500KB
  content_type: 'application/pdf'
};

describe('finalizeUpload', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should finalize file upload and create database record', async () => {
    const result = await finalizeUpload(testInput);

    // Validate returned file object
    expect(result.slug).toEqual('test-file-12345');
    expect(result.object_name).toEqual('uploads/test-file-12345.pdf');
    expect(result.size_bytes).toEqual(512000);
    expect(result.content_type).toEqual('application/pdf');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save file metadata to database', async () => {
    const result = await finalizeUpload(testInput);

    // Query database to verify the file was saved
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(files).toHaveLength(1);
    const savedFile = files[0];
    expect(savedFile.slug).toEqual('test-file-12345');
    expect(savedFile.object_name).toEqual('uploads/test-file-12345.pdf');
    expect(savedFile.size_bytes).toEqual(512000);
    expect(savedFile.content_type).toEqual('application/pdf');
    expect(savedFile.created_at).toBeInstanceOf(Date);
  });

  it('should handle different file types correctly', async () => {
    const imageInput: FinalizeUploadInput = {
      slug: 'image-abc123',
      object_name: 'uploads/image-abc123.jpg',
      size_bytes: 2048 * 1024, // 2MB
      content_type: 'image/jpeg'
    };

    const result = await finalizeUpload(imageInput);

    expect(result.slug).toEqual('image-abc123');
    expect(result.object_name).toEqual('uploads/image-abc123.jpg');
    expect(result.size_bytes).toEqual(2097152);
    expect(result.content_type).toEqual('image/jpeg');
  });

  it('should handle large files correctly', async () => {
    const largeFileInput: FinalizeUploadInput = {
      slug: 'large-video-xyz789',
      object_name: 'uploads/large-video-xyz789.mp4',
      size_bytes: 150 * 1024 * 1024, // 150MB
      content_type: 'video/mp4'
    };

    const result = await finalizeUpload(largeFileInput);

    expect(result.size_bytes).toEqual(157286400);
    expect(result.content_type).toEqual('video/mp4');
    expect(result.slug).toEqual('large-video-xyz789');
  });

  it('should create multiple file records without conflict', async () => {
    const input1: FinalizeUploadInput = {
      slug: 'file-one-123',
      object_name: 'uploads/file-one-123.txt',
      size_bytes: 1024,
      content_type: 'text/plain'
    };

    const input2: FinalizeUploadInput = {
      slug: 'file-two-456',
      object_name: 'uploads/file-two-456.txt',
      size_bytes: 2048,
      content_type: 'text/plain'
    };

    const result1 = await finalizeUpload(input1);
    const result2 = await finalizeUpload(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.slug).toEqual('file-one-123');
    expect(result2.slug).toEqual('file-two-456');

    // Verify both exist in database
    const allFiles = await db.select()
      .from(filesTable)
      .execute();

    expect(allFiles).toHaveLength(2);
  });

  it('should reject duplicate slugs', async () => {
    // Create first file
    await finalizeUpload(testInput);

    // Try to create another file with same slug
    const duplicateInput: FinalizeUploadInput = {
      slug: 'test-file-12345', // Same slug as testInput
      object_name: 'uploads/different-file.pdf',
      size_bytes: 1024,
      content_type: 'application/pdf'
    };

    await expect(finalizeUpload(duplicateInput)).rejects.toThrow(/unique/i);
  });
});