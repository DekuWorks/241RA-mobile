function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;

  while (i < padded.length) {
    const enc1 = chars.indexOf(padded.charAt(i++));
    const enc2 = chars.indexOf(padded.charAt(i++));
    const enc3 = chars.indexOf(padded.charAt(i++));
    const enc4 = chars.indexOf(padded.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  return output;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readClaim(payload: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readRoles(payload: Record<string, unknown>): string[] {
  const roleClaim =
    payload.role ??
    payload.roles ??
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (typeof roleClaim === 'string' && roleClaim.trim()) {
    return [roleClaim.trim()];
  }

  if (Array.isArray(roleClaim)) {
    return roleClaim
      .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
      .map(role => role.trim());
  }

  return ['user'];
}

export function apiUserFromJwt(token: string): {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  allRoles: string[];
  primaryUserRole: string;
  isAdminUser: boolean;
} | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const email = readClaim(
    payload,
    'email',
    'unique_name',
    'upn',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  );

  const id = readClaim(
    payload,
    'sub',
    'nameid',
    'userId',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
  );

  if (!email && !id) {
    return null;
  }

  const allRoles = readRoles(payload);
  const role = allRoles[0] ?? 'user';
  const isAdminUser = allRoles.some(r => ['admin', 'super_admin', 'moderator'].includes(r.toLowerCase()));
  const fullName = readClaim(
    payload,
    'name',
    'fullName',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
  );

  return {
    id: id ?? email ?? 'unknown',
    email: email ?? `${id}@local`,
    fullName,
    role,
    allRoles,
    primaryUserRole: isAdminUser ? 'user' : role,
    isAdminUser,
  };
}
