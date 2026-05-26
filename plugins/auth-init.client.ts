import { AUTH_DISABLED, MOCK_DEV_USER } from '~/config/auth-dev';

export default defineNuxtPlugin(() => {
  const auth = useAuthStore();

  if (AUTH_DISABLED) {
    auth.setDevBypass(MOCK_DEV_USER);
    return;
  }

  auth.hydrateFromStorage();
  if (auth.accessToken) {
    auth.fetchMe().catch(() => auth.clear());
  }
});
