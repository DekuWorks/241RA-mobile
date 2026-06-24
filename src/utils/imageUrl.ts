import { ENV } from '../config/env';

/** Extract blob/API image file name from a stored profile or upload URL. */
export function extractImageFileName(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const withoutQuery = trimmed.split('?')[0];
  const apiMatch = withoutQuery.match(/\/ImageUpload\/([^/]+)$/i);
  if (apiMatch?.[1]) return apiMatch[1];

  const blobMatch = withoutQuery.match(/\/images\/([^/]+)$/i);
  if (blobMatch?.[1]) return blobMatch[1];

  if (!withoutQuery.includes('/') && !withoutQuery.includes('\\')) {
    return withoutQuery;
  }

  const parts = withoutQuery.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

/**
 * Convert stored image URLs (Azure blob, relative, or API paths) into a URI
 * the React Native Image component can load.
 */
export function resolveImageDisplayUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();

  if (trimmed.startsWith('file://') || trimmed.startsWith('data:') || trimmed.startsWith('content://')) {
    return trimmed;
  }

  if (trimmed.includes('/api/ImageUpload/') && trimmed.startsWith('http')) {
    return trimmed;
  }

  const fileName = extractImageFileName(trimmed);
  if (fileName) {
    return `${ENV.API_URL}/api/ImageUpload/${encodeURIComponent(fileName)}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${ENV.API_URL}${trimmed}`;
  }

  return `${ENV.API_URL}/api/ImageUpload/${encodeURIComponent(trimmed)}`;
}
