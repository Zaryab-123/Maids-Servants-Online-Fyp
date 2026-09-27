import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import { Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';
import __img_default_user_png from '../../images/default-user.png';


const API_BASE = API_DASHBOARD;

const WorkerDecisionScreen = ({ navigation }) => {
    const [decisions, setDecisions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        fetchDecisions();
    }, []);

    const fetchDecisions = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetClientWorkerDecisions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setDecisions(data);
            } else {
                NotificationHelper.showError("Failed to fetch decision tracking records.");
            }
        } catch (error) {
            NotificationHelper.showError("Network connection failure.");
        } finally {
            setIsLoading(false);
        }
    };

    // Rule 5: User confirms and finalizes accepted worker responses
    const handleFinalizeHiring = async (hiringId) => {
        setSubmittingId(hiringId);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/FinalizeHiringDecision`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    HiringId: hiringId,
                    HiringDecision: 'Accepted'
                })
            });

            if (response.ok) {
                NotificationHelper.showSuccess('Hiring decision finalized successfully.');
                await fetchDecisions();
            } else {
                NotificationHelper.showError("Failed to update final hiring state.");
            }
        } catch (error) {
            NotificationHelper.showError("Network failure processing handshake.");
        } finally {
            setSubmittingId(null);
        }
    };

    const filteredDecisions = decisions.filter(item =>
        item.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header bar */}
            <div className="v" style={sx(styles.headerBar)}>
                <div className="v" style={sx(styles.headerLeft)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Worker Decision</span>
                </div>
                <div className="v" style={sx(styles.logoBox)}>
                    <img className="img" alt=""
                        src={imgSrc(__img_logo_png)}
                        style={sx(styles.logoImage)}
                    />
                </div>
            </div>

            {/* Search bar */}
            <div className="v" style={sx(styles.searchContainer)}>
                <Icon name="magnify" size={22} color="#9CA3AF" style={{ marginRight: 8 }} />
                <input className="input"
                    style={{ ...sx(styles.searchInput), '--ph': "#9CA3AF" }}
                    placeholder="Search by Worker name"
                    
                    value={(searchQuery) ?? ''}
                    onChange={changeText(setSearchQuery)}
                />
            </div>

            {isLoading ? (
                <Spinner size="large" color="#1E64D3" style={styles.loader} />
            ) : filteredDecisions.length === 0 ? (
                <div className="v" style={sx(styles.emptyContainer)}>
                    <Icon name="comment-question-outline" size={60} color="#BDC3C7" />
                    <span className="t" style={sx(styles.emptyText)}>No pending active worker job offer decisions located.</span>
                </div>
            ) : (
                <div className="v scroll"  ><div className="v scroll-content card-grid" style={sx(styles.scrollContainer)}>
                    {filteredDecisions.map((item) => {
                        const imgSource = item.workerImage
                            ? { uri: item.workerImage.startsWith('http') ? item.workerImage : `${SERVER_BASE}${item.workerImage}` }
                            : __img_default_user_png;

                        const isAccepted = item.workerDecision === 'Accepted';
                        const isRejected = item.workerDecision === 'Rejected';
                        const isFinalized = item.hiringDecision === 'Accepted';
                        const canFinalize = isAccepted && item.hiringDecision === 'Pending';

                        return (
                            <div className="v grid-item"
                                key={item.hiringId}
                                style={sx([
                                    styles.card,
                                    isAccepted ? styles.cardAccepted : isRejected ? styles.cardRejected : {}
                                ])}
                            >
                                {/* Card header label */}
                                <span className="t" style={sx([
                                    styles.cardLabel,
                                    isAccepted ? styles.cardLabelAccepted : styles.cardLabelRejected
                                ])}>
                                    {isAccepted ? 'Worker Accepted!' : isRejected ? 'Worker Rejected!' : 'Offer Pending'}
                                </span>

                                {/* Avatar + Name row */}
                                <div className="v" style={sx(styles.profileRow)}>
                                    <div className="v" style={sx(styles.avatarCircle)}>
                                        <img className="img" alt="" src={imgSrc(imgSource)} style={sx(styles.avatar)} />
                                    </div>
                                    <div className="v" style={sx(styles.nameBlock)}>
                                        <span className="t" style={sx(styles.workerName)}>{item.workerName}</span>
                                        <JobTypeBadge jobType={item.jobType} small style={styles.jobTypeBadge} />
<SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} small style={styles.slotTimeLabel} />
                                        <div className="v" style={sx([
                                            styles.statusBadge,
                                            isAccepted ? styles.badgeAccepted : isRejected ? styles.badgeRejected : styles.badgePending
                                        ])}>
                                            <Icon
                                                name={isAccepted ? 'account-check' : isRejected ? 'account-cancel' : 'account-clock'}
                                                size={13}
                                                color={isAccepted ? '#15803D' : isRejected ? '#B91C1C' : '#92400E'}
                                                style={{ marginRight: 4 }}
                                            />
                                            <span className="t" style={sx([
                                                styles.statusBadgeText,
                                                isAccepted ? styles.badgeTextAccepted : isRejected ? styles.badgeTextRejected : styles.badgeTextPending
                                            ])}>
                                                {isAccepted ? 'Acceptance Confirm' : isRejected ? 'Rejected' : 'Offer Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info section */}
                                <div className="v" style={sx(styles.infoSection)}>
                                    {item.hiringDate && (
                                        <span className="t" style={sx(styles.infoText)}>
                                            <span className="t" style={sx(styles.bold)}>Decision Date: </span>
                                            {new Date(item.hiringDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                        </span>
                                    )}
                                    <span className="t" style={sx(styles.infoText)}>
                                        <span className="t" style={sx(styles.bold)}>Job Role</span>: {item.workerSkill}
                                    </span>
                                    <span className="t" style={sx(styles.infoText)}>
                                        <span className="t" style={sx(styles.bold)}>Address</span>: {item.address}
                                    </span>
                                    <span className="t" style={sx(styles.noteText)}>
                                        {isAccepted
                                            ? `${item.workerName} is excited to start.`
                                            : isRejected
                                            ? `${item.workerName} has chosen another offer . Your other worker are below.`
                                            : 'Awaiting worker response.'}
                                    </span>
                                </div>

                                {/* Action button */}
                                {canFinalize && (
                                    <div className="v" style={sx(styles.actionRow)}>
                                        {submittingId === item.hiringId ? (
                                            <Spinner size="small" color="#1E64D3" />
                                        ) : (
                                            <button className="v btn" type="button"
                                                style={sx(styles.confirmBtn)}
                                                onClick={press(() => handleFinalizeHiring(item.hiringId))}
                                            >
                                                <span className="t" style={sx(styles.confirmBtnText)}>Confirm</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isFinalized && (
                                    <div className="v" style={sx(styles.actionRow)}>
                                        <div className="v" style={sx(styles.finalizedBadge)}>
                                            <Icon name="check-all" size={16} color="#15803D" />
                                            <span className="t" style={sx(styles.finalizedText)}>Hiring Handshake Finalized</span>
                                        </div>
                                    </div>
                                )}

                                {isRejected && (
                                    <div className="v" style={sx(styles.actionRow)}>
                                        <button className="v btn" type="button" style={sx(styles.viewOtherBtn)}>
                                            <span className="t" style={sx(styles.viewOtherBtnText)}>View Other Worker</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div></div>
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    slotTimeLabel: { marginTop: 4 },
    jobTypeBadge: { marginTop: 4 },
    container: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },

    /* ── Header ── */
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.3,
    },
    logoBox: {
        width: 110,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 110,
        height: 90,
        resizeMode: 'contain',
    },

    /* ── Search ── */
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginHorizontal: 16,
        marginTop: 14,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        paddingVertical: 0,
    },

    /* ── Empty / Loader ── */
    loader: { marginTop: 40 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#7F8C8D',
        fontSize: 15,
        marginTop: 10,
    },

    /* ── Scroll ── */
    scrollContainer: {
        paddingHorizontal: 16,
        paddingBottom: 28,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    cardAccepted: {
        borderColor: '#22C55E',
    },
    cardRejected: {
        borderColor: '#EF4444',
    },

    cardLabel: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    cardLabelAccepted: {
        color: '#16A34A',
    },
    cardLabelRejected: {
        color: '#DC2626',
    },

    /* Avatar */
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DBEAFE',
        borderWidth: 2,
        borderColor: '#93C5FD',
        overflow: 'hidden',
        marginRight: 14,
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
    },
    nameBlock: {
        flex: 1,
    },
    workerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },

    /* Status badge */
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 14,
    },
    badgeAccepted: {
        backgroundColor: '#DCFCE7',
    },
    badgeRejected: {
        backgroundColor: '#FEE2E2',
    },
    badgePending: {
        backgroundColor: '#FEF3C7',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    badgeTextAccepted: { color: '#15803D' },
    badgeTextRejected: { color: '#B91C1C' },
    badgeTextPending:  { color: '#92400E' },

    /* Info */
    infoSection: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
        lineHeight: 20,
    },
    bold: {
        fontWeight: '700',
        color: '#111827',
    },
    noteText: {
        fontSize: 14,
        color: '#374151',
        marginTop: 6,
        lineHeight: 20,
    },

    /* Actions */
    actionRow: {
        alignItems: 'center',
        marginTop: 4,
    },
    confirmBtn: {
        backgroundColor: '#1E64D3',
        borderRadius: 24,
        paddingVertical: 12,
        width: '80%',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#1E64D3',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    confirmBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    viewOtherBtn: {
        backgroundColor: '#E5E7EB',
        borderRadius: 24,
        paddingVertical: 12,
        width: '80%',
        alignItems: 'center',
    },
    viewOtherBtnText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '700',
    },
    finalizedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
        paddingVertical: 10,
        borderRadius: 12,
        width: '80%',
    },
    finalizedText: {
        color: '#15803D',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 6,
    },
});

export default WorkerDecisionScreen;