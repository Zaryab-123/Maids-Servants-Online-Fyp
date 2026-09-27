import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import ResidenceBadge from '../helpers/ResidenceBadge';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


const API_BASE = API_DASHBOARD;

const AcceptedRequestScreen = ({ navigation }) => {
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAcceptedRequests();
    }, []);

    const fetchAcceptedRequests = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetAcceptedWorkerRequests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAcceptedRequests(data);
            } else {
                NotificationHelper.showError("Failed to load accepted requests.");
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/UpdateWorkerDecision/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ decision: 'Rejected' })
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Request Rejected successfully.");
                setAcceptedRequests(prev => prev.filter(r => r.id !== id));
            } else {
                NotificationHelper.showError("Failed to reject request.");
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
                    <span className="t" style={sx(styles.headerTitle)}>Accepted Requests</span>
                </div>
                <div className="v" style={sx(styles.logoBox)}>
                    <img className="img" alt=""
                        src={imgSrc(__img_logo_png)}
                        style={sx(styles.logoImage)}
                    />
                </div>
            </div>

            <div className="v scroll"  ><div className="v scroll-content card-grid" style={sx(styles.scrollContent)}>
                <span className="t" style={sx(styles.sectionHeading)}>
                    New Accepted Requests ({acceptedRequests.length})
                </span>

                {isLoading ? (
                    <Spinner size="large" color="#1E64D3" style={{ marginTop: 40 }} />
                ) : acceptedRequests.length === 0 ? (
                    <span className="t" style={sx({ textAlign: 'center', marginTop: 40, fontStyle: 'italic', color: '#999' })}>No accepted requests found.</span>
                ) : (
                    acceptedRequests.map((item) => {
                        const ratingValue = Number(item.clientRating) || 0;
                        const hasRating = ratingValue > 0;
                        const avatarUri = item.clientPicture
                            ? (item.clientPicture.startsWith('http') ? item.clientPicture : `${SERVER_BASE}${item.clientPicture}`)
                            : null;
                        return (
                        <div className="v grid-item" key={item.id} style={sx(styles.card)}>
                            <div className="v" style={sx(styles.cardTopRow)}>
                                <div className="v" style={sx(styles.serviceBadge)}>
                                    <span className="t" style={sx(styles.serviceText)}>{item.service || 'Interview Request'}</span>
                                </div>
                                <div className="v" style={sx(styles.statusContainer)}>
                                    <div className="v" style={sx(styles.greenDot)} />
                                    <span className="t" style={sx(styles.statusText)}>Accepted</span>
                                </div>
                            </div>

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
                                        {item.time || 'Just now'}
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

                            <button className="v btn" type="button"
                                style={sx(styles.rejectBtn)}
                                onClick={press(() => handleReject(item.id))}
                                
                            >
                                <span className="t" style={sx(styles.rejectBtnText)}>Reject</span>
                            </button>
                        </div>
                        );
                    })
                )}
            </div></div>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    card: {
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
    serviceBadge: {
        backgroundColor: '#EAF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    serviceText: { color: '#1E64D3', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E', marginRight: 6 },
    statusText: { color: '#16A34A', fontSize: 11.5, fontWeight: '800' },

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

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    divider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 14, marginBottom: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    detailText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 18, marginLeft: 8 },

    rejectBtn: {
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    rejectBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 13.5 }
});

export default AcceptedRequestScreen;
