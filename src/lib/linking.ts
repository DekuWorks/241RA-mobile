export const APP_SCHEME = 'org.runners241.app';

const WEB_HOSTS = new Set(['241runnersawareness.org', 'www.241runnersawareness.org']);

/** Routes that work without signing in */
export const PUBLIC_DEEP_LINK_PATHS = new Set(['/login', '/signup', '/map']);

const APP_ROUTE_PREFIXES = [
  '/map',
  '/cases',
  '/profile',
  '/login',
  '/signup',
  '/report-case',
  '/report-sighting',
  '/admin',
  '/portal',
] as const;

export function normalizeCaseId(id: string | null | undefined): string {
  if (!id) return '';
  const decoded = decodeURIComponent(String(id).trim());
  if (!decoded) return '';
  if (decoded.startsWith('case_')) return decoded;
  if (/^\d+$/.test(decoded)) return `case_${decoded}`;
  return decoded;
}

export function isPublicDeepLinkPath(pathname: string): boolean {
  const basePath = pathname.split('?')[0] || '/';
  if (PUBLIC_DEEP_LINK_PATHS.has(basePath)) return true;
  // Case detail pages are readable without login (public cases).
  return /^\/cases\/[^/]+$/.test(basePath);
}

export function requiresAuthDeepLinkPath(pathname: string): boolean {
  const basePath = pathname.split('?')[0] || '/';
  if (basePath === '/' || isPublicDeepLinkPath(basePath)) return false;
  return APP_ROUTE_PREFIXES.some(prefix => basePath === prefix || basePath.startsWith(`${prefix}/`));
}

function normalizeAppPath(pathname: string, searchParams: URLSearchParams): string {
  let path = pathname.replace(/\/$/, '') || '/';

  if (path.endsWith('.html')) {
    path = path.slice(0, -5) || '/';
  }

  if (path === '/case-detail') {
    const id = searchParams.get('id');
    return id ? `/cases/${normalizeCaseId(id)}` : '/cases';
  }

  if (path === '/report-sighting') {
    const id = searchParams.get('id');
    return id ? `/report-sighting/${normalizeCaseId(id)}` : '/cases';
  }

  if (path === '/my-cases') {
    return '/cases';
  }

  const caseMatch = path.match(/^\/cases\/(.+)$/);
  if (caseMatch) {
    return `/cases/${normalizeCaseId(caseMatch[1])}`;
  }

  const sightingMatch = path.match(/^\/report-sighting\/(.+)$/);
  if (sightingMatch) {
    return `/report-sighting/${normalizeCaseId(sightingMatch[1])}`;
  }

  if (path === '/map') {
    const caseId = searchParams.get('case');
    if (caseId) {
      const query = new URLSearchParams({ case: normalizeCaseId(caseId) });
      return `/map?${query.toString()}`;
    }
    return '/map';
  }

  const isKnownRoute = APP_ROUTE_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (isKnownRoute) {
    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
  }

  return path;
}

/**
 * Convert a custom-scheme or website URL into an Expo Router path.
 */
export function resolveDeepLinkPath(inputPath: string): string {
  if (!inputPath) return '/login';

  const trimmed = inputPath.trim();

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    try {
      const url = new URL(trimmed, 'https://241runnersawareness.org');
      return normalizeAppPath(url.pathname, url.searchParams);
    } catch {
      return trimmed;
    }
  }

  try {
    const url = new URL(trimmed);
    const isAppScheme = url.protocol === `${APP_SCHEME}:`;
    const isWebHost = WEB_HOSTS.has(url.hostname);

    if (isAppScheme) {
      const combinedPath =
        url.host && url.host !== APP_SCHEME
          ? `/${url.host}${url.pathname}`
          : url.pathname || '/';
      return normalizeAppPath(combinedPath, url.searchParams);
    }

    if (isWebHost) {
      const resolved = normalizeAppPath(url.pathname, url.searchParams);
      if (APP_ROUTE_PREFIXES.some(prefix => resolved === prefix || resolved.startsWith(`${prefix}/`))) {
        return resolved;
      }
      if (resolved === '/case-detail' || resolved === '/report-sighting') {
        return resolved;
      }
      return '/login';
    }

    return trimmed;
  } catch {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
