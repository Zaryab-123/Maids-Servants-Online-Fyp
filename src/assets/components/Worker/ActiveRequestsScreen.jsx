import React, { useState, useEffect, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import ResidenceBadge from '../helpers/ResidenceBadge';
import { RefreshControl, ScrollView, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


const ActiveRequestsScreen = ({ navigation }) => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const API_BASE = API_DASHBOARD;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(Array.isArray(data) ? data : []);
            } else {
                NotificationHelper.showError("Failed to load requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchRequests(false);
    }, []);

    const handleStatusUpdate = async (id, decision) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workerDecision: decision })
            });

            if (response.ok) {
                NotificationHelper.showSuccess(`Request ${decision}!`);
                setRequests(prev => prev.filter(r => r.id !== id));
            } else {
                NotificationHelper.showError("Failed to update status.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        }
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header bar matching standard app header */}
            <div className="v" style={sx(styles.headerBar)}>
                <div className="v" style={sx(styles.headerLeft)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Active Requests</span>
                </div>
                <div className="v" style={sx(styles.logoBox)}>
                    <img className="img" alt=""
                        src={imgSrc(__img_logo_png)}
                        style={sx(styles.logoImage)}
                    />
                </div>
            </div>

            <ScrollView contentClassName="card-grid"
                
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E64D3"]} />
                }
            >
                <div className="v" style={sx(styles.sectionHeadingRow)}>
                    <span className="t" style={sx(styles.sectionHeading)}>New Booking Requests ({requests.length})</span>
                    <button className="v btn" type="button" onClick={press(() => navigation.navigate('AcceptedRequestScreen'))}>
                        <span className="t" style={sx(styles.gotoLink)}>Goto Accepted</span>
                    </button>
                </div>

                {isLoading ? (
                    <Spinner size="large" color="#1E64D3" style={{ marginTop: 20 }} />
                ) : requests.length === 0 ? (
                    <span className="t" style={sx({ textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' })}>No pending requests.</span>
                ) : (
                    requests.map((item, index) => {
                        const uniqueKey = item.id ? item.id.toString() : index.toString();
                        const ratingValue = Number(item.clientRating) || 0;
                        const hasRating = ratingValue > 0;
                        const avatarUri = item.clientPicture
                            ? (item.clientPicture.startsWith('http') ? item.clientPicture : `${SERVER_BASE}${item.clientPicture}`)
                            : null;
                        return (
                            <div className="v grid-item" key={uniqueKey} style={sx(styles.requestCard)}>

                                {/* Row 1: what the request is + when it came in */}
                                <div className="v" style={sx(styles.cardTopRow)}>
                                    <div className="v" style={sx(styles.serviceTag)}>
                                        <span className="t" style={sx(styles.serviceText)}>{item.service || 'General Service'}</span>
                                    </div>
                                    <div className="v" style={sx(styles.timeRow)}>
                                        <div className="v" style={sx(styles.activeDot)} />
                                        <span className="t" style={sx(styles.timeText)}>{item.time || 'Just now'}</span>
                                    </div>
                                </div>

                                {/* Row 2: who is asking + their rating */}
                                <div className="v" style={sx(styles.clientRow)}>
                                    <div className="v" style={sx(styles.avatarWrap)}>
                                        {avatarUri ? (
                                            <img className="img" alt="" src={imgSrc({ uri: avatarUri })} style={sx(styles.avatar)} />
                                        ) : (
                                            <Icon name="account" size={26} color="#94A3B8" />
                                        )}
                                    </div>

                                    <div className="v" style={sx(styles.clientInfo)}>
                                        <button className="v btn" type="button"
                                            onClick={press(() => {
                                                if (item.clientId) {
                                                    navigation.navigate('ClientProfileScreen', {
                                                        clientId: item.clientId,
                                                        id: item.clientId
                                                    });
                                                }
                                            })}
                                            disabled={!item.clientId}
                                        >
                                            <span className="t" style={sx(styles.clientName, 1)} >
                                                {item.client || 'Customer'}
                                            </span>
                                        </button>
                                        <span className="t" style={sx(styles.clientCaption, 1)} >
                                            Wants to interview you
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

                                {/* Row 3: booking chips — wraps, so nothing can overlap */}
                                <div className="v" style={sx(styles.chipRow)}>
                                    <JobTypeBadge jobType={item.jobType} small />
                                    <ResidenceBadge isResidenceProvided={item.isResidenceProvided} small />
                                    <SlotTimeLabel
                                        startTime={item.slotStartTime}
                                        endTime={item.slotEndTime}
                                        small
                                    />
                                </div>

                                <div className="v" style={sx(styles.divider)} />

                                {/* Row 4: contact details */}
                                <div className="v" style={sx(styles.detailRow)}>
                                    <Icon name="map-marker-outline" size={16} color="#E91E63" />
                                    <span className="t" style={sx(styles.detailText, 2)} >
                                        {item.location || 'Location not provided'}
                                    </span>
                                </div>

                                {item.clientPhone ? (
                                    <div className="v" style={sx(styles.detailRow)}>
                                        <Icon name="phone-outline" size={16} color="#16A34A" />
                                        <span className="t" style={sx(styles.detailText)}>{item.clientPhone}</span>
                                    </div>
                                ) : null}

                                {/* Row 5: actions */}
                                <div className="v" style={sx(styles.actionRow)}>
                                    <button className="v btn" type="button"
                                        style={sx(styles.rejectBtn)}
                                        onClick={press(() => handleStatusUpdate(item.id, 'Rejected'))}
                                        
                                    >
                                        <span className="t" style={sx(styles.rejectText)}>Reject</span>
                                    </button>
                                    <button className="v btn" type="button"
                                        style={sx(styles.acceptBtn)}
                                        onClick={press(() => handleStatusUpdate(item.id, 'Accepted'))}
                                        
                                    >
                                        <Icon name="check" size={16} color="#FFF" />
                                        <span className="t" style={sx(styles.acceptText)}>Accept Booking</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </ScrollView>
        </div>
    );
};

const styles = StyleSheet.create({
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
        fontSize: 20,
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

    scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
    sectionHeadingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    sectionHeading: { fontSize: 17, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
    gotoLink: { color: '#1E64D3', fontWeight: 'bold', fontSize: 14 },

    /* ── Request card ── */
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 3,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    serviceTag: {
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        flexShrink: 0,
    },
    serviceText: { color: '#1E64D3', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },
    timeRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginLeft: 10 },
    activeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', marginRight: 6 },
    timeText: { fontSize: 11.5, color: '#6B7280', fontWeight: '600' },

    clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarWrap: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#EAF2FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatar: { width: 46, height: 46, borderRadius: 23 },
    clientInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
    clientName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    clientCaption: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7E6',
        borderWidth: 1,
        borderColor: '#FDE3A7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        flexShrink: 0,
    },
    ratingBadgeMuted: { backgroundColor: '#F4F6FA', borderColor: '#E2E8F0' },
    ratingText: { marginLeft: 3, fontSize: 12, fontWeight: '800', color: '#B45309' },
    ratingTextMuted: { color: '#8494AB' },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },

    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14, marginBottom: 12 },

    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    detailText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 18, marginLeft: 8 },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
    rejectBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectText: { color: '#64748B', fontWeight: '700', fontSize: 13.5 },
    acceptBtn: {
        flex: 1.45,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#16A34A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
    },
    acceptText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5, marginLeft: 6 }
});

export default ActiveRequestsScreen;