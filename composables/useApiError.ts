import { formatApiError } from '~/utils/api-error';

/** @deprecated Prefer formatApiError from ~/utils/api-error */
export function useApiError() {
  return { formatApiError };
}

export { formatApiError };
