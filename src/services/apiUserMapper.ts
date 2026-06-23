import { UserProfile } from './userProfile';
import { User } from './auth';

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

export function unwrapApiUser(data: unknown): ApiUserPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid profile response');
  }

  const record = data as Record<string, unknown>;
  const user = (record.user ?? record) as ApiUserPayload;

  if (!user?.email) {
    throw new Error('Invalid profile response');
  }

  return user;
}

export function mapApiUserToProfile(user: ApiUserPayload): UserProfile {
  const firstName = user.firstName ?? '';
  const lastName = user.lastName ?? '';
  const fullName = user.fullName?.trim() || `${firstName} ${lastName}`.trim();

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
    firstName: user.firstName,
    lastName: user.lastName,
    name: fullName || user.email,
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

  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName?.trim() || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    role,
    allRoles: user.allRoles ?? (isAdmin ? ['admin', 'user'] : [role]),
    primaryUserRole: user.primaryUserRole ?? (isAdmin ? 'user' : role),
    isAdminUser: isAdmin,
    isEmailVerified: Boolean(user.isEmailVerified),
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}
