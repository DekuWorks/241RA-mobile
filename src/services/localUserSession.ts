import { ApiUserPayload } from './apiUserMapper';
import { SecureTokenService } from './secureTokens';
import { UserDataService } from './userData';
import { apiUserFromJwt } from '../utils/jwt';

/**
 * Resolve the best locally available user snapshot without hitting the network.
 * Order: cached API user → legacy AsyncStorage user → JWT access token claims.
 */
export async function resolveLocalApiUser(): Promise<ApiUserPayload | null> {
  const cached = await UserDataService.getStoredApiUser();
  if (cached) {
    return cached;
  }

  const token = await SecureTokenService.getAccessToken();
  if (!token) {
    return null;
  }

  const fromJwt = apiUserFromJwt(token);
  if (!fromJwt) {
    return null;
  }

  const payload: ApiUserPayload = {
    id: fromJwt.id,
    email: fromJwt.email,
    fullName: fromJwt.fullName,
    role: fromJwt.role,
    allRoles: fromJwt.allRoles,
    primaryUserRole: fromJwt.primaryUserRole,
    isAdminUser: fromJwt.isAdminUser,
  };

  await UserDataService.setStoredApiUser(payload);
  return payload;
}

export function refreshRemoteUserInBackground(): void {
  void import('./auth')
    .then(({ AuthService }) => AuthService.fetchCurrentUserFromApi())
    .catch(() => undefined);
}
