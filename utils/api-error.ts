/** Turn API / network errors into short, user-facing messages. */
export function formatApiError(err: unknown): string {
  const status = getStatus(err);
  const raw = extractRawMessage(err);

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    return raw && raw.length < 160 ? raw : 'You do not have permission to do this.';
  }
  if (status === 404) {
    return raw && raw.length < 160 ? raw : 'The requested item was not found.';
  }
  if (status === 409) {
    return raw && raw.length < 160 ? raw : 'This record already exists.';
  }

  if (isTechnicalMessage(raw)) {
    return defaultFriendlyMessage(status);
  }

  if (raw) return raw;

  return defaultFriendlyMessage(status);
}

function getStatus(err: unknown): number | undefined {
  const e = err as { status?: number; statusCode?: number; response?: { status?: number } };
  return e.status ?? e.statusCode ?? e.response?.status;
}

function extractRawMessage(err: unknown): string | null {
  const e = err as {
    data?: { message?: string | string[] };
    message?: string;
  };

  const dataMsg = e.data?.message;
  if (Array.isArray(dataMsg)) {
    return dataMsg.filter(Boolean).join('. ');
  }
  if (typeof dataMsg === 'string' && dataMsg.trim()) {
    return dataMsg.trim();
  }

  const msg = e.message?.trim();
  if (!msg || msg === '[object Object]') return null;

  return msg;
}

function isTechnicalMessage(msg: string | null): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    msg.length > 280 ||
    lower.includes('prisma') ||
    lower.includes('invalid `') ||
    lower.includes('invocation in') ||
    lower.includes('unknown argument') ||
    lower.includes('node_modules') ||
    lower.includes('stack') ||
    lower.includes('eaddrinuse')
  );
}

function defaultFriendlyMessage(status?: number): string {
  if (status && status >= 500) {
    return 'Something went wrong on the server. Please try again in a moment.';
  }
  return 'We could not complete this action. Check your input and try again.';
}
