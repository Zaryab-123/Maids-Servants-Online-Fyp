/**
 * Exclusivity indicators — a 1:1 port of the four places React Native shows them.
 *
 * RN reference:
 *   Worker/ActiveRequestsScreen.js:193   orange box  "Exclusive full-time request"   (+ long explanation)
 *   Worker/AcceptedRequestScreen.js:176  orange box  "Exclusive full-time request"   (+ shorter explanation)
 *   Worker/JobConfirmationScreen.js:278  orange box  "Exclusive full-time offer"
 *   Client/WorkerDecisionScreen.js:157   inline text "Exclusive full-time commitment"
 *
 * The API already ANDs exclusivity with a full-time job type
 * (DashboardController.cs: `isExclusive = i.IsExclusive && i.JobType == "Full-Time"`),
 * but RN re-checks the job type at render time and so do we, so a stray `jobType`
 * can never show the notice on a part-time request.
 *
 * Note: `GetActiveRequests/{clientId}` (the client's Interview List) does **not**
 * project any exclusivity field — see the note in CHANGES.md. Nothing can be shown
 * there without a backend change.
 */
import React from 'react';

/** RN's guard, verbatim: `item.isExclusive && jobType === 'full-time'`. */
export const isExclusiveFullTime = (item) => {
  if (!item) return false;
  // GetClientWorkerDecisions serialises it as IsExclusive; everything else is camelCase.
  const flag = item.isExclusive !== undefined ? item.isExclusive : item.IsExclusive;
  return Boolean(flag) && String(item.jobType || '').toLowerCase() === 'full-time';
};

const BOX = {
  backgroundColor: '#FFF7ED',
  border: '1px solid #FDBA74',
  borderRadius: 10,
  padding: 11,
  marginBottom: 12,
};
const TITLE = { color: '#9A3412', fontWeight: 800, fontSize: 13 };
const BODY = { color: '#7C2D12', fontSize: 12, marginTop: 4, lineHeight: '18px' };

const COPY = {
  // Worker/ActiveRequestsScreen.js:195
  request: {
    title: 'Exclusive full-time request',
    body:
      'If the client confirms hiring, you agree not to accept other full-time work until you submit ' +
      'a resignation or the contract is terminated. Accepting this interview request alone does not ' +
      'activate the restriction.',
  },
  // Worker/AcceptedRequestScreen.js:178
  accepted: {
    title: 'Exclusive full-time request',
    body:
      'The restriction starts only if the client confirms hiring. If confirmed, you cannot accept ' +
      'other full-time work until resignation submission or termination.',
  },
  // Worker/JobConfirmationScreen.js:280
  offer: {
    title: 'Exclusive full-time offer',
    body:
      'If you accept and the client confirms this offer, you agree not to accept other full-time ' +
      'work until you submit a resignation or the contract is terminated. Your profile will go ' +
      'offline on client confirmation.',
  },
};

/**
 * The orange explanation box.
 * @param {object} props.item      the API row (`isExclusive` / `IsExclusive` + `jobType`)
 * @param {'request'|'accepted'|'offer'} props.variant  which RN copy to use
 * @param {object} [props.style]   extra layout (JobConfirmation adds horizontal margin)
 */
export default function ExclusiveNotice({ item, variant = 'request', style }) {
  if (!isExclusiveFullTime(item)) return null;
  const copy = COPY[variant] || COPY.request;
  return (
    <div className="v" style={{ ...BOX, ...style }}>
      <span className="t" style={TITLE}>{copy.title}</span>
      <span className="t" style={BODY}>{copy.body}</span>
    </div>
  );
}

/** Client/WorkerDecisionScreen.js:157 — the compact one-liner under the job-type badge. */
export function ExclusiveInline({ item, style }) {
  if (!isExclusiveFullTime(item)) return null;
  return (
    <span className="t" style={{ color: '#9A3412', fontSize: 12, fontWeight: 700, marginTop: 4, ...style }}>
      Exclusive full-time commitment
    </span>
  );
}
