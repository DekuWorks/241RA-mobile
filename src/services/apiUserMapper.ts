import { UserProfile } from './userProfile';
import { User } from './auth';
import { resolveUserNameFields } from '../utils/userDisplayName';

/** API user payload from /api/v1/auth/me or /api/v1/users/me */
export interface ApiUserPayload {
  id: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  allRoles?: string[];
  primaryUserRole?: string;
  isAdminUser?: boolean;
  phoneNumber?: string;
  profileImageUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

function readStringField(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function normalizeApiUserPayload(raw: Record<string, unknown>): ApiUserPayload {
  const firstName = readStringField(raw, 'firstName', 'FirstName') ?? '';
  const lastName = readStringField(raw, 'lastName', 'LastName') ?? '';
  const explicitFullName = readStringField(raw, 'fullName', 'FullName', 'name', 'Name');

  let resolvedFirstName = firstName;
  let resolvedLastName = lastName;

  if (!resolvedFirstName && !resolvedLastName && explicitFullName) {
    const parts = explicitFullName.split(/\s+/).filter(Boolean);
    resolvedFirstName = parts[0] ?? '';
    resolvedLastName = parts.slice(1).join(' ');
  }

  const fullName = explicitFullName || `${resolvedFirstName} ${resolvedLastName}`.trim();
  const email = readStringField(raw, 'email', 'Email');

  if (!email) {
    throw new Error('Invalid profile response');
  }

  return {
    id: raw.id ?? raw.Id ?? '',
    email,
    firstName: resolvedFirstName || undefined,
    lastName: resolvedLastName || undefined,
    fullName: fullName || undefined,
    role: readStringField(raw, 'role', 'Role') || 'user',
    allRoles: (raw.allRoles ?? raw.AllRoles) as string[] | undefined,
    primaryUserRole: readStringField(raw, 'primaryUserRole', 'PrimaryUserRole'),
    isAdminUser: Boolean(raw.isAdminUser ?? raw.IsAdminUser),
    phoneNumber: readStringField(raw, 'phoneNumber', 'PhoneNumber'),
    profileImageUrl: readStringField(raw, 'profileImageUrl', 'ProfileImageUrl'),
    address: readStringField(raw, 'address', 'Address'),
    city: readStringField(raw, 'city', 'City'),
    state: readStringField(raw, 'state', 'State'),
    zipCode: readStringField(raw, 'zipCode', 'ZipCode'),
    emergencyContactName: readStringField(raw, 'emergencyContactName', 'EmergencyContactName'),
    emergencyContactPhone: readStringField(raw, 'emergencyContactPhone', 'EmergencyContactPhone'),
    emergencyContactRelationship: readStringField(
      raw,
      'emergencyContactRelationship',
      'EmergencyContactRelationship'
    ),
    isEmailVerified: Boolean(raw.isEmailVerified ?? raw.IsEmailVerified),
    isPhoneVerified: Boolean(raw.isPhoneVerified ?? raw.IsPhoneVerified),
    twoFactorEnabled: Boolean(raw.twoFactorEnabled ?? raw.TwoFactorEnabled),
    createdAt: readStringField(raw, 'createdAt', 'CreatedAt'),
    lastLoginAt: readStringField(raw, 'lastLoginAt', 'LastLoginAt'),
    updatedAt: readStringField(raw, 'updatedAt', 'UpdatedAt'),
  };
}

export function unwrapApiUser(data: unknown): ApiUserPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid profile response');
  }

  const record = data as Record<string, unknown>;
  const user = (record.user ?? record) as Record<string, unknown>;

  return normalizeApiUserPayload(user);
}

export function mapApiUserToProfile(user: ApiUserPayload): UserProfile {
  const { firstName, lastName, fullName } = resolveUserNameFields({
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
  });

  const emergencyContacts =
    user.emergencyContactName && user.emergencyContactPhone
      ? [
          {
            id: 'primary',
            name: user.emergencyContactName,
            relationship: user.emergencyContactRelationship || 'Emergency Contact',
            phoneNumber: user.emergencyContactPhone,
          },
        ]
      : [];

  return {
    id: String(user.id),
    email: user.email,
    firstName,
    lastName,
    name: fullName,
    phoneNumber: user.phoneNumber,
    profileImageUrl: user.profileImageUrl,
    role: user.role || 'user',
    isEmailVerified: Boolean(user.isEmailVerified),
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    memberSince: user.createdAt,
    address:
      user.address || user.city || user.state || user.zipCode
        ? {
            street: user.address,
            city: user.city,
            state: user.state,
            zipCode: user.zipCode,
          }
        : undefined,
    emergencyContacts,
  };
}

export function mapApiUserToAuthUser(user: ApiUserPayload): User {
  const role = user.role || 'user';
  const isAdmin = user.isAdminUser ?? role.toLowerCase() === 'admin';
  const { firstName, lastName, fullName } = resolveUserNameFields({
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
  });

  return {
    id: String(user.id),
    email: user.email,
    firstName,
    lastName,
    name: fullName,
    createdAt: user.createdAt,
    role,
    allRoles: user.allRoles ?? (isAdmin ? ['admin', 'user'] : [role]),
    primaryUserRole: user.primaryUserRole ?? (isAdmin ? 'user' : role),
    isAdminUser: isAdmin,
    isEmailVerified: Boolean(user.isEmailVerified),
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}
