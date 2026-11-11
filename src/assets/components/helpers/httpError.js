/**
 * Turns an API failure into something a user (or you, in a bug report) can act on.
 *
 * The ported screens all had the same shape, inherited from React Native:
 *
 *     try { const r = await fetch(url); if (r.ok) { ...setData(...) } }
 *     catch { Toast.showError('Failed to load requests.'); }
 *
 * With no `else`, a 401 / 404 / 500 quietly renders as "No pending requests."
 * and the only toast you ever see is a bare network failure. That makes every
 * problem look identical. This helper keeps that ergonomics but always names
 * the actual cause.
 */

/** Parse a JSON body without throwing on HTML/empty error pages (IIS 401/500). */
export async function readJsonSafely(response) {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      // e.g. an ASP.NET developer exception page or an IIS error document
      return { message: text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) };
    }
  } catch {
    return null;
  }
}

const firstSentence = (value) => {
  if (typeof value !== 'string') return '';
  const text = value.trim().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
};

/**
 * @param {object}  failure
 * @param {number} [failure.status]        HTTP status, omitted for network errors
 * @param {any}    [failure.data]          parsed body (may be null)
 * @param {Error}  [failure.error]         the thrown error, for network failures
 * @param {string} [failure.resource]      human name, e.g. 'requests'
 * @param {string} [failure.url]           request URL, shown for network failures
 * @param {string} [failure.actualRole]    role stored in this session (Client/Worker/…)
 * @param {string} [failure.requiredRole]  role the endpoint requires
 */
export function describeHttpFailure({ status, data, error, resource = 'data', url = '', actualRole = '', requiredRole = '' } = {}) {
  const serverMessage = firstSentence(
    data?.message || data?.title || data?.error || (data?.detail ? String(data.detail) : ''),
  );

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (status === 403) {
    // The usual cause: the wrong screen for the signed-in role. Naming both
    // roles turns a confusing "failed" toast into a one-line diagnosis.
    if (requiredRole && actualRole && actualRole !== requiredRole) {
      return `This screen needs a ${requiredRole} account, but you are signed in as ${actualRole}.`;
    }
    return serverMessage || `You do not have permission to view ${resource}.`;
  }
  if (status === 404) {
    return serverMessage || `The server has no ${resource} endpoint at this address.`;
  }
  if (status === 400 || status === 422) {
    return serverMessage || `The server rejected the request for ${resource} (HTTP ${status}).`;
  }
  if (status >= 500) {
    return serverMessage
      ? `Server error (HTTP ${status}): ${serverMessage}`
      : `The server failed while loading ${resource} (HTTP ${status}).`;
  }
  if (status) {
    return serverMessage || `Could not load ${resource} (HTTP ${status}).`;
  }

  // No status ⇒ fetch itself rejected: DNS, connection refused, CORS, offline.
  const detail = error?.message && error.message !== 'Failed to fetch' ? ` (${error.message})` : '';
  return `Could not reach the server${detail}. Check the backend is running and CORS/proxy allows ${url || 'this origin'}.`;
}

/** True when a failure should send the user back to the login screen. */
export const isSessionExpired = (status) => status === 401;
