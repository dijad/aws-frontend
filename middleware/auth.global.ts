import { AUTH_DISABLED } from '~/config/auth-dev';

export default defineNuxtRouteMiddleware((to) => {
  if (AUTH_DISABLED) {
    if (to.path === '/login') {
      return navigateTo('/global-notes');
    }
    return;
  }

  const auth = useAuthStore();
  if (import.meta.client && auth.user === null && auth.accessToken === null) {
    auth.hydrateFromStorage();
  }

  const publicPaths = ['/login'];
  const isPublic = publicPaths.includes(to.path);

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }
  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/global-notes');
  }
});
