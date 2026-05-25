import type { AuthUser } from '~/types/api';

/**
 * Bypass de auth/RBAC solo si NUXT_PUBLIC_AUTH_DISABLED=true en .env
 * (debe coincidir con AUTH_DISABLED del backend).
 */
export const AUTH_DISABLED =
  import.meta.env.NUXT_PUBLIC_AUTH_DISABLED === 'true' ||
  import.meta.env.NUXT_PUBLIC_AUTH_DISABLED === '1';

export const ALL_PERMISSIONS = [
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'ROLE_MANAGE',
  'MODULE_MANAGE',
  'NOTE_CREATE',
  'NOTE_SKIP_APPROVAL',
  'NOTE_APPROVE_REJECT',
  'SYSTEM_UPDATE_CREATE',
  'SYSTEM_UPDATE_REVIEW_AS_DEV',
  'SYSTEM_UPDATE_REVIEW_AS_ADMIN',
  'MANUAL_EDIT',
  'MANUAL_PUBLISH',
] as const;

export const MOCK_DEV_USER: AuthUser = {
  id: 'dev-mock-user',
  name: 'Modo desarrollo',
  email: 'dev@local',
  roleCode: 'ADMIN',
  roleName: 'Administrator',
  permissions: [...ALL_PERMISSIONS],
};
