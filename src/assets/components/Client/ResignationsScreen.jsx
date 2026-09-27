import React, { useState, useEffect, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD } from '../../config';
import { ListView, RefreshControl, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


const ResignationsScreen = ({ navigation }) => {
    const [resignations, setResignations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchResignations = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetClientResignations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setResignations(data);
            } else {
                console.error("Failed to fetch resignations");
            }
        } catch (error) {
            console.error("Error fetching resignations:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // First load, then refetch on every focus so a resignation the client just
        // confirmed shows as Completed the moment they come back to this list.
        fetchResignations();
        const unsubscribe = navigation.addListener('focus', fetchResignations);
        return unsubscribe;
    }, [navigation, fetchResignations]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchResignations();
    };

    const renderResignationBox = ({ item }) => (
        <div className="v" style={sx(styles.card)}>
            {/* Card Header */}
            <div className="v" style={sx(styles.cardHeader)}>
                <div className="v" style={sx(styles.workerInfo)}>
                    <span className="t" style={sx(styles.workerName)}>{item.workerName}</span>
                    <span className="t" style={sx(styles.workerRole)}>{item.workerRole}</span>
                </div>
                <div className="v" style={sx(styles.dateBadge)}>
                    <span className="t" style={sx(styles.dateText)}>{item.submittedDate}</span>
                </div>
            </div>

            {/* Reason */}
            <div className="v" style={sx(styles.cardContent)}>
                <span className="t" style={sx(styles.label)}>Reason for Leaving:</span>
                <span className="t" style={sx(styles.reasonText, 2)} >
                    {item.reason}
                </span>

                <div className="v"
                    style={sx([
                        styles.statusBadge,
                        item.isConfirmed ? styles.statusBadgeDone : styles.statusBadgePending
                    ])}
                >
                    <Icon
                        name={item.isConfirmed ? 'check-circle' : 'alert-circle-outline'}
                        size={13}
                        color={item.isConfirmed ? '#15803D' : '#B45309'}
                    />
                    <span className="t"
                        style={sx([
                            styles.statusBadgeText,
                            item.isConfirmed ? styles.statusTextDone : styles.statusTextPending
                        ])}
                    >
                        {item.isConfirmed ? 'Completed' : 'Needs your review'}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="v" style={sx(styles.cardFooter)}>
                <div className="v" style={sx(styles.lastDayRow)}>
                    <Icon name="calendar-clock" size={16} color="#E91E63" />
                    <span className="t" style={sx(styles.lastDate)}>Last Day: {item.lastWorkingDate}</span>
                </div>
                <button className="v btn" type="button"
                    style={sx(styles.detailBtn)}
                    onClick={press(() => navigation.navigate('ResignationScreen', { resignationId: item.resignationId }))}
                >
                    <span className="t" style={sx(styles.detailBtnText)}>
                        {item.isConfirmed ? 'View Detail' : 'Review & Confirm'}
                    </span>
                    <Icon name="chevron-right" size={18} color="#FFF" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header — matches ActiveRequestScreen & WorkerDecisionScreen style */}
            <div className="v" style={sx(styles.headerBar)}>
                <div className="v" style={sx(styles.headerLeft)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#1F2937" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Worker Resignations</span>
                </div>
                <div className="v" style={sx(styles.logoBox)}>
                    <img className="img" alt=""
                        src={imgSrc(__img_logo_png)}
                        style={sx(styles.logoImage)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="v" style={sx(styles.centerContainer)}>
                    <Spinner size="large" color="#1E64D3" />
                </div>
            ) : (
                <ListView
                    data={resignations}
                    renderItem={renderResignationBox}
                    keyExtractor={item => item.resignationId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#1E64D3"]} />
                    }
                    ListEmptyComponent={
                        <div className="v" style={sx(styles.emptyContainer)}>
                            <Icon name="file-document-outline" size={60} color="#9CA3AF" />
                            <span className="t" style={sx(styles.emptyText)}>No resignation notices received yet.</span>
                        </div>
                    }
                />
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* ── Header (same as ActiveRequestScreen & WorkerDecisionScreen) ── */
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

    /* ── List ── */
    listContent: {
        padding: 16,
        paddingBottom: 28,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
        marginBottom: 12,
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E64D3',
        marginBottom: 2,
    },
    workerRole: {
        fontSize: 13,
        color: '#6B7280',
    },
    dateBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    dateText: {
        fontSize: 11,
        color: '#1E64D3',
        fontWeight: '700',
    },

    /* ── Content ── */
    cardContent: {
        marginBottom: 14,
    },
    label: {
        fontSize: 11,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
        fontWeight: '600',
    },
    reasonText: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 10,
    },
    statusBadgePending: { backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#FCD9A4' },
    statusBadgeDone: { backgroundColor: '#ECFDF3', borderWidth: 1, borderColor: '#BBF7D0' },
    statusBadgeText: { fontSize: 11, fontWeight: '700', marginLeft: 5 },
    statusTextPending: { color: '#B45309' },
    statusTextDone: { color: '#15803D' },

    /* ── Footer ── */
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    lastDayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastDate: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '700',
        marginLeft: 6,
    },
    detailBtn: {
        backgroundColor: '#1E64D3',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#1E64D3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    detailBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        marginRight: 4,
    },

    /* ── Empty ── */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 15,
        marginTop: 15,
        textAlign: 'center',
    },
});

export default ResignationsScreen;
