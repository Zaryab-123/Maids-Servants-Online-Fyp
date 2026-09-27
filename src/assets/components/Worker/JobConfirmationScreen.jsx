import React, { useState, useEffect, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import ResidenceBadge from '../helpers/ResidenceBadge';
import { RefreshControl, ScrollView, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const API_BASE = `${SERVER_BASE}/api/Dashboard`;

const JobConfirmationScreen = ({ navigation }) => {
    const [jobs, setJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchJobConfirmations();
    }, []);

    const fetchJobConfirmations = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/GetWorkerJobConfirmations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
                NotificationHelper.showError('Failed to fetch job offers.');
                return;
            }
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            NotificationHelper.showError('Server error.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchJobConfirmations(false);
    }, []);

    // Worker accepts the offer
    const handleAcceptJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerAcceptJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job accepted!');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error accepting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Worker rejects the offer
    const handleRejectJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/WorkerRejectJobOffer/${hiringId}`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job offer rejected.');
                fetchJobConfirmations(false);
            } else {
                NotificationHelper.showError('Error rejecting job.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // After rejection or termination, remove the hiring record from the list
    const handleDeleteJob = async (hiringId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(
                `${API_BASE}/ClientDismissWorkerRejection/${hiringId}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                NotificationHelper.showSuccess('Job request removed.');
                setJobs(prevJobs => prevJobs.filter(j => j?.id !== hiringId));
            } else {
                NotificationHelper.showError('Failed to remove request.');
            }
        } catch {
            NotificationHelper.showError('Network Error');
        }
    };

    // Filter safely by client name
    const filteredJobs = jobs.filter(job =>
        job?.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderJobCard = (item) => {
        const {
            id, clientId, clientName, clientImage, clientRating,
            date, role, address, message, type, status, jobType, isResidenceProvided, slotStartTime, slotEndTime
        } = item;
        const hiringId = id;

        // Determine UI state
        const pendingWorker = type === 'offered';
        const rawStatus = status ? status.toString() : '';
        const statusLower = rawStatus.toLowerCase();
        const rejectedByClient = statusLower.includes('unable') || statusLower.includes('sorry') || statusLower.includes('rejected');
        const rejectedWorker = type === 'rejected' || rejectedByClient;
        const acceptedWorker = type === 'accepted' && !rejectedByClient;
        const finalized = type === 'final';
        const terminated = type === 'terminated';

        // Dynamic Card Color Configurations
        let borderColor = '#1E64D3'; // Default blue
        let statusBg = '#E3F2FD';
        let statusTextColor = '#1E64D3';
        let statusHeaderText = 'Job Offer';

        if (rejectedWorker) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Job Rejected';
        } else if (finalized) {
            borderColor = '#4CAF50';
            statusBg = '#C8E6C9';
            statusTextColor = '#388E3C';
            statusHeaderText = 'Hired!';
        } else if (pendingWorker) {
            borderColor = '#FF9800'; // Amber alert warning status for explicit pending actions
            statusBg = '#FFE0B2';
            statusTextColor = '#E65100';
            statusHeaderText = 'New Job Offer';
        } else if (acceptedWorker) {
            borderColor = '#90A4AE';
            statusBg = '#ECEFF1';
            statusTextColor = '#455A64';
            statusHeaderText = 'Accepted';
        } else if (terminated) {
            borderColor = '#FF5252';
            statusBg = '#FFCDD2';
            statusTextColor = '#D32F2F';
            statusHeaderText = 'Contract Terminated';
        }

        const displayStatus = rejectedWorker
            ? 'Rejected'
            : terminated
                ? 'Contract Terminated'
                : acceptedWorker
                    ? 'Accepted'
                    : status || 'Pending';

        const ratingValue = Number(clientRating) || 0;
        const hasRating = ratingValue > 0;

        const avatarUri = clientImage
            ? (clientImage.startsWith('http') ? clientImage : `${SERVER_BASE}${clientImage}`)
            : null;

        const detailRows = [
            { icon: 'calendar-range', label: 'Interview Date', value: date || 'Not set' },
            { icon: 'briefcase-outline', label: 'Job Role', value: role || 'Not set' },
            { icon: 'tag-outline', label: 'Job Type', value: jobType || 'Full-Time' },
            { icon: 'map-marker-outline', label: 'Address', value: address || 'Not set' },
        ];

        return (
            <div className="v" key={hiringId.toString()} style={sx(styles.card)}>
                <div className="v" style={sx([styles.cardAccent, { backgroundColor: borderColor }])} />

                {/* Row 1 — state + booking type */}
                <div className="v" style={sx(styles.cardTopRow)}>
                    <div className="v" style={sx([styles.statusPill, { backgroundColor: statusBg }])}>
                        <div className="v" style={sx([styles.statusDot, { backgroundColor: borderColor }])} />
                        <span className="t" style={sx([styles.statusPillText, { color: statusTextColor }])}>
                            {statusHeaderText}
                        </span>
                    </div>
                    <JobTypeBadge jobType={jobType} small />
                </div>

                {/* Row 2 — who sent the offer */}
                <div className="v" style={sx(styles.clientRow)}>
                    <div className="v" style={sx(styles.imageContainer)}>
                        {avatarUri ? (
                            <img className="img" alt="" src={imgSrc({ uri: avatarUri })} style={sx(styles.avatar)} />
                        ) : (
                            <div className="v" style={sx(styles.avatarFallback)}>
                                <Icon name="account" size={28} color="#94A3B8" />
                            </div>
                        )}
                        <div className="v" style={sx(styles.verifiedIcon)}>
                            <Icon
                                name={rejectedWorker ? 'account-cancel' : 'account-check'}
                                size={12}
                                color={statusTextColor}
                            />
                        </div>
                    </div>

                    <div className="v" style={sx(styles.nameCol)}>
                        <button className="v btn" type="button"
                            onClick={press(() => {
                                if (clientId) {
                                    navigation.navigate('ClientProfileScreen', { clientId: clientId, id: clientId });
                                }
                            })}
                            disabled={!clientId}
                        >
                            <span className="t" style={sx(styles.clientName, 1)}  >
                                {clientName || 'Client Profile'}
                            </span>
                        </button>
                        <span className="t" style={sx(styles.clientCaption, 1)} >
                            {pendingWorker ? 'Sent you a job offer' : displayStatus}
                        </span>
                    </div>

                    <div className="v" style={sx([styles.ratingBadge, !hasRating && styles.ratingBadgeMuted])}>
                        <Icon
                            name={hasRating ? 'star' : 'star-outline'}
                            size={12}
                            color={hasRating ? '#F59E0B' : '#94A3B8'}
                        />
                        <span className="t" style={sx([styles.ratingText, !hasRating && styles.ratingTextMuted])}>
                            {hasRating ? ratingValue.toFixed(1) : 'New'}
                        </span>
                    </div>
                </div>

                {/* Row 3 — the reserved window (part-time only) + residence badge + current state */}
                <div className="v" style={sx(styles.chipRow)}>
                    <ResidenceBadge isResidenceProvided={isResidenceProvided} small />
                    <SlotTimeLabel startTime={slotStartTime} endTime={slotEndTime} small />
                    <div className="v" style={sx(styles.stateChip)}>
                        <span className="t" style={sx(styles.stateChipText)}>{displayStatus}</span>
                    </div>
                </div>

                <div className="v" style={sx(styles.divider)} />

                {/* Row 4 — the offer details */}
                <div className="v" style={sx(styles.detailsSection)}>
                    {detailRows.map((row) => (
                        <div className="v" key={row.label} style={sx(styles.detailRow)}>
                            <div className="v" style={sx(styles.detailIconBox)}>
                                <Icon name={row.icon} size={15} color={statusTextColor} />
                            </div>
                            <span className="t" style={sx(styles.detailLabel)}>{row.label}</span>
                            <span className="t" style={sx(styles.detailValue, 2)} >{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Row 5 — the client's message */}
                {message ? (
                    <div className="v" style={sx(styles.messageBox)}>
                        <Icon name="message-text-outline" size={14} color="#64748B" />
                        <span className="t" style={sx(styles.messageText)}>{message}</span>
                    </div>
                ) : null}

                {/* Row 6 — actions */}
                <div className="v" style={sx(styles.buttonRow)}>
                    {pendingWorker && (
                        <>
                            <button className="v btn" type="button"
                                style={sx(styles.rejectBtn)}
                                onClick={press(() => handleRejectJob(hiringId))}
                                
                            >
                                <span className="t" style={sx(styles.btnTextGrey)}>Reject</span>
                            </button>
                            <button className="v btn" type="button"
                                style={sx(styles.acceptBtn)}
                                onClick={press(() => handleAcceptJob(hiringId))}
                                
                            >
                                <Icon name="check" size={16} color="#FFF" />
                                <span className="t" style={sx(styles.btnTextWhite)}>Accept</span>
                            </button>
                        </>
                    )}

                    {acceptedWorker && (
                        <div className="v" style={sx([styles.stateButton, styles.stateButtonAccepted])}>
                            <Icon name="check-circle" size={16} color="#FFFFFF" />
                            <span className="t" style={sx(styles.btnTextWhite)}>Accepted — awaiting client</span>
                        </div>
                    )}

                    {finalized && (
                        <div className="v" style={sx([styles.stateButton, styles.stateButtonHired])}>
                            <Icon name="briefcase-check" size={16} color="#FFFFFF" />
                            <span className="t" style={sx(styles.btnTextWhite)}>Hired</span>
                        </div>
                    )}

                    {(rejectedWorker || terminated) && (
                        <button className="v btn" type="button"
                            style={sx(styles.deleteBtn)}
                            onClick={press(() => handleDeleteJob(hiringId))}
                            
                        >
                            <Icon name="trash-can-outline" size={16} color="#DC2626" />
                            <span className="t" style={sx(styles.btnTextRed)}>Delete</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            <div className="v" style={sx(styles.blueCircle)} />

            <div className="v" style={sx(styles.header)}>
                <div className="v" style={sx(styles.titleRow)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#555" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Job Confirmation</span>
                </div>
                <div className="v" style={sx(styles.searchBar)}>
                    <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
                    <input className="input"
                        placeholder="Search by client name"
                        
                        style={{ ...sx(styles.searchInput), '--ph': "#999" }}
                        value={(searchQuery) ?? ''}
                        onChange={changeText(setSearchQuery)}
                    />
                </div>
            </div>

            {loading ? (
                <Spinner size="large" color="#1E64D3" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentClassName="card-grid"
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E64D3"]} />
                    }
                >
                    {filteredJobs.length === 0 ? (
                        <span className="t" style={sx(styles.emptyText)}>No job confirmations available.</span>
                    ) : (
                        filteredJobs.map((item, index) => renderJobCard(item, index))
                    )}
                </ScrollView>
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFF' },
    blueCircle: {
        position: 'absolute', top: -50, left: -50,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#E3F2FD', zIndex: -1,
    },
    header: { padding: 20, paddingBottom: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF', borderRadius: 25,
        borderWidth: 1, borderColor: '#E2E8F0',
        paddingHorizontal: 15, height: 46, elevation: 2,
        shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A', paddingVertical: 0 },
    searchIcon: { marginRight: 10 },

    scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },

    /* ── Job offer card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 3,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    cardAccent: { height: 4, width: '100%' },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 9,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusPillText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },

    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    imageContainer: { position: 'relative' },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAF2FF' },
    avatarFallback: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#EAF2FF',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#DBEAFE',
    },
    verifiedIcon: {
        position: 'absolute', bottom: -2, right: -2,
        backgroundColor: '#FFF', borderRadius: 10, padding: 2,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    nameCol: { flex: 1, marginLeft: 12, marginRight: 8 },
    clientName: { fontSize: 16.5, fontWeight: '800', color: '#0F172A' },
    clientCaption: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    ratingBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF7E6', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 10, borderWidth: 1, borderColor: '#FDE3A7', flexShrink: 0,
    },
    ratingBadgeMuted: { backgroundColor: '#F4F6FA', borderColor: '#E2E8F0' },
    ratingText: { marginLeft: 3, fontSize: 12, fontWeight: '800', color: '#B45309' },
    ratingTextMuted: { color: '#8494AB' },

    chipRow: {
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
        gap: 8, paddingHorizontal: 16, paddingTop: 12,
    },
    stateChip: {
        backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    },
    stateChipText: { fontSize: 10.5, fontWeight: '800', color: '#475569' },

    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14 },

    detailsSection: { paddingHorizontal: 16, paddingTop: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    detailIconBox: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 10,
    },
    detailLabel: { width: 105, fontSize: 12.5, color: '#8494AB', fontWeight: '600' },
    detailValue: { flex: 1, fontSize: 13.5, color: '#1E293B', fontWeight: '700' },

    messageBox: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E8EDF5',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 2,
    },
    messageText: { flex: 1, fontSize: 12.5, color: '#475569', lineHeight: 18, marginLeft: 8 },

    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 16,
    },
    rejectBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
        alignItems: 'center', justifyContent: 'center',
    },
    acceptBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#1E64D3',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        elevation: 1,
    },
    deleteBtn: {
        flex: 1, height: 44, borderRadius: 12,
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    stateButton: {
        flex: 1, height: 44, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    stateButtonAccepted: { backgroundColor: '#16A34A' },
    stateButtonHired: { backgroundColor: '#0F766E' },

    btnTextWhite: { color: '#FFF', fontWeight: '800', fontSize: 13.5, marginLeft: 6 },
    btnTextGrey: { color: '#64748B', fontWeight: '800', fontSize: 13.5 },
    btnTextRed: { color: '#DC2626', fontWeight: '800', fontSize: 13.5, marginLeft: 6 },

    emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#94A3B8' },
});

export default JobConfirmationScreen;