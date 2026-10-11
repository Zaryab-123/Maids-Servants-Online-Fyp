import AsyncStorage from '@/web/AsyncStorage';
import { Alert } from '@/web';
import { SERVER_BASE } from '../../config';

export async function courseApi(path, options = {}) {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${SERVER_BASE}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (response.status === 401 && token) {
    // Expired or invalid session: clear it and send the user back to Login.
    window.localStorage.clear();
    window.location.assign('/Login');
    throw new Error('Your session has expired. Please log in again.');
  }
  if (!response.ok) throw new Error(data?.message || data?.title || `Request failed (${response.status})`);
  return data;
}

export const courseColors = {
  primary: '#1565C0', dark: '#0D47A1', pale: '#EAF3FF', background: '#F7FAFF',
  white: '#FFFFFF', text: '#172033', muted: '#64748B', border: '#D9E5F3',
  success: '#16865C', warning: '#C47A00', danger: '#C62828',
};

/** Confirmation modal before an irreversible action. */
export function confirmAction(title, message, confirmText, onConfirm) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
