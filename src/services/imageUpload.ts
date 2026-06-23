import { ApiClient } from './apiClient';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export interface UploadedImage {
  url: string;
  fileName?: string;
  size?: number;
}

/**
 * Upload images using the same endpoint as 241runnersawareness.org
 * POST /api/ImageUpload/upload — multipart field name: files
 */
export class ImageUploadService {
  static async uploadImage(imageUri: string, fileName = 'image.jpg'): Promise<UploadedImage> {
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '.jpg';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error('Image must be JPG, PNG, GIF, or WebP');
    }

    const formData = new FormData();
    formData.append('files', {
      uri: imageUri,
      type: ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
      name: fileName,
    } as unknown as Blob);

    const result = await ApiClient.uploadFile<{
      success?: boolean;
      files?: Array<{ url?: string; fileName?: string; size?: number }>;
      message?: string;
    }>('/api/ImageUpload/upload', formData);

    const file = result.files?.[0];
    if (!file?.url) {
      throw new Error(result.message || 'Upload succeeded but no image URL was returned');
    }

    if (file.size && file.size > MAX_FILE_BYTES) {
      throw new Error('Image must be smaller than 5MB');
    }

    return {
      url: file.url,
      fileName: file.fileName,
      size: file.size,
    };
  }

  static async uploadImages(imageUris: string[]): Promise<UploadedImage[]> {
    const uploads: UploadedImage[] = [];
    for (let i = 0; i < imageUris.length; i++) {
      uploads.push(await this.uploadImage(imageUris[i], `image_${i + 1}.jpg`));
    }
    return uploads;
  }
}
