export interface UserNameFields {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
}

function isEmailLike(value: string, email?: string | null): boolean {
  if (!email) {
    return false;
  }
  return value.trim().toLowerCase() === email.trim().toLowerCase();
}

export function resolveUserNameFields(fields: UserNameFields): {
  firstName?: string;
  lastName?: string;
  fullName?: string;
} {
  let firstName = fields.firstName?.trim() || '';
  let lastName = fields.lastName?.trim() || '';
  const rawName = fields.fullName?.trim() || fields.name?.trim() || '';
  const fullName = rawName && !isEmailLike(rawName, fields.email) ? rawName : '';

  if (!firstName && !lastName && fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? '';
    lastName = parts.slice(1).join(' ');
  }

  const combined = `${firstName} ${lastName}`.trim();

  return {
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    fullName: combined || fullName || undefined,
  };
}

export function getUserDisplayName(fields: UserNameFields): string {
  const { fullName } = resolveUserNameFields(fields);
  return fullName || 'Your Profile';
}

export function hasUserDisplayName(fields: UserNameFields): boolean {
  return Boolean(resolveUserNameFields(fields).fullName);
}

export function getUserAvatarInitial(fields: UserNameFields): string {
  const { firstName, fullName } = resolveUserNameFields(fields);
  const source = firstName || fullName;
  return source ? source.charAt(0).toUpperCase() : 'U';
}
