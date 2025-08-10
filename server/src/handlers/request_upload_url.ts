import { randomUUID } from 'crypto';
import { type RequestUploadUrlInput, type SignedUploadUrlResponse } from '../schema';

export async function requestUploadUrl(input: RequestUploadUrlInput): Promise<SignedUploadUrlResponse> {
  try {
    // Generate unique identifiers
    const timestamp = Date.now();
    const uuid = randomUUID();
    
    // Generate a unique slug for shareable links (shorter, URL-friendly)
    const slug = `${timestamp}-${uuid.substring(0, 8)}`;
    
    // Generate a unique object name for storage (includes original filename)
    const hasExtension = input.filename.includes('.') && input.filename.lastIndexOf('.') > 0;
    let baseName: string;
    let fileExtension: string;
    
    if (hasExtension) {
      const lastDotIndex = input.filename.lastIndexOf('.');
      baseName = input.filename.substring(0, lastDotIndex);
      fileExtension = input.filename.substring(lastDotIndex + 1);
    } else {
      baseName = input.filename;
      fileExtension = '';
    }
    
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize
    const object_name = `uploads/${timestamp}/${uuid}/${sanitizedBaseName}${fileExtension ? '.' + fileExtension : ''}`;
    
    // Generate signed upload URL (simulated for object storage service)
    // In a real implementation, this would call AWS S3, Google Cloud Storage, etc.
    const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
    const signature = Buffer.from(`${object_name}-${expiryTime}-${input.content_type}`).toString('base64url');
    const upload_url = `https://storage.example.com/upload?object=${encodeURIComponent(object_name)}&expires=${expiryTime}&signature=${signature}&content_type=${encodeURIComponent(input.content_type)}&size=${input.size_bytes}`;
    
    return {
      upload_url,
      object_name,
      slug
    };
  } catch (error) {
    console.error('Upload URL generation failed:', error);
    throw error;
  }
}