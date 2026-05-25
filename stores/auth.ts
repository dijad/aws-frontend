import { defineStore } from 'pinia';
import { AUTH_DISABLED } from '~/config/auth-dev';
import type { AuthUser, LoginResponse } from '~/types/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY = 'gn-auth';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
  }),
  getters: {
    isAuthenticated: (state): boolean =>
      AUTH_DISABLED ? Boolean(state.user) : Boolean(state.accessToken && state.user),
    permissions: (state): string[] => state.user?.permissions ?? [],
    roleCode: (state): string | null => state.user?.roleCode ?? null,
  },
  actions: {
    setDevBypass(user: AuthUser) {
      this.user = user;
      this.accessToken = 'dev-bypass';
      this.refreshToken = null;
    },
    hasPermission(code: string): boolean {
      if (AUTH_DISABLED) return true;
      return this.permissions.includes(code);
    },
    hasAnyPermission(codes: string[]): boolean {
      if (AUTH_DISABLED) return true;
      return codes.some((c) => this.permissions.includes(c));
    },
    hydrateFromStorage() {
      if (!import.meta.client) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as AuthState;
        this.user = parsed.user;
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken;
      } catch {
        this.clear();
      }
    },
    persist() {
      if (!import.meta.client) return;
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: this.user,
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
        }),
      );
    },
    setSession(payload: LoginResponse) {
      this.user = payload.user;
      this.accessToken = payload.accessToken;
      this.refreshToken = payload.refreshToken;
      this.persist();
    },
    setUser(user: AuthUser) {
      this.user = user;
      this.persist();
    },
    clear() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      if (import.meta.client) window.localStorage.removeItem(STORAGE_KEY);
    },
    async login(email: string, password: string) {
      const { apiFetch } = useApi();
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      this.setSession(data);
      return data;
    },
    async logout() {
      if (AUTH_DISABLED) return;
      const { apiFetch } = useApi();
      const refreshToken = this.refreshToken;
      this.clear();
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
        }).catch(() => undefined);
      }
      await navigateTo('/login');
    },
    async refreshSession() {
      if (!this.refreshToken) throw new Error('No refresh token');
      const { apiFetch } = useApi();
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: number;
      }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        skipAuth: true,
      });
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.persist();
      return data;
    },
    async fetchMe() {
      const { apiFetch } = useApi();
      const me = await apiFetch<AuthUser>('/auth/me');
      this.setUser(me);
      return me;
    },
  },
});
