import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { Href, usePathname, useRouter } from 'expo-router';
import { requiresAuthDeepLinkPath, resolveDeepLinkPath } from '../lib/linking';
import { SecureTokenService } from '../services/secureTokens';

/**
 * Rewrites incoming URLs and guards authenticated routes when opened via deep links.
 */
export function DeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const targetPath = resolveDeepLinkPath(url);
      if (targetPath !== pathnameRef.current) {
        router.push(targetPath as Href);
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const guardRoute = async () => {
      if (!requiresAuthDeepLinkPath(pathname)) {
        return;
      }

      const token = await SecureTokenService.getAccessToken();
      if (cancelled || token) {
        return;
      }

      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?redirect=${redirect}` as Href);
    };

    void guardRoute();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
