import React, { useState, useEffect, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import { RefreshControl, ScrollView, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';
import __img_logo_png from '../../images/logo.png';


// Master habits live in dbo.Habits and are served by api/Habits — the worker only
// ticks checkboxes here, so the wording matches the client-side filter exactly.
const API_HABITS = `${SERVER_BASE}/api/Habits`;

const MyHabitsScreen = ({ navigation }) => {
    const [catalog, setCatalog] = useState([]);        // all active habits
    const [selectedIds, setSelectedIds] = useState([]); // what this worker ticked
    const [savedIds, setSavedIds] = useState([]);       // what is in the DB right now
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const workerId = await AsyncStorage.getItem('workerId');

            if (!workerId) {
                NotificationHelper.showError('Session not found. Please login again.');
                navigation.goBack();
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const [catalogRes, mineRes] = await Promise.all([
                fetch(`${API_HABITS}/GetHabits`, { headers }),
                fetch(`${API_HABITS}/GetWorkerHabits/${workerId}`, { headers }),
            ]);

            if (catalogRes.ok) {
                const list = await catalogRes.json();
                setCatalog(Array.isArray(list) ? list : []);
            } else {
                NotificationHelper.showError('Could not load the habit list.');
            }

            if (mineRes.ok) {
                const mine = await mineRes.json();
                setSelectedIds(Array.isArray(mine.habitIds) ? mine.habitIds : []);
                setSavedIds(Array.isArray(mine.habitIds) ? mine.habitIds : []);
            }
        } catch (error) {
            console.error('My habits load failed:', error?.message);
            NotificationHelper.showError('Network error while loading habits.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [navigation]);

    useEffect(() => {
        fetchAll();
        // Refetch on focus so the list is fresh if the profile was edited elsewhere.
        const unsubscribe = navigation.addListener('focus', fetchAll);
        return unsubscribe;
    }, [navigation, fetchAll]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAll();
    };

    const toggleHabit = (habitId) => {
        setSelectedIds((prev) =>
            prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
        );
    };

    const hasChanges =
        selectedIds.length !== savedIds.length ||
        selectedIds.some((id) => !savedIds.includes(id));

    const handleSave = async () => {
        if (selectedIds.length === 0) {
            NotificationHelper.showError('Please keep at least one habit ticked.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            const workerId = await AsyncStorage.getItem('workerId');

            setIsSaving(true);
            const response = await fetch(`${API_HABITS}/UpdateWorkerHabits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ workerId: Number(workerId), habitIds: selectedIds }),
            });

            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                const saved = Array.isArray(result.habitIds) ? result.habitIds : selectedIds;
                setSelectedIds(saved);
                setSavedIds(saved);
                NotificationHelper.showSuccess(result.message || 'Habits updated.');
                navigation.goBack();
            } else {
                NotificationHelper.showError(result.message || 'Could not save your habits.');
            }
        } catch (error) {
            console.error('Save habits failed:', error?.message);
            NotificationHelper.showError('Network error while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderHeader = () => (
        <div className="v" style={sx(styles.headerBar)}>
            <div className="v" style={sx(styles.headerLeft)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                    <Icon name="arrow-left" size={24} color="#1F2937" />
                </button>
                <span className="t" style={sx(styles.headerTitle)}>My Habits</span>
            </div>
            <div className="v" style={sx(styles.logoBox)}>
                <img className="img" alt="" src={imgSrc(__img_logo_png)} style={sx(styles.logoImage)} />
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="v screen" style={sx(styles.container)}>
                
                {renderHeader()}
                <div className="v" style={sx(styles.centerContainer)}>
                    <Spinner size="large" color="#1E64D3" />
                </div>
            </div>
        );
    }

    return (
        <div className="v screen" style={sx(styles.container)}>
            
            {renderHeader()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#1E64D3']} />
                }
            >
                <div className="v" style={sx(styles.introCard)}>
                    <Icon name="information-outline" size={16} color="#1E64D3" />
                    <span className="t" style={sx(styles.introText)}>
                        These show on your profile under the Habits tab, and clients can filter
                        workers by them. Tick everything that applies to you.
                    </span>
                </div>

                <div className="v" style={sx(styles.countRow)}>
                    <span className="t" style={sx(styles.countText)}>
                        {selectedIds.length} of {catalog.length} selected
                    </span>
                    {hasChanges ? (
                        <div className="v" style={sx(styles.unsavedChip)}>
                            <span className="t" style={sx(styles.unsavedChipText)}>Unsaved changes</span>
                        </div>
                    ) : null}
                </div>

                {catalog.length === 0 ? (
                    <div className="v" style={sx(styles.emptyCard)}>
                        <Icon name="clipboard-text-outline" size={38} color="#CBD5E1" />
                        <span className="t" style={sx(styles.emptyText)}>No habits available right now.</span>
                    </div>
                ) : (
                    <div className="v" style={sx(styles.listCard)}>
                        {catalog.map((habit, index) => {
                            const habitId = habit.habitId ?? habit.id;
                            const isChecked = selectedIds.includes(habitId);
                            return (
                                <button className="v btn" type="button"
                                    key={habitId}
                                    style={sx([styles.habitRow, index === catalog.length - 1 && styles.habitRowLast])}
                                    onClick={press(() => toggleHabit(habitId))}
                                    
                                >
                                    <Icon
                                        name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                        size={24}
                                        color={isChecked ? '#1E64D3' : '#C4CEDE'}
                                    />
                                    <span className="t" style={sx([styles.habitText, isChecked && styles.habitTextActive])}>
                                        {habit.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </ScrollView>

            <div className="v" style={sx(styles.footer)}>
                <button className="v btn" type="button"
                    style={sx([styles.saveBtn, (isSaving || !hasChanges) && styles.saveBtnIdle])}
                    onClick={press(handleSave)}
                    
                    disabled={isSaving || !hasChanges}
                >
                    {isSaving ? (
                        <Spinner color="#FFF" />
                    ) : (
                        <span className="t" style={sx(styles.saveBtnText)}>
                            {hasChanges ? 'Save Habits' : 'No Changes'}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F6FC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    logoBox: { width: 56, height: 42, alignItems: 'flex-end', justifyContent: 'center' },
    logoImage: { width: 46, height: 34, resizeMode: 'contain' },

    scrollContent: { padding: 16, paddingBottom: 24 },
    introCard: {
        flexDirection: 'row',
        backgroundColor: '#EEF4FF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#D8E6FF',
    },
    introText: { flex: 1, fontSize: 12.5, color: '#334155', lineHeight: 18, marginLeft: 8 },

    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 8,
    },
    countText: { fontSize: 13, fontWeight: '700', color: '#475569' },
    unsavedChip: {
        backgroundColor: '#FFF7E6',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    unsavedChipText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        overflow: 'hidden',
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    habitRowLast: { borderBottomWidth: 0 },
    habitText: { flex: 1, fontSize: 14.5, color: '#64748B', marginLeft: 12 },
    habitTextActive: { color: '#111827', fontWeight: '700' },

    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6EAF2',
        padding: 30,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: '#94A3B8', marginTop: 8 },

    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEF1F6',
    },
    saveBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#16A34A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnIdle: { backgroundColor: '#C7D3E3' },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default MyHabitsScreen;
