import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE } from '../../config';

/**
 * Worker notifications client.
 *
 * Ported 1:1 from the React Native app (helpers/workerNotificationsApi.js).
 * The only change is the storage import: RN's AsyncStorage becomes the
 * localStorage-backed shim. Every validation, timeout and error string is
 * preserved so both apps behave identically against the same backend.
 */
const BASE = `${SERVER_BASE}/api/worker/notifications`;
const TIMEOUT_MS = 15000;

export class WorkerNotificationsApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'WorkerNotificationsApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new WorkerNotificationsApiError('Please sign in again.', 401);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new WorkerNotificationsApiError(
        data?.message || (response.status === 401 ? 'Please sign in again.' : 'Notifications are unavailable. Please try again.'),
        response.status,
      );
    }
    if (!data || !Number.isInteger(data.unreadCount) || data.unreadCount < 0) {
      throw new WorkerNotificationsApiError('The notification response was invalid. Please try again.');
    }
    return data;
  } catch (error) {
    if (error instanceof WorkerNotificationsApiError) throw error;
    throw new WorkerNotificationsApiError(
      error?.name === 'AbortError' ? 'The request timed out. Please try again.' : 'Could not connect. Please check your connection and retry.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getWorkerUnreadCount() {
  return request('/unread-count');
}

export async function getWorkerNotifications({ skip = 0, take = 30, snapshotAtUtc } = {}) {
  const query = `?skip=${skip}&take=${take}${snapshotAtUtc ? `&snapshotAtUtc=${encodeURIComponent(snapshotAtUtc)}` : ''}`;
  const data = await request(query);
  if (!Array.isArray(data.items) || typeof data.snapshotAtUtc !== 'string' ||
      !Number.isInteger(data.total) || data.total < 0 || typeof data.hasMore !== 'boolean') {
    throw new WorkerNotificationsApiError('The notification list was invalid. Please try again.');
  }
  return data;
}

export function markWorkerNotificationRead(key) {
  return request(`/${encodeURIComponent(key)}/read`, { method: 'POST' });
}

export function markAllWorkerNotificationsRead(snapshotAtUtc) {
  return request('/read-all', { method: 'POST', body: JSON.stringify({ snapshotAtUtc }) });
}

// Whitelist destinations and carry the exact source ID. In particular, tapping
// an old termination must not accidentally open the worker's latest contract.
export function getWorkerNotificationDestination(item) {
  const id = Number(item?.sourceId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (item.type === 'interview') return { screen: 'ActiveRequestsScreen', params: { interviewId: id } };
  if (item.type === 'job') return { screen: 'JobConfirmationScreen', params: { hiringId: id } };
  if (item.type === 'termination') return { screen: 'WorkerTerminationScreen', params: { terminationId: id } };
  if (item.type === 'resignation') return { screen: 'WorkerResignationReviewScreen', params: { resignationId: id } };
  if (item.type === 'company-certificate') return { screen: 'WorkerCertificationDetail', params: { workerId: id, viewerRole: 'Worker' } };
  if (item.type === 'course-certificate') return { screen: 'CourseCertificateScreen', params: { certificateId: id } };
  if (item.type === 'police-certificate') return { screen: 'CharacterCertificateScreen', params: { workerId: id, viewerRole: 'Worker' } };
  return null;
}
