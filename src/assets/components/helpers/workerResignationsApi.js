import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE } from '../../config';

/**
 * Worker resignation / end-of-contract client.
 *
 * Ported 1:1 from the React Native app (helpers/workerResignationsApi.js).
 * Note resignations live on the Dashboard controller, not the notifications
 * controller, so BASE points at /api/Dashboard.
 */
const BASE = `${SERVER_BASE}/api/Dashboard`;

export class ResignationApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = 'ResignationApiError'; this.status = status; }
}
const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;

async function request(path, options = {}, signal) {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new ResignationApiError('Please sign in again.', 401);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options, signal: controller.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ResignationApiError(data?.message ||
      (response.status === 401 ? 'Please sign in again.' : response.status === 403 ? 'Please use your Worker login.'
        : `The resignation request failed (HTTP ${response.status}). Check the backend update and retry.`), response.status);
    if (!data || typeof data !== 'object') throw new ResignationApiError('The resignation response was invalid. Please retry.');
    return data;
  } catch (error) {
    if (error instanceof ResignationApiError) throw error;
    throw new ResignationApiError(error?.name === 'AbortError' ? 'The request was cancelled or timed out. Please retry.'
      : 'Could not connect. Check your connection and retry.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function getActiveResignationJob(workerId, signal) {
  if (!validId(workerId)) throw new ResignationApiError('Worker identity is missing. Please sign in again.', 401);
  const data = await request(`/GetActiveJob/${Number(workerId)}`, {}, signal);
  if (data.resignationWorkflowVersion !== 2)
    throw new ResignationApiError('Update and restart the backend before using the new resignation flow.');
  return data;
}

export function submitResignation(interviewId, reason, signal) {
  if (!validId(interviewId)) throw new ResignationApiError('The job could not be selected.');
  return request('/SubmitResignation', { method: 'POST', body: JSON.stringify({
    InterviewId: Number(interviewId), ResignationReason: reason.trim(),
  }) }, signal);
}

export async function getWorkerPendingClientReviews(signal) {
  const data = await request('/GetWorkerPendingClientReviews', {}, signal);
  if (!Array.isArray(data.items) || data.items.some(item => !validId(item?.resignationId))) {
    throw new ResignationApiError('The pending client reviews response was invalid. Please retry.');
  }
  return data.items;
}

export async function getWorkerResignationReview(resignationId, signal) {
  if (!validId(resignationId)) throw new ResignationApiError('This resignation could not be opened.');
  const data = await request(`/GetWorkerResignationReview/${Number(resignationId)}`, {}, signal);
  if (data.resignationId !== Number(resignationId) || !validId(data.interviewId) ||
      typeof data.canReview !== 'boolean' || typeof data.isAccepted !== 'boolean') {
    throw new ResignationApiError('The review response did not match this resignation. Please retry.');
  }
  return data;
}

export function submitWorkerClientReview(interviewId, rating, comment, signal) {
  if (!validId(interviewId)) throw new ResignationApiError('The review contract could not be selected.');
  return request('/SubmitWorkerReviewToClient', { method: 'POST', body: JSON.stringify({
    InterviewId: Number(interviewId), Rating: rating, Comment: comment.trim(),
  }) }, signal);
}
