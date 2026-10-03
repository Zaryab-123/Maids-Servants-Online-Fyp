import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE } from '../../config';

export const courseColors = {
  primary: '#1E64D3',
  secondary: '#2C437E',
  background: '#F5F7FB',
  white: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  pale: '#EAF3FF',
  success: '#16A34A',
  danger: '#DC2626',
  dark: '#0F172A',
};

const toAbsoluteUrl = (endpoint) => {
  if (!endpoint) return SERVER_BASE;
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${SERVER_BASE}${normalized}`;
};

export async function courseApi(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('userToken');

  const requestOptions = {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (
    requestOptions.body !== undefined &&
    typeof requestOptions.body !== 'string' &&
    !(requestOptions.body instanceof FormData)
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
    if (!requestOptions.headers['Content-Type']) {
      requestOptions.headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(toAbsoluteUrl(endpoint), requestOptions);
  const text = await response.text();

  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.title ||
      payload?.error ||
      (typeof payload === 'string' ? payload : `Request failed (${response.status})`);
    throw new Error(message || 'Request failed.');
  }

  return payload ?? {};
}

export function confirmAction(title, message, confirmLabel, onConfirm) {
  const ok = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
  if (ok && typeof onConfirm === 'function') {
    onConfirm();
  }
  return ok;
}
