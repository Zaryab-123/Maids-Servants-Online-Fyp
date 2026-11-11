import React, { useEffect, useRef, useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { getActiveResignationJob, submitResignation } from '../helpers/workerResignationsApi';
import { Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';

/**
 * Resign from Job — parity port of assets/components/Worker/LeaveJobScreen.js.
 *
 * Two deliberate removals compared with the old web screen:
 *   1. the "Proposed Last Working Day" picker — React Native has no such choice
 *      (the notice starts on submission and is fixed by the workflow), and
 *      SubmitResignation ignores LastWorkingDate entirely;
 *   2. the Client Rating / Client Feedback block and the SubmitWorkerReviewToClient
 *      call it made right after submitting. RN states this explicitly:
 *      "No rating or review is required now. After acceptance, your notification bell
 *      will let you review your Client." The backend agrees — SubmitWorkerReviewToClient
 *      is rejected until the resignation is accepted (`canReview` on
 *      GetWorkerResignationReview), so the old flow always ended with
 *      "your rating could not be saved". The review now happens on
 *      WorkerResignationReviewScreen, opened from the "Resignation accepted"
 *      notification.
 */
const LeaveJobScreen = ({ navigation }) => {
    const [reason, setReason] = useState('');
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const active = useRef(false);
    const busy = useRef(false);
    const version = useRef(0);
    const requests = useRef(new Set());

    const pending = job?.isResignationPending === true;

    const load = async () => {
        const requestId = ++version.current;
        const controller = new AbortController();
        requests.current.add(controller);
        setLoading(true);
        setError('');
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const data = await getActiveResignationJob(workerId, controller.signal);
            if (!active.current || version.current !== requestId) return;
            setJob(data);
        } catch (e) {
            if (!active.current || version.current !== requestId) return;
            setError(e.message);
            if (e.status === 401) navigation.replace('Login');
        } finally {
            requests.current.delete(controller);
            if (active.current && version.current === requestId) setLoading(false);
        }
    };

    useEffect(() => {
        active.current = true;
        load();
        return () => {
            active.current = false;
            version.current++;
            requests.current.forEach((controller) => controller.abort());
            requests.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async () => {
        if (busy.current || pending || !job?.interviewId) return;
        if (!reason.trim()) {
            setError('Please provide a reason for resignation.');
            return;
        }

        busy.current = true;
        setSubmitting(true);
        setError('');
        const requestId = version.current;
        const controller = new AbortController();
        requests.current.add(controller);
        try {
            await submitResignation(job.interviewId, reason, controller.signal);
            if (!active.current || version.current !== requestId) return;
            NotificationHelper.showSuccess('Resignation submitted. You can review your client after acceptance.');
            setJob((prev) => ({ ...prev, isResignationPending: true }));
            navigation.navigate('WorkerDashboardScreen');
        } catch (e) {
            if (!active.current || version.current !== requestId) return;
            setError(e.message);
            if (e.status === 401) navigation.replace('Login');
        } finally {
            requests.current.delete(controller);
            if (active.current && version.current === requestId) {
                busy.current = false;
                setSubmitting(false);
            }
        }
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            <div className="v" style={sx(styles.bgDecoration)} />

            <div className="v scroll"><div className="v scroll-content" style={sx(styles.scrollContent)}>
                <div className="v" style={sx(styles.header)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} aria-label="Back" style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Resign from Job</span>
                    <img className="img" alt="" src={imgSrc({ uri: 'https://servantmaidonline.com/logo.png' })} style={sx(styles.logo)} />
                </div>

                {loading ? (
                    <div className="v" style={sx(styles.center)}>
                        <Spinner size="large" color="#1E64D3" />
                    </div>
                ) : null}

                {!!error && (
                    <div className="v" style={sx(styles.errorBox)} role="alert">
                        <span className="t" style={sx(styles.errorText)}>{error}</span>
                        {!job && (
                            <button className="v btn" type="button" onClick={press(() => load())} data-testid="resignation-load-retry">
                                <span className="t" style={sx(styles.retryLink)}>Retry</span>
                            </button>
                        )}
                    </div>
                )}

                {!loading && job && (
                    <>
                        <div className="v" style={sx(styles.jobCard)}>
                            <span className="t" style={sx(styles.employerName)}>{job.employerName}</span>
                            <span className="t" style={sx(styles.employerAddress)}>{job.employerAddress}</span>
                            <div className="v" style={sx(styles.noticeBadge)}>
                                <span className="t" style={sx(styles.noticeText)}>7-Day Notice</span>
                            </div>
                            <span className="t" style={sx(styles.muted)}>
                                Your notice starts when you submit. You stay on this job until the Client accepts
                                your resignation or the seven days expire.
                            </span>
                        </div>

                        {pending ? (
                            <div className="v" style={sx(styles.jobCard)} data-testid="resignation-pending">
                                <span className="t" style={sx(styles.pendingTitle)}>Resignation already pending</span>
                                <span className="t" style={sx(styles.muted)}>
                                    You are still working during the notice period. Your review becomes available
                                    after acceptance.
                                </span>
                                {job.noticeEndsAtUtc ? (
                                    <span className="t" style={sx(styles.muted)}>
                                        Automatic acceptance: {new Date(job.noticeEndsAtUtc).toLocaleString()}
                                    </span>
                                ) : (
                                    <span className="t" style={sx(styles.muted)}>
                                        This older resignation requires the Client’s manual acceptance.
                                    </span>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="v" style={sx(styles.inputGroup)}>
                                    <span className="t" style={sx(styles.inputLabel)}>Reason for Leaving</span>
                                    <textarea className="input"
                                        style={{ ...sx(styles.reasonInput), '--ph': "#999" }}
                                        placeholder="Please explain why you are leaving..."
                                        rows={4}
                                        maxLength={4000}
                                        value={reason ?? ''}
                                        onChange={changeText(setReason)}
                                        disabled={submitting}
                                        data-testid="resignation-reason"
                                    />
                                    <span className="t" style={sx(styles.muted)}>
                                        No rating or review is required now. After acceptance, your notification
                                        bell will let you review your Client.
                                    </span>
                                </div>

                                <button className="v btn" type="button"
                                    style={sx([styles.submitBtn, submitting && styles.submitBtnDisabled])}
                                    onClick={press(submit)}
                                    disabled={submitting}
                                    data-testid="submit-resignation"
                                >
                                    {submitting
                                        ? <Spinner color="#FFF" />
                                        : <span className="t" style={sx(styles.submitBtnText)}>Submit Resignation</span>}
                                </button>
                            </>
                        )}

                        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.cancelBtn)}>
                            <span className="t" style={sx(styles.cancelBtnText)}>Keep Current Job</span>
                        </button>
                    </>
                )}
            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { paddingTop: 40, alignItems: 'center' },
    bgDecoration: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    scrollContent: { padding: 25 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    backBtn: { padding: 5 },
    logo: { width: 40, height: 40 },

    jobCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    employerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    employerAddress: { fontSize: 14, color: '#666', marginTop: 4 },
    noticeBadge: {
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginTop: 15
    },
    noticeText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },
    muted: { color: '#64748B', fontSize: 13, lineHeight: '21px', marginTop: 10 },
    pendingTitle: { color: '#B45309', fontSize: 16, fontWeight: 'bold' },

    errorBox: { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 18 },
    errorText: { color: '#B91C1C', lineHeight: '20px' },
    retryLink: { color: '#1E64D3', fontWeight: 'bold', marginTop: 10 },

    inputGroup: { marginBottom: 25 },
    inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        backgroundColor: '#F9F9F9'
    },

    submitBtn: {
        backgroundColor: '#E91E63',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 2
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cancelBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    cancelBtnText: { color: '#666', fontSize: 16, fontWeight: '500' }
});

export default LeaveJobScreen;
