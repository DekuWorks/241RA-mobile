import { ENV } from '../config/env';

/** Legacy API hosts that still appear in stored profileImageUrl values. */
const STALE_API_HOSTS = [
  '241runners-api.onrender.com',
  'www.241runners-api.onrender.com',
  '241runners-api-v2.azurewebsites.net',
];

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

function apiOrigin(): string {
  return ENV.API_URL.replace(/\/$/, '');
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

  // Always proxy ImageUpload paths through the current API host.
  // Stored URLs often still point at retired Render/Azure hosts (404).
  if (trimmed.includes('/api/ImageUpload/') || trimmed.includes('/ImageUpload/')) {
    const fileName = extractImageFileName(trimmed);
    if (fileName) {
      return `${apiOrigin()}/api/ImageUpload/${encodeURIComponent(fileName)}`;
    }
  }

  const fileName = extractImageFileName(trimmed);
  if (fileName && (trimmed.includes('blob.core.windows.net') || !trimmed.startsWith('http'))) {
    return `${apiOrigin()}/api/ImageUpload/${encodeURIComponent(fileName)}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (STALE_API_HOSTS.includes(parsed.hostname) && fileName) {
        return `${apiOrigin()}/api/ImageUpload/${encodeURIComponent(fileName)}`;
      }
      // Rewrite any absolute URL on a different API host that still looks like our image proxy.
      const currentHost = new URL(apiOrigin()).hostname;
      if (parsed.hostname !== currentHost && trimmed.includes('/api/ImageUpload/') && fileName) {
        return `${apiOrigin()}/api/ImageUpload/${encodeURIComponent(fileName)}`;
      }
    } catch {
      // fall through
    }
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${apiOrigin()}${trimmed}`;
  }

  return `${apiOrigin()}/api/ImageUpload/${encodeURIComponent(trimmed)}`;
}
