import { resolveDeepLinkPath } from '../lib/linking';

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  return resolveDeepLinkPath(path);
}
