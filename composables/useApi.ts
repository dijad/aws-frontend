type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'PUT'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

let refreshing: Promise<unknown> | null = null;

export const useApi = () => {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  async function apiFetch<T = unknown>(
    path: string,
    options: ApiOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (!options.skipAuth && auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const url = `${config.public.apiBase}${path.startsWith('/') ? path : `/${path}`}`;

    const exec = () =>
      $fetch<T>(url, {
        method: options.method ?? 'GET',
        headers,
        body:
          options.body && !(options.body instanceof FormData)
            ? JSON.stringify(options.body)
            : (options.body as BodyInit | undefined),
      });

    try {
      return await exec();
    } catch (err: unknown) {
      const status =
        (err as { status?: number }).status ??
        (err as { statusCode?: number }).statusCode;
      if (status === 401 && !options.skipAuth && auth.refreshToken) {
        try {
          if (!refreshing) refreshing = auth.refreshSession();
          await refreshing;
        } catch (refreshErr) {
          refreshing = null;
          auth.clear();
          throw refreshErr;
        } finally {
          refreshing = null;
        }
        headers.Authorization = `Bearer ${auth.accessToken}`;
        return await exec();
      }
      throw err;
    }
  }

  return { apiFetch };
};
