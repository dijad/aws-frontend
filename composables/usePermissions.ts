import { AUTH_DISABLED } from '~/config/auth-dev';

export const usePermissions = () => {
  const auth = useAuthStore();

  const can = (code: string) => AUTH_DISABLED || auth.hasPermission(code);
  const canAny = (codes: string[]) => AUTH_DISABLED || auth.hasAnyPermission(codes);

  return { can, canAny, permissions: computed(() => auth.permissions) };
};
