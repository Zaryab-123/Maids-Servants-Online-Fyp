import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';
import { Alert, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


const ResignationScreen = ({ route, navigation }) => {
    const { resignationId } = route.params || {};
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);
    const [rating, setRating] = useState(3);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // "Confirmed" now means the CLIENT has confirmed + reviewed this contract.
    // (The API used to answer this off ANY review row for the interview, so the
    // worker's own review — written while resigning — locked this whole screen.)
    const isConfirmed = data?.isConfirmed === true;

    // Before confirming the stars are the client's input; afterwards they show the
    // rating that was actually stored.
    const shownRating = isConfirmed ? (data?.clientReview?.rating ?? 0) : rating;

    useEffect(() => {
        if (!resignationId) {
            NotificationHelper.showError("This resignation could not be opened.");
            navigation.goBack();
            return;
        }
        fetchResignationDetail();
    }, [resignationId]);

    const fetchResignationDetail = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetResignationDetail/${resignationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const json = await response.json();
                setData(json);
            } else {
                NotificationHelper.showError("Failed to load details.");
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network error.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmResignation = async () => {
        if (!remarks.trim()) {
            NotificationHelper.showError("Please enter some remarks before confirming.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/ConfirmResignation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    InterviewId: data.interviewId,
                    Rating: rating,
                    Comment: remarks
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Resignation confirmed. Your review of the worker was saved.");
                // Back to the list, which refetches on focus — the row moves to Completed.
                navigation.navigate('ResignationsScreen');
            } else {
                const err = await response.json();
                NotificationHelper.showError(err.message || "Failed to confirm.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Server error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (size = 30) => (
        <div className="v" style={sx(styles.starRow)}>
            {[1, 2, 3, 4, 5].map((star) => (
                isConfirmed ? (
                    <Icon
                        key={star}
                        name={star <= shownRating ? 'star' : 'star-outline'}
                        size={size}
                        color={star <= shownRating ? '#FFC107' : '#D0D5DD'}
                    />
                ) : (
                    <button className="v btn" type="button"
                        key={star}
                        onClick={press(() => setRating(star))}
                        
                        style={sx(styles.starTap)}
                    >
                        <Icon
                            name={star <= shownRating ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= shownRating ? '#FFC107' : '#D0D5DD'}
                        />
                    </button>
                )
            ))}
        </div>
    );

    if (isLoading) {
        return (
            <div className="v" style={sx(styles.center)}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* ── Header ── */}
            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backCircle)}>
                    <Icon name="arrow-left" size={20} color="#374151" />
                </button>
                <span className="t" style={sx(styles.headerTitle)}>Resignation</span>
                <img className="img" alt="" src={imgSrc(__img_logo_png)} style={sx(styles.logo)} />
            </div>

            <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>

                {/* ── Who is resigning ── */}
                <div className="v" style={sx(styles.profileCard)}>
                    <img className="img" alt=""
                        src={imgSrc({
                            uri: data.workerAvatar && data.workerAvatar.startsWith('/')
                                ? `${SERVER_BASE}${data.workerAvatar}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        })}
                        style={sx(styles.avatar)}
                    />
                    <div className="v" style={sx(styles.profileText)}>
                        <span className="t" style={sx(styles.workerName, 1)} >{data.workerName}</span>
                        <div className="v" style={sx(styles.roleChip)}>
                            <Icon name="briefcase-outline" size={12} color="#1E64D3" />
                            <span className="t" style={sx(styles.workerRole, 1)} >{data.workerRole}</span>
                        </div>
                    </div>
                </div>

                {/* ── Notice period ── */}
                <div className="v" style={sx(styles.noticeCard)}>
                    <div className="v" style={sx(styles.noticeBlueHeader)}>
                        <div className="v">
                            <span className="t" style={sx(styles.noticeHeaderLabel)}>Official Notice Period</span>
                            <span className="t" style={sx(styles.noticeHeaderDays)}>{data.totalNoticeDays} Days Total</span>
                        </div>
                        <div className="v" style={sx(styles.noticeBadge)}>
                            <span className="t" style={sx(styles.noticeBadgeText)}>{data.remainingDays} left</span>
                        </div>
                    </div>
                    <div className="v" style={sx(styles.noticeBody)}>
                        <div className="v" style={sx(styles.noticeStatusRow)}>
                            <span className="t" style={sx(styles.noticeStatusLabel)}>Notice Period Status</span>
                            <span className="t" style={sx(styles.remainingText)}>
                                Remaining Days: <span className="t" style={sx(styles.boldBlue)}>{data.remainingDays}</span>
                            </span>
                        </div>
                        <div className="v" style={sx(styles.progressBarContainer)}>
                            <div className="v" style={sx([styles.progressBarFill, { width: `${Math.min(Math.max(data.progress * 100, 0), 100)}%` }])} />
                        </div>
                    </div>
                </div>

                {/* ── Dates & reason ── */}
                <div className="v" style={sx(styles.infoCard)}>
                    <div className="v" style={sx(styles.infoRow)}>
                        <div className="v" style={sx(styles.infoIconBox)}>
                            <Icon name="calendar-check-outline" size={16} color="#1E64D3" />
                        </div>
                        <div className="v" style={sx(styles.infoTextCol)}>
                            <span className="t" style={sx(styles.infoLabel)}>Last Working Day</span>
                            <span className="t" style={sx(styles.infoValue)}>{data.lastWorkingDate}</span>
                        </div>
                    </div>

                    <div className="v" style={sx(styles.divider)} />

                    <div className="v" style={sx(styles.infoRow)}>
                        <div className="v" style={sx(styles.infoIconBox)}>
                            <Icon name="text-box-outline" size={16} color="#1E64D3" />
                        </div>
                        <div className="v" style={sx(styles.infoTextCol)}>
                            <span className="t" style={sx(styles.infoLabel)}>Reason for Leaving</span>
                            <span className="t" style={sx(styles.infoValueReason)}>{data.reason}</span>
                        </div>
                    </div>
                </div>

                {/* ── What the worker said about you ── */}
                {data.workerReview ? (
                    <div className="v" style={sx(styles.workerReviewCard)}>
                        <div className="v" style={sx(styles.workerReviewHeader)}>
                            <div className="v" style={sx(styles.workerReviewIconBox)}>
                                <Icon name="comment-quote-outline" size={14} color="#1E64D3" />
                            </div>
                            <span className="t" style={sx(styles.workerReviewTitle, 1)} >
                                {data.workerName}&apos;s review of you
                            </span>
                        </div>

                        <div className="v" style={sx(styles.reviewMetaRow)}>
                            {renderStars(16)}
                            <span className="t" style={sx(styles.reviewRatingText)}>
                                {Number(data.workerReview.rating || 0).toFixed(1)}
                            </span>
                            <span className="t" style={sx(styles.reviewMetaDate)}>· {data.workerReview.date}</span>
                        </div>

                        {data.workerReview.comment ? (
                            <span className="t" style={sx(styles.reviewCommentQuoted)}>
                                &quot;{data.workerReview.comment}&quot;
                            </span>
                        ) : null}

                        {data.workerReview.workedPeriod ? (
                            <div className="v" style={sx(styles.workedRow)}>
                                <Icon name="briefcase-outline" size={12} color="#1E64D3" />
                                <span className="t" style={sx(styles.workedText)}>Worked: {data.workerReview.workedPeriod}</span>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {/* ── Your review ── */}
                <div className="v" style={sx(styles.reviewCard)}>
                    <div className="v" style={sx(styles.reviewTopRow)}>
                        <span className="t" style={sx(styles.reviewCardTitle)}>Your Review</span>
                        {isConfirmed ? (
                            <div className="v" style={sx(styles.savedChip)}>
                                <Icon name="check-circle" size={12} color="#15803D" />
                                <span className="t" style={sx(styles.savedChipText)}>Saved</span>
                            </div>
                        ) : null}
                    </div>

                    {isConfirmed ? (
                        <div className="v">
                            <div className="v" style={sx(styles.reviewMetaRow)}>
                                {renderStars(18)}
                                <span className="t" style={sx(styles.reviewRatingText)}>
                                    {Number(shownRating || 0).toFixed(1)}
                                </span>
                                {data.clientReview?.date ? (
                                    <span className="t" style={sx(styles.reviewMetaDate)}>· {data.clientReview.date}</span>
                                ) : null}
                            </div>

                            {data.clientReview?.comment ? (
                                <span className="t" style={sx(styles.reviewCommentQuoted)}>
                                    &quot;{data.clientReview.comment}&quot;
                                </span>
                            ) : null}

                            <div className="v" style={sx(styles.lockNote)}>
                                <Icon name="lock-outline" size={13} color="#15803D" />
                                <span className="t" style={sx(styles.lockNoteText)}>
                                    You confirmed this resignation
                                    {data.clientReview?.date ? ` on ${data.clientReview.date}` : ''}.
                                    Your rating of {data.workerName} is saved and can no longer be changed.
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="v">
                            <span className="t" style={sx(styles.reviewHint)}>
                                Tap a star to rate {data.workerName}, then write your remarks.
                            </span>

                            <div className="v" style={sx(styles.reviewMetaRow)}>{renderStars(30)}</div>

                            <textarea className="input"
                                style={{ ...sx(styles.remarksInput), '--ph': "#9CA3AF" }}
                                placeholder="Enter your remarks here"
                                
                                value={(remarks) ?? ''}
                                onChange={changeText(setRemarks)}
                                
                                
                            />
                        </div>
                    )}
                </div>

                {/* ── Action ── */}
                {isConfirmed ? (
                    <div className="v" style={sx(styles.confirmedBtnLocked)}>
                        <Icon name="check-circle" size={19} color="#15803D" />
                        <span className="t" style={sx(styles.confirmedBtnLockedText)}>Resignation Confirmed</span>
                    </div>
                ) : (
                    <button className="v btn" type="button"
                        style={sx([styles.confirmBtn, isSubmitting && styles.confirmBtnBusy])}
                        onClick={press(handleConfirmResignation)}
                        disabled={isSubmitting}
                        
                    >
                        {isSubmitting ? (
                            <Spinner color="#FFF" />
                        ) : (
                            <div className="v" style={sx(styles.confirmBtnInner)}>
                                <Icon name="check-circle-outline" size={20} color="#FFF" />
                                <span className="t" style={sx(styles.confirmBtnText)}>Confirm Resignation</span>
                            </div>
                        )}
                    </button>
                )}

            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F8FC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F8FC' },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F6'
    },
    backCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    logo: { width: 40, height: 40 },

    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },

    /* ── Worker ── */
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 14,
        marginBottom: 14
    },
    avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EEF1F6' },
    profileText: { flex: 1, marginLeft: 14 },
    workerName: { fontSize: 19, fontWeight: '800', color: '#111827' },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#EEF4FF',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3,
        marginTop: 6
    },
    workerRole: { fontSize: 12, fontWeight: '700', color: '#1E64D3', marginLeft: 5 },

    /* ── Notice period ── */
    noticeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        overflow: 'hidden',
        marginBottom: 14
    },
    noticeBlueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4F7BF0',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    noticeHeaderLabel: { color: '#DCE6FF', fontSize: 13, fontWeight: '600' },
    noticeHeaderDays: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 2 },
    noticeBadge: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    noticeBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    noticeBody: { padding: 16 },
    noticeStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    noticeStatusLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
    remainingText: { fontSize: 13, color: '#6B7280' },
    boldBlue: { color: '#1E64D3', fontWeight: '800' },
    progressBarContainer: {
        height: 7,
        backgroundColor: '#EEF1F6',
        borderRadius: 4,
        marginTop: 14,
        overflow: 'hidden',
        width: '100%'
    },
    progressBarFill: { height: '100%', backgroundColor: '#4F7BF0', borderRadius: 4 },

    /* ── Info card (dates + reason) ── */
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 14
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
    infoIconBox: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: '#EEF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    infoTextCol: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3
    },
    infoValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
    infoValueReason: { fontSize: 14, color: '#374151', lineHeight: 21 },
    divider: { height: 1, backgroundColor: '#F1F5F9' },

    /* ── Review blocks ── */
    workerReviewCard: {
        backgroundColor: '#F7FAFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D6E4FF',
        padding: 14,
        marginBottom: 14
    },
    workerReviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    workerReviewIconBox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#E4EEFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8
    },
    workerReviewTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#1F2937' },

    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 14,
        marginBottom: 18
    },
    reviewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewCardTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
    savedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF3',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 3
    },
    savedChipText: { fontSize: 11, fontWeight: '800', color: '#15803D', marginLeft: 4 },

    reviewHint: { fontSize: 13, color: '#6B7280', marginTop: 6, marginBottom: 10 },
    reviewMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    starRow: { flexDirection: 'row', alignItems: 'center' },
    starTap: { paddingRight: 6 },
    reviewRatingText: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginLeft: 8 },
    reviewMetaDate: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
    reviewCommentQuoted: {
        fontSize: 14,
        color: '#334155',
        fontStyle: 'italic',
        lineHeight: 20,
        marginTop: 10
    },

    remarksInput: {
        minHeight: 84,
        borderWidth: 1,
        borderColor: '#DDE3EC',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#FBFCFF',
        marginTop: 12,
        textAlignVertical: 'top'
    },

    lockNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F2FBF5',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
        marginTop: 12
    },
    lockNoteText: { flex: 1, fontSize: 12.5, color: '#166534', lineHeight: 18, marginLeft: 7 },

    workedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    workedText: { fontSize: 12, color: '#1E64D3', fontWeight: '700', marginLeft: 5 },

    /* ── Action ── */
    confirmBtn: {
        backgroundColor: '#16A34A',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmBtnBusy: { opacity: 0.7 },
    confirmBtnInner: { flexDirection: 'row', alignItems: 'center' },
    confirmBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginLeft: 8 },
    confirmedBtnLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: 14,
        backgroundColor: '#E9F9EF',
        borderWidth: 1,
        borderColor: '#A7E0BC'
    },
    confirmedBtnLockedText: { color: '#15803D', fontSize: 17, fontWeight: '800', marginLeft: 8 }
});

export default ResignationScreen;
