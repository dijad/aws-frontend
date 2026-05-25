import { AUTH_DISABLED } from '~/config/auth-dev';

/** Runs on every route; enforces `definePageMeta({ permissions: [...] })` when set. */
export default defineNuxtRouteMiddleware((to) => {
  if (AUTH_DISABLED) return;

  const required = to.meta.permissions as string[] | undefined;
  if (!required?.length) return;

  const auth = useAuthStore();
  if (import.meta.client && auth.user === null && auth.accessToken === null) {
    auth.hydrateFromStorage();
  }

  const { canAny } = usePermissions();
  if (!canAny(required)) {
    return navigateTo('/global-notes');
  }
});
