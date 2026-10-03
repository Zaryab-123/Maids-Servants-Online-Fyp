
import React, { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@/web/navigation';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import DateTimePicker from '@/web/DateTimePicker';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import { Alert, Dialog, Dimensions, ScrollView, Spinner, StyleSheet, Toggle, imgSrc, press, sx } from '@/web';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WorkerDashboardScreen = ({ navigation }) => {
    const [isDutyOn, setIsDutyOn] = useState(true);
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Profile sections. Skills appears before availability/time slots.
    const tabs = ['Overview', 'Skills', 'Time Slots', 'Experience', 'Reviews'];
    const [activeTab, setActiveTab] = useState('Overview');
    const tabScrollViewRef = useRef(null);

    const [selectedRadius, setSelectedRadius] = useState('5 km');

    // Time Slots State
    const [timeSlots, setTimeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
    const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(12, 0, 0, 0)));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submittingSlot, setSubmittingSlot] = useState(false);

    // Reviews State
    const [reviewsList, setReviewsList] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewsAverage, setReviewsAverage] = useState(null); // from GetWorkerReviews
    const [reviewsCount, setReviewsCount] = useState(null);     // from GetWorkerReviews
    const [reviewsError, setReviewsError] = useState(false);    // request failed (vs. genuinely empty)

    useFocusEffect(
        useCallback(() => {
            fetchWorkerDetails();
        }, [])
    );

    const fetchWorkerDetails = async () => {
        setIsLoading(true);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            if (!workerId || !token) {
                NotificationHelper.showError("Session not found. Please login again.");
                navigation.replace('Login');
                return;
            }

            const url = `${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
                setIsDutyOn(data.availableStatus ?? true);
                if (data.radius) setSelectedRadius(`${data.radius} km`);
                fetchTimeSlots(workerId);
                fetchWorkerReviews(workerId);
            } else if (response.status === 401) {
                NotificationHelper.showError("Session expired. Please login again.");
                navigation.replace('Login');
            } else {
                let errorMessage = "Could not fetch dashboard data.";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    if (text) errorMessage = text.substring(0, 100);
                }
                NotificationHelper.showError(`Error ${response.status}: ${errorMessage}`);
            }
        } catch (error) {
            NotificationHelper.showError("Network error. Verify connection and API IP.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Tab Bar Click
    const handleTabPress = (tab, index) => {
        setActiveTab(tab);
        tabScrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    // Handle Finger Swipe Left/Right
    const handleScrollEnd = (e) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
        if (pageIndex >= 0 && pageIndex < tabs.length) {
            setActiveTab(tabs[pageIndex]);
        }
    };

    // --- REVIEWS API HANDLER ---
    const fetchWorkerReviews = async (id) => {
        if (!id) return;
        setLoadingReviews(true);
        setReviewsError(false);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_DASHBOARD}/GetWorkerReviews/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                NotificationHelper.showError("Session expired. Please login again.");
                navigation.replace('Login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data) ? data : (data?.reviews || []);
                setReviewsList(list);
                if (data?.averageRating != null) setReviewsAverage(String(data.averageRating));
                if (data?.reviewCount != null) setReviewsCount(data.reviewCount);
            } else {
                setReviewsList([]);
                setReviewsError(true);
                console.error(`GetWorkerReviews failed [${response.status}]`);
            }
        } catch (error) {
            setReviewsList([]);
            setReviewsError(true);
            console.error('Fetch reviews error:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    // --- TIME SLOTS API HANDLERS ---
    const fetchTimeSlots = async (id) => {
        setLoadingSlots(true);
        try {
            const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/GetWorkerTimeSlots/${id}`);
            if (response.ok) {
                const data = await response.json();
                setTimeSlots(data);
            }
        } catch (error) {
            console.error('Fetch slots error:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleAddTimeSlot = async () => {
        if (!startTime || !endTime) {
            Alert.alert('Validation Error', 'Please enter start and end times (e.g., 09:00:00).');
            return;
        }

        setSubmittingSlot(true);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            
            const formatTime = (dateObj) => {
                const h = dateObj.getHours().toString().padStart(2, '0');
                const m = dateObj.getMinutes().toString().padStart(2, '0');
                const s = dateObj.getSeconds().toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };

            const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/AddTimeSlot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: parseInt(workerId),
                    startTime: formatTime(startTime),
                    endTime: formatTime(endTime),
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Time slot added successfully!');
                setIsSlotModalVisible(false);
                fetchTimeSlots(workerId);
            } else {
                let errorObj;
                try {
                    errorObj = await response.json();
                } catch(e) {
                    errorObj = { message: await response.text() || 'Failed to add time slot.' };
                }
                Alert.alert('Error', errorObj.message || 'Failed to add time slot.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong while saving the time slot.');
        } finally {
            setSubmittingSlot(false);
        }
    };

    const handleDeleteSlot = (slotId) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this time slot?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await fetch(`${SERVER_BASE}/api/WorkerSlots/DeleteTimeSlot/${slotId}`, {
                            method: 'DELETE',
                        });
                        if (response.ok) {
                            setTimeSlots((prev) => prev.filter((item) => item.id !== slotId));
                        }
                    } catch (error) {
                        console.error('Delete slot error:', error);
                    }
                },
            },
        ]);
    };

    // --- RADIUS CHANGE HANDLER ---
    const handleRadiusChange = async (rad) => {
        setSelectedRadius(rad); // optimistic UI update
        const radiusVal = parseInt(rad.split(' ')[0]);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateWorkerRadius/${workerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(radiusVal)
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Radius update failed:', err.message);
                NotificationHelper.showError('Failed to update radius: ' + (err.message || ''));
            }
        } catch (error) {
            console.error('Radius update error:', error);
        }
    };

    // Increase / Decrease Radius Handlers
    const currentRadiusValue = parseInt(selectedRadius) || 1;

    const handleIncreaseRadius = () => {
        if (currentRadiusValue < 70) {
            handleRadiusChange(`${currentRadiusValue + 1} km`);
        }
    };

    const handleDecreaseRadius = () => {
        if (currentRadiusValue > 1) {
            handleRadiusChange(`${currentRadiusValue - 1} km`);
        }
    };

    // --- USER HANDLERS ---
    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    const handleEditProfile = () => {
        navigation.navigate('Signup', { isEdit: true, initialData: worker });
    };

    const handleOpenMapLocation = () => {
        navigation.navigate('MapScreen', {
            userRole: 'Worker',
            workerId: worker?.id || worker?.workerId,
            latitude: worker?.latitude,
            longitude: worker?.longitude,
            requireLocationSave: false,
        });
    };

    const handleDutyToggle = async (value) => {
        setIsDutyOn(value);
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/UpdateDutyStatus/${workerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(value)
            });

            if (!response.ok) {
                setIsDutyOn(!value);
                NotificationHelper.showError("Failed to update duty status.");
            }
        } catch (error) {
            setIsDutyOn(!value);
            NotificationHelper.showError("Network error.");
        }
    };

    if (isLoading) {
        return (
            <div className="v" style={sx(styles.centerLoading)}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    if (!worker) return null;

    const imagePath = worker.picture || worker.Picture || worker.imageUrl;

    const profileImageUri = imagePath
        ? imagePath.startsWith('http')
            ? imagePath
            : `${SERVER_BASE}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
        : null;

    return (
        <div className="v screen" style={sx(styles.container)}>
            {/* Non-scrollable Header Info */}
            <div className="v" style={sx(styles.fixedHeaderPadding)}>
                {/* 1. Header with Profile Picture */}
                <div className="v" style={sx(styles.topHeader)}>
                    <div className="v" style={sx(styles.profileSection)}>
                        {profileImageUri ? (
                            <img className="img" alt="" src={imgSrc({ uri: profileImageUri })} style={sx(styles.profileAvatar)} />
                        ) : (
                            <div className="v" style={sx(styles.profileAvatarPlaceholder)}>
                                <Icon name="account" size={32} color="#1E64D3" />
                            </div>
                        )}

                        <div className="v" style={sx({ flex: 1 })}>
                            <span className="t" style={sx(styles.greetingText)}>GOOD AFTERNOON,</span>
                            <span className="t" style={sx(styles.headerName)}>{worker.name || 'Mesam Abbas'}</span>
                            <div className="v" style={sx(styles.roleAgeRow)}>
                                <span className="t" style={sx(styles.roleText)}>{worker.role || 'Cleaning'}</span>
                                <span className="t" style={sx(styles.ageText)}>  •  {worker.age || 45} Years Old</span>
                            </div>
                        </div>
                    </div>

                    <div className="v" style={sx(styles.headerRightActions)}>
                        <button className="v btn" type="button" style={sx(styles.pillEditBtn)} onClick={press(handleEditProfile)}>
                            <Icon name="square-edit-outline" size={16} color="#555" />
                            <span className="t" style={sx(styles.pillEditBtnText)}>Edit</span>
                        </button>
                        <button className="v btn" type="button" style={sx(styles.logoutIconBtn)} onClick={press(handleLogout)}>
                            <Icon name="logout" size={18} color="#D32F2F" />
                        </button>
                    </div>
                </div>

                {/* Quick Info Bar */}
                <div className="v" style={sx(styles.infoCard)}>
                    <div className="v" style={sx(styles.infoCol)}>
                        <span className="t" style={sx(styles.infoLabel)}>RATING</span>
                        <span className="t" style={sx(styles.infoValue)}>★ {worker.rating || "0.0"}</span>
                        <span className="t" style={sx(styles.infoSub)}>({worker.reviewCount || 0})</span>
                    </div>
                    <div className="v" style={sx(styles.verticalDivider)} />
                    <div className="v" style={sx([styles.infoCol, { flex: 2 }])}>
                        <span className="t" style={sx(styles.infoLabel)}>LOCATION</span>
                        <span className="t" style={sx(styles.infoValueLocation, 2)} >
                            {worker.location || "RAWALPINDI"}
                        </span>
                    </div>
                    <div className="v" style={sx(styles.verticalDivider)} />
                    <div className="v" style={sx(styles.infoCol)}>
                        <span className="t" style={sx(styles.infoLabel)}>SALARY</span>
                        <span className="t" style={sx(styles.infoValue)}>Rs.{worker.salary || "0"}</span>
                    </div>
                </div>

                {/* Underline Tabs Header */}
                <div className="v" style={sx(styles.underlineTabContainer)}>
                    {tabs.map((tab, idx) => {
                        const isActive = activeTab === tab;
                        return (
                            <button className="v btn" type="button"
                                key={tab}
                                style={sx([styles.underlineTabBtn, isActive && styles.underlineTabBtnActive])}
                                onClick={press(() => handleTabPress(tab, idx))}
                            >
                                <span className="t" style={sx([styles.underlineTabText, isActive && styles.underlineTabTextActive])}>
                                    {tab}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Swipeable Tab Container */}
            <ScrollView
                ref={tabScrollViewRef}
                horizontal
                pagingEnabled
                
                onMomentumScrollEnd={handleScrollEnd}
                style={{ flex: 1 }}
            >
                {/* 1. OVERVIEW TAB */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })} ><div className="v scroll-content" style={sx(styles.tabContentPadding)}>
                    {/* Course Management — intentionally first so it is immediately visible */}
                    <div className="v" style={sx({ flexDirection: 'row', gap: 10, marginBottom: 14 })}>
                        <button className="v btn" type="button"
                            style={sx({ flex: 1, backgroundColor: '#1565C0', borderRadius: 16, padding: 15 })}
                            onClick={press(() => navigation.navigate('WorkerCourseCatalogueScreen'))}
                        >
                            <Icon name="school-outline" size={26} color="#FFFFFF" />
                            <span className="t" style={sx({ color: '#FFFFFF', fontWeight: '800', marginTop: 10 })}>Browse Courses</span>
                            <span className="t" style={sx({ color: '#DCEBFF', fontSize: 11, marginTop: 3 })}>Enroll in company training</span>
                        </button>
                        <button className="v btn" type="button"
                            style={sx({ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#D9E5F3', borderWidth: 1, borderRadius: 16, padding: 15 })}
                            onClick={press(() => navigation.navigate('WorkerMyCoursesScreen'))}
                        >
                            <Icon name="certificate-outline" size={26} color="#1565C0" />
                            <span className="t" style={sx({ color: '#172033', fontWeight: '800', marginTop: 10 })}>My Learning</span>
                            <span className="t" style={sx({ color: '#64748B', fontSize: 11, marginTop: 3 })}>Courses and certificates</span>
                        </button>
                    </div>

                    {/* Duty Status Card */}
                    <div className="v" style={sx(styles.card)}>
                        <div className="v" style={sx(styles.cardRow)}>
                            <div className="v" style={sx({ flex: 1 })}>
                                <div className="v" style={sx({ flexDirection: 'row', alignItems: 'center' })}>
                                    <span className="t" style={sx(styles.cardTitle)}>Duty Status </span>
                                    <div className="v" style={sx(styles.onlineBadge)}>
                                        <span className="t" style={sx(styles.onlineBadgeText)}>{isDutyOn ? 'Online' : 'Offline'}</span>
                                    </div>
                                </div>
                                <span className="t" style={sx(styles.cardSubtext)}>
                                    {isDutyOn ? "You are currently visible to customers" : "You are currently hidden"}
                                </span>
                            </div>
                            <Toggle
                                value={isDutyOn}
                                onValueChange={handleDutyToggle}
                                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
                                thumbColor="#FFF"
                            />
                        </div>

                        <div className="v" style={sx(styles.divider)} />

                        {/* Work Location */}
                        <div className="v" style={sx(styles.cardRow)}>
                            <div className="v" style={sx(styles.iconCircleBg)}>
                                <Icon name="map-marker-outline" size={20} color="#1E64D3" />
                            </div>
                            <div className="v" style={sx({ flex: 1, marginLeft: 12 })}>
                                <span className="t" style={sx(styles.itemTitle)}>Work Location</span>
                                <span className="t" style={sx(styles.itemSubtext)}>
                                    {worker.latitude && worker.longitude
                                        ? `Pinned (${parseFloat(worker.latitude).toFixed(3)}, ${parseFloat(worker.longitude).toFixed(3)})`
                                        : 'Location not pinned on map'}
                                </span>
                            </div>
                            <button className="v btn" type="button" style={sx(styles.bluePillBtn)} onClick={press(handleOpenMapLocation)}>
                                <Icon name="map-search-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                <span className="t" style={sx(styles.bluePillBtnText)}>Set Location</span>
                            </button>
                        </div>

                        <div className="v" style={sx(styles.divider)} />

                        {/* Work Radius Adjustment Strip */}
                        <div className="v" style={sx(styles.radiusRowHeader)}>
                            <span className="t" style={sx(styles.itemTitle)}>
                                Work Radius <span className="t" style={sx({ color: '#8E8E93', fontWeight: 'normal' })}>(Service Area)</span>
                            </span>
                            <span className="t" style={sx(styles.radiusBadgeText)}>{selectedRadius}</span>
                        </div>

                        <div className="v" style={sx(styles.radiusStripContainer)}>
                            <button className="v btn" type="button"
                                style={sx([styles.radiusAdjustBtn, currentRadiusValue <= 1 && styles.radiusBtnDisabled])}
                                onClick={press(handleDecreaseRadius)}
                                disabled={currentRadiusValue <= 1}
                            >
                                <Icon name="minus" size={18} color={currentRadiusValue <= 1 ? '#C7C7CC' : '#1E64D3'} />
                            </button>

                            <div className="v" style={sx(styles.radiusTrackBackground)}>
                                <div className="v"
                                    style={sx([
                                        styles.radiusTrackFill,
                                        { width: `${(currentRadiusValue / 70) * 100}%` }
                                    ])}
                                />
                            </div>

                            <button className="v btn" type="button"
                                style={sx([styles.radiusAdjustBtn, currentRadiusValue >= 70 && styles.radiusBtnDisabled])}
                                onClick={press(handleIncreaseRadius)}
                                disabled={currentRadiusValue >= 70}
                            >
                                <Icon name="plus" size={18} color={currentRadiusValue >= 70 ? '#C7C7CC' : '#1E64D3'} />
                            </button>
                        </div>
                        <span className="t" style={sx(styles.radiusLimitText)}>Max Limit: 70 km</span>
                    </div>

                    {/* Interview Requests Notification Tab */}
                    <button className="v btn" type="button"
                        style={sx(styles.notifCard)}
                        onClick={press(() => navigation.navigate('ActiveRequestsScreen'))}
                    >
                        <div className="v" style={sx(styles.iconCircleBg)}>
                            <Icon name="email-outline" size={20} color="#333" />
                        </div>
                        <div className="v" style={sx({ flex: 1, marginLeft: 12 })}>
                            <span className="t" style={sx(styles.notifTitle)}>Interview Requests</span>
                            <span className="t" style={sx(styles.notifSub)}>Pending: {worker.pendingRequestCount || 0}</span>
                        </div>
                        <div className="v" style={sx(styles.redBadge)}>
                            <span className="t" style={sx(styles.redBadgeText)}>{worker.pendingRequestCount || 0}</span>
                        </div>
                    </button>

                    {/* Job Notifications Tab */}
                    <button className="v btn" type="button"
                        style={sx(styles.notifCard)}
                        onClick={press(() => navigation.navigate('JobConfirmationScreen'))}
                    >
                        <div className="v" style={sx(styles.iconCircleBg)}>
                            <Icon name="bell-outline" size={20} color="#333" />
                        </div>
                        <div className="v" style={sx({ flex: 1, marginLeft: 12 })}>
                            <span className="t" style={sx(styles.notifTitle)}>Job Notifications</span>
                            <span className="t" style={sx(styles.notifSub)}>Job Confirmations and Rejections</span>
                        </div>
                        <div className="v" style={sx(styles.redBadge)}>
                            <span className="t" style={sx(styles.redBadgeText)}>{worker.jobNotificationCount || 0}</span>
                        </div>
                    </button>

                    {/* Employment Actions & Termination Buttons */}
                    <div className="v" style={sx(styles.actionCard)}>
                        <div className="v" style={sx(styles.sectionHeader)}>
                            <Icon name="account-alert-outline" size={24} color="#FF4D4D" />
                            <span className="t" style={sx(styles.actionSectionTitle)}>Employment Actions</span>
                        </div>
                        <span className="t" style={sx(styles.actionSubtext)}>Manage your job status and termination requests</span>
                        <button className="v btn" type="button"
                            style={sx(styles.terminateBtn)}
                            onClick={press(() => navigation.navigate('LeaveJobScreen'))}
                        >
                            <Icon name="close-circle-outline" size={20} color="#FF4D4D" />
                            <span className="t" style={sx(styles.terminateText)}>Resign from Job</span>
                        </button>
                    </div>

                    <button className="v btn" type="button"
                        style={sx(styles.checkStatusBtn)}
                        onClick={press(() => navigation.navigate('WorkerTerminationScreen'))}
                    >
                        <span className="t" style={sx(styles.btnTextWhite)}>
                            Check Termination Status {worker.terminationCount > 0 ? `(${worker.terminationCount})` : ''}
                        </span>
                    </button>

                    {/* Habits — shown on the worker's own profile to clients */}
                    <button className="v btn" type="button"
                        style={sx(styles.habitsBtn)}
                        onClick={press(() => navigation.navigate('MyHabitsScreen'))}
                        
                    >
                        <Icon name="clipboard-check-outline" size={18} color="#1E64D3" />
                        <span className="t" style={sx(styles.habitsBtnText)}>
                            My Habits{worker.habits?.length ? ` (${worker.habits.length})` : ''}
                        </span>
                        <Icon name="chevron-right" size={18} color="#94A3B8" />
                    </button>
                </div></div>

                {/* 2. SKILLS TAB */}
                <div className="v scroll"
                    style={sx({ width: SCREEN_WIDTH })}
                    
                    
                ><div className="v scroll-content" style={sx(styles.tabContentPadding)}>
                    <div className="v" style={sx(styles.card)}>
                        <div className="v" style={sx(styles.cardRow)}>
                            <div className="v" style={sx([styles.iconCircleBg, { backgroundColor: '#EAF3FF' }])}>
                                <Icon name="certificate-outline" size={21} color="#1565C0" />
                            </div>
                            <div className="v" style={sx({ flex: 1, marginLeft: 12 })}>
                                <span className="t" style={sx(styles.cardTitle)}>Professional Skills</span>
                                <span className="t" style={sx(styles.cardSubtext)}>Your primary and secondary service expertise</span>
                            </div>
                            <button className="v btn" type="button"
                                style={sx(styles.lightBlueBtn)}
                                onClick={press(() => navigation.navigate('Signup', { isEdit: true, initialData: worker }))}
                            >
                                <Icon name="pencil-outline" size={14} color="#1E64D3" />
                                <span className="t" style={sx([styles.lightBlueBtnText, { marginLeft: 4 }])}>Edit</span>
                            </button>
                        </div>

                        <div className="v" style={sx(styles.divider)} />

                        <span className="t" style={sx({ color: '#172033', fontSize: 14, fontWeight: '800', marginBottom: 4 })}>
                            Primary Service
                        </span>
                        <span className="t" style={sx({ color: '#64748B', fontSize: 12, marginBottom: 12 })}>
                            Your main professional category
                        </span>
                        <div className="v" style={sx({ alignSelf: 'flex-start', backgroundColor: '#1565C0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14 })}>
                            <span className="t" style={sx({ color: '#FFFFFF', fontWeight: '800' })}>
                                {worker.role || 'General Worker'}
                            </span>
                        </div>

                        <span className="t" style={sx({ color: '#172033', fontSize: 14, fontWeight: '800', marginBottom: 9 })}>
                            Primary Skills
                        </span>
                        {worker.primarySkills && worker.primarySkills.length > 0 ? (
                            <div className="v" style={sx({ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 })}>
                                {worker.primarySkills.map((skill, index) => (
                                    <div className="v" key={`${skill}-${index}`} style={sx({ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 })}>
                                        <Icon name="check-decagram" size={14} color="#1565C0" />
                                        <span className="t" style={sx({ color: '#0D47A1', fontWeight: '700', fontSize: 12, marginLeft: 5 })}>{skill}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="t" style={sx([styles.emptyText, { textAlign: 'left', marginBottom: 18 }])}>No primary skills added.</span>
                        )}

                        <div className="v" style={sx(styles.divider)} />
                        <span className="t" style={sx({ color: '#172033', fontSize: 14, fontWeight: '800', marginTop: 14, marginBottom: 4 })}>
                            Secondary / Part-Time Services
                        </span>
                        <span className="t" style={sx({ color: '#64748B', fontSize: 12, marginBottom: 12 })}>
                            Additional categories and services you can provide
                        </span>

                        {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
                            worker.partTimeSkills.map((group, groupIndex) => (
                                <div className="v" key={`${group.categoryName}-${groupIndex}`} style={sx({ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 13, padding: 12, marginBottom: 10 })}>
                                    <div className="v" style={sx({ flexDirection: 'row', alignItems: 'center', marginBottom: 9 })}>
                                        <Icon name="briefcase-outline" size={17} color="#1565C0" />
                                        <span className="t" style={sx({ color: '#172033', fontWeight: '800', marginLeft: 7 })}>
                                            {group.categoryName || 'Additional Service'}
                                        </span>
                                    </div>
                                    <div className="v" style={sx({ flexDirection: 'row', flexWrap: 'wrap', gap: 7 })}>
                                        {(group.skills || []).map((skill, index) => (
                                            <div className="v" key={`${skill}-${index}`} style={sx({ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9E5F3', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 })}>
                                                <span className="t" style={sx({ color: '#475569', fontSize: 12, fontWeight: '600' })}>{skill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="v" style={sx({ alignItems: 'center', paddingVertical: 24 })}>
                                <Icon name="briefcase-off-outline" size={38} color="#CBD5E1" />
                                <span className="t" style={sx([styles.emptyText, { marginTop: 8 }])}>No secondary services added.</span>
                            </div>
                        )}
                    </div>
                </div></div>

                {/* 3. TIME SLOTS TAB */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })} ><div className="v scroll-content" style={sx(styles.tabContentPadding)}>
                    <div className="v" style={sx(styles.card)}>
                        <div className="v" style={sx(styles.cardRow)}>
                            <div className="v" style={sx(styles.iconCircleBg)}>
                                <Icon name="clock-outline" size={20} color="#1E64D3" />
                            </div>
                            <div className="v" style={sx({ flex: 1, marginLeft: 12 })}>
                                <span className="t" style={sx(styles.cardTitle)}>Weekly Availability</span>
                                <span className="t" style={sx(styles.cardSubtext)}>Manage your free working hours</span>
                            </div>
                            <button className="v btn" type="button"
                                style={sx(styles.lightBlueBtn)}
                                onClick={press(() => setIsSlotModalVisible(true))}
                            >
                                <span className="t" style={sx(styles.lightBlueBtnText)}>+ Add Slot</span>
                            </button>
                        </div>

                        {loadingSlots ? (
                            <Spinner size="small" color="#1E64D3" />
                        ) : timeSlots.length > 0 ? (
                            timeSlots.map((slot) => (
                                <div className="v" key={slot.id} style={sx(styles.slotRowCard)}>
                                    <div className="v" style={sx(styles.greenDot)} />
                                    <div className="v" style={sx({ flex: 1, marginLeft: 10 })}>
                                        <span className="t" style={sx(styles.slotTimeText)}>{slot.startTime} - {slot.endTime}</span>
                                        <span className="t" style={sx(styles.slotSubText)}>Available Shift</span>
                                    </div>
                                    <button className="v btn" type="button" onClick={press(() => handleDeleteSlot(slot.id))}>
                                        <Icon name="trash-can-outline" size={18} color="#8E8E93" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="v" style={sx(styles.emptyReviewsContainer)}>
                                <Icon name="clock-outline" size={40} color="#D1D1D6" />
                                <span className="t" style={sx(styles.emptyText)}>No available time slots yet.</span>
                            </div>
                        )}
                    </div>
                </div></div>

                {/* 3. EXPERIENCE TAB */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })} ><div className="v scroll-content" style={sx(styles.tabContentPadding)}>
                    <div className="v" style={sx(styles.card)}>
                        <span className="t" style={sx(styles.sectionHeading)}>Experience History</span>
                        {worker.experiences && worker.experiences.length > 0 ? (
                            worker.experiences.map((exp, index) => (
                                <ExperienceItem
                                    key={index}
                                    title={exp.title}
                                    bullets={[exp.details]}
                                    period={exp.period}
                                    isActive={index === 0}
                                />
                            ))
                        ) : (
                            <span className="t" style={sx(styles.emptyText)}>No experiences recorded.</span>
                        )}
                    </div>
                </div></div>

                {/* 4. REVIEWS TAB */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })} ><div className="v scroll-content" style={sx(styles.tabContentPadding)}>
                    <div className="v card-grid" style={sx(styles.card)}>
                        <div className="v" style={sx(styles.reviewsHeaderContainer)}>
                            <span className="t" style={sx(styles.sectionHeading)}>Customer Reviews</span>
                            <div className="v" style={sx(styles.overallRatingBadge)}>
                                <Icon name="star" size={18} color="#FFD700" />
                                <span className="t" style={sx(styles.overallRatingText)}>
                                    {reviewsAverage ?? worker.rating ?? "0.0"}
                                </span>
                                <span className="t" style={sx(styles.overallCountText)}>
                                    ({reviewsCount ?? worker.reviewCount ?? 0})
                                </span>
                            </div>
                        </div>

                        <div className="v" style={sx(styles.divider)} />

                        {loadingReviews ? (
                            <Spinner size="small" color="#1E64D3" style={{ marginVertical: 20 }} />
                        ) : reviewsList && reviewsList.length > 0 ? (
                            reviewsList.map((item, index) => {
                                const reviewerName = item.reviewerName || item.name || item.clientName || 'Customer';
                                const starsGiven = Math.round(Number(item.rating) || 0);
                                return (
                                    <div className="v grid-item" key={item.id || index} style={sx(styles.inlineReviewCard)}>
                                        <div className="v" style={sx(styles.reviewHeaderRow)}>
                                            <div className="v" style={sx(styles.reviewUserRow)}>
                                                <div className="v" style={sx(styles.reviewAvatarPlaceholder)}>
                                                    <span className="t" style={sx(styles.reviewAvatarText)}>
                                                        {reviewerName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="v">
                                                    <span className="t" style={sx(styles.clientNameText)}>{reviewerName}</span>
                                                    <span className="t" style={sx(styles.reviewDateText)}>
                                                        {item.workedPeriod ? `Worked: ${item.workedPeriod}` : (item.date || 'Recent')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="v" style={sx(styles.starsRow)}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Icon
                                                        key={star}
                                                        name={star <= starsGiven ? "star" : "star-outline"}
                                                        size={16}
                                                        color={star <= starsGiven ? "#FFD700" : "#E0E0E0"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="t" style={sx(styles.reviewCommentText)}>
                                            {item.comment || item.reviewText || "No detailed comment provided."}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="v" style={sx(styles.emptyReviewsContainer)}>
                                <Icon name={reviewsError ? "wifi-off" : "message-draw"} size={40} color="#D1D1D6" />
                                <span className="t" style={sx(styles.emptyText)}>
                                    {reviewsError ? "Couldn't load reviews. Pull back into this screen to retry." : "No reviews found yet."}
                                </span>
                            </div>
                        )}
                    </div>
                </div></div>
            </ScrollView>

            {/* ADD/EDIT TIME SLOT MODAL */}
            <Dialog visible={isSlotModalVisible} animationType="slide" transparent={true}>
                <div className="v" style={sx(styles.modalOverlay)}>
                    <div className="v" style={sx(styles.modalContent)}>
                        <span className="t" style={sx(styles.modalHeader)}>Manage Time Slot</span>
                        <span className="t" style={sx(styles.modalLabel)}>Select Shift Timings</span>

                        <button className="v btn" type="button" style={sx(styles.modalPickerBtn)} onClick={press(() => setShowStartPicker(true))}>
                            <Icon name="clock-outline" size={20} color="#1E64D3" style={{ marginRight: 8 }} />
                            <span className="t" style={sx(styles.modalPickerBtnText)}>
                                Start: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </button>

                        <button className="v btn" type="button" style={sx(styles.modalPickerBtn)} onClick={press(() => setShowEndPicker(true))}>
                            <Icon name="clock-outline" size={20} color="#1E64D3" style={{ marginRight: 8 }} />
                            <span className="t" style={sx(styles.modalPickerBtnText)}>
                                End: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </button>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowStartPicker(false);
                                    if (selectedDate) setStartTime(selectedDate);
                                }}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={endTime}
                                mode="time"
                                is24Hour={false}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowEndPicker(false);
                                    if (selectedDate) setEndTime(selectedDate);
                                }}
                            />
                        )}

                        <div className="v" style={sx(styles.modalActions)}>
                            <button className="v btn" type="button"
                                style={sx(styles.modalCancelBtn)}
                                onClick={press(() => setIsSlotModalVisible(false))}
                            >
                                <span className="t" style={sx(styles.modalCancelText)}>Cancel</span>
                            </button>

                            <button className="v btn" type="button"
                                style={sx(styles.modalSaveBtn)}
                                onClick={press(handleAddTimeSlot)}
                                disabled={submittingSlot}
                            >
                                {submittingSlot ? (
                                    <Spinner color="#FFF" />
                                ) : (
                                    <span className="t" style={sx(styles.modalSaveText)}>Save Slot</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

// Internal Component
const ExperienceItem = ({ title, bullets, period, isActive }) => (
    <div className="v" style={sx(styles.expItem)}>
        <div className="v" style={sx(styles.timeline)}>
            <div className="v" style={sx([styles.dot, isActive && styles.activeDot])} />
            <div className="v" style={sx(styles.line)} />
        </div>
        <div className="v" style={sx(styles.expContent)}>
            <span className="t" style={sx(styles.expTitle)}>{title}</span>
            {bullets.map((b, i) => (
                <span className="t" key={i} style={sx(styles.expBullet)}>• {b}</span>
            ))}
            <span className="t" style={sx(styles.expPeriod)}>{period}</span>
        </div>
    </div>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB', marginTop: 20 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fixedHeaderPadding: { paddingHorizontal: 16, paddingTop: 16 },
    tabContentPadding: { padding: 16 },

    // Header & Profile Image
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    profileAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, borderWidth: 1.5, borderColor: '#1E64D3' },
    profileAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EBF3FF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#1E64D3' },
    greetingText: { fontSize: 11, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
    headerName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginVertical: 1 },
    roleAgeRow: { flexDirection: 'row', alignItems: 'center' },
    roleText: { fontSize: 14, fontWeight: '700', color: '#1E64D3' },
    ageText: { fontSize: 13, color: '#8E8E93' },
    headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pillEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
    pillEditBtnText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
    logoutIconBtn: { backgroundColor: '#FEE2E2', padding: 7, borderRadius: 16 },

    // Top Summary Info Card
    infoCard: { flexDirection: 'row', backgroundColor: '#F0F4F8', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
    infoCol: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold', marginBottom: 2 },
    infoValue: { fontSize: 11, fontWeight: 'bold', color: '#1C1C1E', padding: 5 },
    infoValueLocation: { fontSize: 11, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center' },
    infoSub: { fontSize: 10, color: '#8E8E93' },
    verticalDivider: { width: 1, height: '80%', backgroundColor: '#D1D1D6' },

    // Underline Tabs Header
    underlineTabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', marginBottom: 4 },
    underlineTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    underlineTabBtnActive: { borderBottomColor: '#1E64D3' },
    underlineTabText: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
    underlineTabTextActive: { color: '#1E64D3', fontWeight: 'bold' },

    // Cards
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
    cardSubtext: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    onlineBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
    onlineBadgeText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
    iconCircleBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
    itemSubtext: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
    bluePillBtn: { backgroundColor: '#1E64D3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    bluePillBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    // Dynamic Radius Interactive Strip
    radiusRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    radiusBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#1E64D3' },
    radiusStripContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    radiusAdjustBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EBF3FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radiusBtnDisabled: {
        backgroundColor: '#F2F2F7',
    },
    radiusTrackBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E5EA',
        borderRadius: 4,
        overflow: 'hidden',
    },
    radiusTrackFill: {
        height: '100%',
        backgroundColor: '#1E64D3',
        borderRadius: 4,
    },
    radiusLimitText: {
        fontSize: 10,
        color: '#8E8E93',
        textAlign: 'right',
        marginTop: 4,
    },

    // Notification Cards
    notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
    notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
    notifSub: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
    redBadge: { backgroundColor: '#E53935', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    redBadgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

    // Availability Section
    lightBlueBtn: { backgroundColor: '#EBF3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    lightBlueBtnText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },
    dayPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F2F2F7', marginRight: 6 },
    dayPillActive: { backgroundColor: '#1E64D3' },
    dayPillText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
    dayPillTextActive: { color: '#FFF' },
    slotRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 8 },
    greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
    slotTimeText: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
    slotSubText: { fontSize: 11, color: '#8E8E93' },

    modalPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    modalPickerBtnText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontWeight: '500',
    },

    // Employment & Experience Tab
    actionCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E5E5EA' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    actionSectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    actionSubtext: { fontSize: 13, color: '#666', marginBottom: 12 },
    terminateBtn: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#FF4D4D' },
    terminateText: { color: '#FF4D4D', fontWeight: 'bold', marginLeft: 8 },
    checkStatusBtn: { backgroundColor: '#FF3B30', height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    habitsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF4FF', borderWidth: 1, borderColor: '#D8E6FF', height: 45, borderRadius: 22, marginBottom: 14, gap: 8 },
    habitsBtnText: { color: '#1E64D3', fontWeight: '700', fontSize: 14 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },

    expItem: { flexDirection: 'row', minHeight: 70 },
    timeline: { alignItems: 'center', marginRight: 12 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CCC' },
    activeDot: { backgroundColor: '#1E64D3' },
    line: { flex: 1, width: 2, backgroundColor: '#E5E5EA' },
    expContent: { flex: 1, paddingBottom: 16 },
    expTitle: { fontWeight: 'bold', fontSize: 14, color: '#1C1C1E' },
    expBullet: { fontSize: 12, color: '#666', marginTop: 2 },
    expPeriod: { fontSize: 11, color: '#8E8E93', marginTop: 4 },

    // Reviews Section
    reviewsHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    overallRatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    overallRatingText: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
    overallCountText: { fontSize: 12, color: '#8E8E93' },
    inlineReviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewUserRow: { flexDirection: 'row', alignItems: 'center' },
    reviewAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EBF3FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    reviewAvatarText: { color: '#1E64D3', fontWeight: 'bold', fontSize: 14 },
    clientNameText: { fontWeight: 'bold', fontSize: 13, color: '#1C1C1E' },
    reviewDateText: { fontSize: 10, color: '#8E8E93' },
    starsRow: { flexDirection: 'row' },
    reviewCommentText: { fontSize: 13, color: '#3A3A3C', lineHeight: 18 },
    emptyReviewsContainer: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    emptyText: { color: '#8E8E93', fontStyle: 'italic', fontSize: 13 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
    modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#1C1C1E' },
    modalLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 14 },
    modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
    modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { color: '#8E8E93', fontWeight: '600' },
    modalSaveBtn: { backgroundColor: '#1E64D3', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    modalSaveText: { color: '#FFF', fontWeight: 'bold' }
});

export default WorkerDashboardScreen;