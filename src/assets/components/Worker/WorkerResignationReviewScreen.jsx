import React, { useCallback, useRef, useState } from 'react';

import Icon from '@/web/Icon';
import { useFocusEffect } from '@/web/navigation';
import { SERVER_BASE } from '../../config';
import ReviewEndReason from '../helpers/ReviewEndReason';
import { getWorkerResignationReview, submitWorkerClientReview } from '../helpers/workerResignationsApi';
import { Spinner, StyleSheet, changeText, imgSrc, press, sx, tin } from '@/web';

/**
 * Rate-the-client review, opened from a `resignation` notification.
 *
 * Ported from the React Native app (Worker/WorkerResignationReviewScreen.js).
 * Reached by tapping any resignation notification, i.e. exactly the path the
 * backend's GetWorkerResignationReview endpoint was written for.
 *
 * Web adaptations: Image → img, multiline TextInput → textarea, and the
 * in-flight AbortController bookkeeping is kept so unmounting the screen
 * cancels outstanding requests instead of setting state on a dead component.
 */
export default function WorkerResignationReviewScreen({ navigation, route }) {
  const resignationId = route?.params?.resignationId;
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const active = useRef(false);
  const version = useRef(0);
  const busy = useRef(false);
  const actionEpoch = useRef(0);
  const requests = useRef(new Set());

  const load = useCallback(async (spinner = true) => {
    const request = ++version.current;
    const controller = new AbortController();
    requests.current.add(controller);
    if (spinner) setLoading(true);
    setError('');
    try {
      const result = await getWorkerResignationReview(resignationId, controller.signal);
      if (!active.current || version.current !== request) return;
      setData(result);
    } catch (e) {
      if (!active.current || version.current !== request) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && version.current === request) setLoading(false);
    }
  }, [resignationId, navigation]);

  useFocusEffect(useCallback(() => {
    active.current = true; actionEpoch.current++;
    busy.current = false;
    setData(null); setRating(0); setComment(''); setSaved(false); setSaving(false);
    load();
    return () => {
      active.current = false; version.current++; actionEpoch.current++;
      requests.current.forEach(controller => controller.abort());
      requests.current.clear();
    };
  }, [load]));

  const submit = async () => {
    if (busy.current || !data?.canReview || data.workerReview) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Please choose a star rating from 1 to 5.'); return;
    }
    busy.current = true;
    setSaving(true); setError('');
    const current = version.current;
    const action = actionEpoch.current;
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      await submitWorkerClientReview(data.interviewId, rating, comment, controller.signal);
      if (!active.current || version.current !== current) return;
      setSaved(true);
      // The successful POST establishes these submitted values. Lock immediately,
      // even if the following detail refresh loses its network connection.
      setData(prev => ({ ...prev, canReview: false, workerReview: {
        rating, comment: comment.trim(), endReasonType: 'Resigned', endReason: prev.reason,
      } }));
      await load(false);
    } catch (e) {
      if (!active.current || version.current !== current) return;
      setError(e.message);
      if (e.status === 401) navigation.replace('Login');
    } finally {
      requests.current.delete(controller);
      if (active.current && actionEpoch.current === action) { busy.current = false; setSaving(false); }
    }
  };

  const review = data?.workerReview;

  return (
    <div className="v screen" style={sx(styles.container)}>
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} aria-label="Back" style={sx(styles.back)}>
          <Icon name="arrow-left" size={24} color="#0F172A" />
        </button>
        <span className="t" style={sx(styles.title)}>Review Your Client</span>
      </div>
      <div className="v scroll" style={sx({ flex: 1 })}>
        <div className="v scroll-content" style={sx(styles.content)}>
          {loading ? <Spinner color="#1E64D3" /> : null}
          {!!error && (
            <div className="v" style={sx(styles.error)} role="alert">
              <span className="t" style={sx(styles.errorText)}>{error}</span>
              <button className="v btn" type="button" onClick={press(() => load())} data-testid="resignation-review-retry">
                <span className="t" style={sx(styles.link)}>Retry</span>
              </button>
            </div>
          )}
          {!loading && data && (
            <>
              <div className="v" style={sx(styles.card)}>
                <span className="t" style={sx(styles.accepted)}>{data.isAccepted
                  ? data.acceptanceMode === 'Automatic' ? 'Resignation automatically accepted' : 'Resignation accepted'
                  : 'Waiting for resignation acceptance'}</span>
                <div className="v" style={sx(styles.person)}>
                  {data.clientPicture
                    ? <img className="img" alt="" style={sx(styles.avatar)} src={imgSrc({ uri: data.clientPicture.startsWith('/') ? `${SERVER_BASE}${data.clientPicture}` : data.clientPicture })} />
                    : <Icon name="account-circle-outline" size={44} color="#64748B" />}
                  <span className="t" style={sx(styles.name)}>{data.clientName}</span>
                </div>
                {data.acceptedAtUtc ? <span className="t" style={sx(styles.muted)}>Job ended: {new Date(data.acceptedAtUtc).toLocaleString()}</span> : null}
                <span className="t" style={sx(styles.reasonLabel)}>Resignation reason</span>
                <span className="t" style={sx(styles.reason)}>{data.reason || 'Reason not provided.'}</span>
              </div>
              {review ? (
                <div className="v" style={sx(styles.card)} data-testid="saved-worker-client-review">
                  <span className="t" style={sx(styles.heading)}>Your saved review</span>
                  <div className="v" style={sx(styles.stars)}>
                    {[1, 2, 3, 4, 5].map(star => <Icon key={star} name={star <= Number(review.rating) ? 'star' : 'star-outline'} size={27} color="#EAB308" />)}
                  </div>
                  {review.date ? <span className="t" style={sx(styles.muted)}>{review.date}</span> : null}
                  <ReviewEndReason endType={review.endReasonType || 'Resigned'} reason={review.endReason || data.reason} />
                  {!!review.comment && <span className="t" style={sx(styles.reason)}>{review.comment}</span>}
                  {!!review.workedPeriod && <span className="t" style={sx(styles.muted)}>Worked: {review.workedPeriod}</span>}
                  <span className="t" style={sx(styles.muted)}>This review is saved and cannot be submitted again.</span>
                </div>
              ) : data.canReview ? (
                <div className="v" style={sx(styles.card)}>
                  <span className="t" style={sx(styles.heading)}>How was your experience?</span>
                  <span className="t" style={sx(styles.muted)}>Your resignation is accepted. You can review now or return to this notification later.</span>
                  <div className="v" style={sx(styles.stars)}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} className="v btn" type="button" data-testid={`client-rating-${star}`}
                        onClick={press(() => setRating(star))} disabled={saving} aria-label={`${star} stars`}>
                        <Icon name={star <= rating ? 'star' : 'star-outline'} size={36} color="#EAB308" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="input"
                    style={sx(styles.input)}
                    {...tin({ editable: !saving, autoCorrect: false })}
                    placeholder="Write your review (optional)"
                    value={(comment) ?? ''}
                    onChange={changeText(setComment)}
                    maxLength={4000}
                    rows={4}
                    data-testid="worker-client-review-comment"
                  />
                  <button className="v btn" type="button" style={sx([styles.button, saving && styles.disabled])}
                    onClick={press(submit)} disabled={saving} data-testid="submit-worker-client-review">
                    {saving ? <Spinner color="#FFFFFF" /> : <span className="t" style={sx(styles.buttonText)}>Submit Review</span>}
                  </button>
                </div>
              ) : <span className="t" style={sx(styles.muted)}>You can submit your review only after this resignation is accepted.</span>}
              {saved && <span className="t" style={sx(styles.accepted)}>Your review has been saved.</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  back: { padding: 8, marginRight: 8 },
  title: { fontSize: 21, fontWeight: '800', color: '#0F172A' },
  content: { padding: 18, paddingBottom: 40 },
  card: { padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  person: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { flex: 1, marginLeft: 12, fontSize: 18, fontWeight: '700', color: '#0F172A' },
  accepted: { color: '#047857', fontSize: 14, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  muted: { color: '#64748B', fontSize: 13, lineHeight: 20, marginTop: 8 },
  reasonLabel: { fontSize: 12, color: '#64748B', marginTop: 14 },
  reason: { color: '#334155', fontSize: 14, lineHeight: 21, marginTop: 6 },
  stars: { flexDirection: 'row', marginVertical: 16, gap: 8 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, minHeight: 110, padding: 12, color: '#0F172A', font: 'inherit', resize: 'vertical' },
  button: { backgroundColor: '#1E64D3', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  error: { borderRadius: 12, padding: 14, backgroundColor: '#FEF2F2', marginBottom: 16 },
  errorText: { color: '#B91C1C', lineHeight: 20 },
  link: { color: '#1E64D3', fontWeight: '700', marginTop: 10 },
});
