import { UserRole, AuthProvider } from './common';

export interface User {
  id: string;
  email: string;
  emailVerified?: Date | null;
  password?: string | null;
  image?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  authProvider: AuthProvider;
  authProviderId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: any | null; // Json type
  lastLogin?: Date | null;
  failedLoginAttempts?: number | null;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password?: string; // Optional for external auth providers
  firstName: string;
  lastName: string;
  role: UserRole;
  authProvider?: AuthProvider; // Defaults to EMAIL
  authProviderId?: string;
  preferences?: any | null;
  image?: string;
  phone?: string;
  storeId?:string
}

export interface UpdateUserDto {
  email?: string;
  password?: string | null; // Can set to null to remove password
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  image?: string | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: any | null;
  lastLogin?: Date | null;
  failedLoginAttempts?: number | null;
  lockedUntil?: Date | null;
  // Auth related fields
  authProvider?: AuthProvider;
  authProviderId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
}

// Additional interfaces for auth operations
export interface AuthUserDto {
  email: string;
  password: string;
}

export interface SocialAuthUserDto {
  provider: AuthProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  image?: string;
}