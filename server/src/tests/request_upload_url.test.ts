import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type RequestUploadUrlInput } from '../schema';
import { requestUploadUrl } from '../handlers/request_upload_url';

// Test inputs
const basicInput: RequestUploadUrlInput = {
  filename: 'test-document.pdf',
  content_type: 'application/pdf',
  size_bytes: 1048576 // 1MB
};

const imageInput: RequestUploadUrlInput = {
  filename: 'profile-photo.jpg',
  content_type: 'image/jpeg',
  size_bytes: 2097152 // 2MB
};

const specialCharsInput: RequestUploadUrlInput = {
  filename: 'file with spaces & special chars!.txt',
  content_type: 'text/plain',
  size_bytes: 1024
};

const maxSizeInput: RequestUploadUrlInput = {
  filename: 'large-video.mp4',
  content_type: 'video/mp4',
  size_bytes: 200 * 1024 * 1024 // 200MB (max allowed)
};

describe('requestUploadUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate upload URL for basic file', async () => {
    const result = await requestUploadUrl(basicInput);

    // Validate response structure
    expect(result.upload_url).toBeDefined();
    expect(result.object_name).toBeDefined();
    expect(result.slug).toBeDefined();
    
    // Validate URL format
    expect(result.upload_url).toMatch(/^https:\/\/storage\.example\.com\/upload\?/);
    expect(result.upload_url).toContain('object=');
    expect(result.upload_url).toContain('expires=');
    expect(result.upload_url).toContain('signature=');
    expect(result.upload_url).toContain('content_type=');
    expect(result.upload_url).toContain('size=1048576');
    
    // Validate slug format (timestamp-uuid format)
    expect(result.slug).toMatch(/^\d+-[a-f0-9]{8}$/);
    
    // Validate object name format
    expect(result.object_name).toMatch(/^uploads\/\d+\/[a-f0-9-]+\/test-document\.pdf$/);
  });

  it('should generate unique identifiers for each request', async () => {
    const result1 = await requestUploadUrl(basicInput);
    const result2 = await requestUploadUrl(basicInput);

    // All identifiers should be unique
    expect(result1.slug).not.toEqual(result2.slug);
    expect(result1.object_name).not.toEqual(result2.object_name);
    expect(result1.upload_url).not.toEqual(result2.upload_url);
  });

  it('should handle image files correctly', async () => {
    const result = await requestUploadUrl(imageInput);

    expect(result.upload_url).toContain('content_type=image%2Fjpeg');
    expect(result.upload_url).toContain('size=2097152');
    expect(result.object_name).toContain('profile-photo.jpg');
  });

  it('should sanitize filenames with special characters', async () => {
    const result = await requestUploadUrl(specialCharsInput);

    // Object name should have sanitized filename
    expect(result.object_name).toMatch(/file_with_spaces___special_chars_\.txt$/);
    expect(result.object_name).not.toContain(' ');
    expect(result.object_name).not.toContain('&');
    expect(result.object_name).not.toContain('!');
  });

  it('should handle maximum file size', async () => {
    const result = await requestUploadUrl(maxSizeInput);

    expect(result.upload_url).toContain(`size=${200 * 1024 * 1024}`);
    expect(result.object_name).toContain('large-video.mp4');
  });

  it('should handle files without extensions', async () => {
    const noExtInput: RequestUploadUrlInput = {
      filename: 'README',
      content_type: 'text/plain',
      size_bytes: 512
    };

    const result = await requestUploadUrl(noExtInput);

    expect(result.object_name).toMatch(/\/README$/);
    expect(result.object_name).not.toContain('.undefined');
  });

  it('should generate valid expiry timestamps', async () => {
    const before = Date.now();
    const result = await requestUploadUrl(basicInput);
    const after = Date.now() + (60 * 60 * 1000); // 1 hour later

    // Extract expiry from URL
    const urlMatch = result.upload_url.match(/expires=(\d+)/);
    expect(urlMatch).toBeTruthy();
    
    const expiryTime = parseInt(urlMatch![1]);
    expect(expiryTime).toBeGreaterThan(before + (55 * 60 * 1000)); // At least 55 minutes from now
    expect(expiryTime).toBeLessThanOrEqual(after); // Not more than 1 hour from now
  });

  it('should include all required URL parameters', async () => {
    const result = await requestUploadUrl(basicInput);

    // Check that all required parameters are present
    expect(result.upload_url).toContain('object=');
    expect(result.upload_url).toContain('expires=');
    expect(result.upload_url).toContain('signature=');
    expect(result.upload_url).toContain('content_type=application%2Fpdf');
    expect(result.upload_url).toContain('size=1048576');
  });

  it('should generate valid base64url signatures', async () => {
    const result = await requestUploadUrl(basicInput);

    const signatureMatch = result.upload_url.match(/signature=([^&]+)/);
    expect(signatureMatch).toBeTruthy();
    
    const signature = decodeURIComponent(signatureMatch![1]);
    // Base64url should not contain + / = characters
    expect(signature).not.toContain('+');
    expect(signature).not.toContain('/');
    expect(signature).not.toContain('=');
    
    // Should be decodable as base64url
    expect(() => Buffer.from(signature, 'base64url')).not.toThrow();
  });
});