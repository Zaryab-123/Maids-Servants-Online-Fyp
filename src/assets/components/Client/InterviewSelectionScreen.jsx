import React, { useState, useEffect, useCallback, useRef } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import DateTimePicker from '@/web/DateTimePicker';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import { jobTypeLabel } from '../helpers/JobTypeBadge';
import { Platform, Spinner, StyleSheet, Toggle, press, sx } from '@/web';


const toDateKey = (value) => {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const InterviewSelectionScreen = ({ navigation, route }) => {
    const { workerId, workerName } = route.params || {};

    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [clientAddress, setClientAddress] = useState('');

    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [hasSlots, setHasSlots] = useState(true);
    const [isPartTime, setIsPartTime] = useState(false);
    const [isResidenceProvided, setIsResidenceProvided] = useState(false);
    const [radius, setRadius] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const submittingRef = useRef(false);
    const readyRef = useRef(false);

    const dateKey = toDateKey(date);

    useEffect(() => {
        const fetchUserData = async () => {
            const addr = await AsyncStorage.getItem('userAddress');
            if (addr) setClientAddress(addr);
        };
        fetchUserData();
    }, []);

    // A booking must never be created by a stray touch. Two things are handled here:
    //   1. no workerId  -> nothing to book
    //   2. the Confirm button lives in the same bottom strip as the button that opened
    //      this screen, so a fall-through/double tap can reach it before the user has
    //      read anything. The button therefore stays inert for 500 ms after mount
    //      (and even then, a Part-Time booking still requires picking a slot first).
    useEffect(() => {
        if (!workerId) {
            NotificationHelper.showError('Worker information is missing. Please open the worker again.');
            navigation.goBack();
            return;
        }

        const timer = setTimeout(() => {
            readyRef.current = true;
            setIsReady(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [workerId, navigation]);

    const fetchSlots = useCallback(async () => {
        try {
            setSlotsLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(
                `${SERVER_BASE}/api/Dashboard/GetWorkerAvailableSlots/${workerId}?date=${dateKey}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setSlots(Array.isArray(data.slots) ? data.slots : []);
                setHasSlots(!!data.hasSlots);
                setIsPartTime(!!data.isPartTimeAvailable);
                setRadius(data.radius ?? null);
                setDistanceKm(data.distanceKm ?? null);
            } else {
                setSlots([]);
            }
        } catch (error) {
            console.error('Slot fetch error:', error);
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    }, [workerId, dateKey]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    useEffect(() => {
        setSelectedSlotId(null);
    }, [dateKey]);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const showMode = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    const showTimepicker = () => {
        showMode('time');
    };

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
    const bookingBlockedBySlots = isPartTime && !slotsLoading && (!hasSlots || slots.length === 0);
    const needsSlot = isPartTime && !bookingBlockedBySlots;
    const canConfirm = isReady && !isLoading && !slotsLoading && !bookingBlockedBySlots && (!needsSlot || !!selectedSlot);

    const handleConfirmInterview = async () => {
        // ignore the very first moments and every repeat tap while a request is in flight
        if (!readyRef.current || submittingRef.current) return;

        if (bookingBlockedBySlots) {
            NotificationHelper.showError('This worker has not published any time slots yet.');
            return;
        }

        if (needsSlot && !selectedSlot) {
            NotificationHelper.showError('Please pick one of the worker\'s time slots.');
            return;
        }

        submittingRef.current = true;
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date - offset)).toISOString().slice(0, 19);

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/BookInterview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    WorkerId: workerId,
                    InterviewDate: localISOTime,
                    Address: clientAddress,
                    Status: 'Pending',
                    SlotId: isPartTime && selectedSlot ? selectedSlot.id : null,
                    IsResidenceProvided: !isPartTime ? isResidenceProvided : false
                })
            });

            if (response.ok) {
                const data = await response.json().catch(() => ({}));
                const typeLabel = data.jobType ? jobTypeLabel(data.jobType) : '';
                const slotLabel = isPartTime && selectedSlot
                    ? ` (${selectedSlot.startTime} - ${selectedSlot.endTime})`
                    : '';
                NotificationHelper.showSuccess(
                    `${typeLabel} interview request sent to ${workerName}${slotLabel}!`
                );
                navigation.replace('UserDashboardScreen');
            } else {
                const err = await response.json().catch(() => ({}));
                NotificationHelper.showError(err.message || 'Failed to book interview.');
            }
        } catch (error) {
            console.error('Booking error:', error);
            NotificationHelper.showError('Could not connect to server.');
        } finally {
            submittingRef.current = false;
            setIsLoading(false);
        }
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backCircle)}>
                    <Icon name="arrow-left" size={24} color="#555" />
                </button>
                <span className="t" style={sx(styles.headerTitle)}>Select Date & Time</span>
            </div>

            <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                <span className="t" style={sx(styles.subTitle)}>When do you need to interview {workerName}?</span>

                {isPartTime && (
                    <div className="v" style={sx(styles.typeBanner)}>
                        <div className="v" style={sx(styles.typeBannerTop)}>
                            <Icon name="map-marker-radius" size={16} color="#B45309" />
                            <span className="t" style={sx(styles.typeBannerText)}>PART-TIME BOOKING</span>
                            {distanceKm !== null && (
                                <span className="t" style={sx(styles.typeBannerHint)}>{distanceKm} km away</span>
                            )}
                        </div>
                        <span className="t" style={sx(styles.typeBannerBody)}>
                            You are inside this worker's {radius ?? 5} km radius.
                            {hasSlots
                                ? ' Pick the time window you need the worker for from the list below.'
                                : ' This worker has not published time slots yet.'}
                        </span>
                    </div>
                )}

                <div className="v" style={sx(styles.pickerSection)}>
                    <span className="t" style={sx(styles.sectionHeading)}>Interview Date</span>
                    <button className="v btn" type="button" style={sx(styles.selectorCard)} onClick={press(showDatepicker)} >
                        <div className="v" style={sx(styles.iconCircleBlue)}>
                            <Icon name="calendar" size={24} color="#1E64D3" />
                        </div>
                        <div className="v" style={sx(styles.selectorTextCol)}>
                            <span className="t" style={sx(styles.selectorLabel)}>Tap to choose date</span>
                            <span className="t" style={sx(styles.selectorValue)}>{date.toDateString()}</span>
                        </div>
                        <Icon name="chevron-right" size={24} color="#888" />
                    </button>
                </div>

                <div className="v" style={sx(styles.pickerSection)}>
                    <span className="t" style={sx(styles.sectionHeading)}>Interview Time</span>
                    <button className="v btn" type="button" style={sx(styles.selectorCard)} onClick={press(showTimepicker)} >
                        <div className="v" style={sx(styles.iconCirclePurple)}>
                            <Icon name="clock-outline" size={24} color="#6750A4" />
                        </div>
                        <div className="v" style={sx(styles.selectorTextCol)}>
                            <span className="t" style={sx(styles.selectorLabel)}>Tap to choose time</span>
                            <span className="t" style={sx(styles.selectorValue)}>
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <Icon name="chevron-right" size={24} color="#888" />
                    </button>
                </div>

                {show && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode={mode}
                        is24Hour={false}
                        display="default"
                        onChange={onChange}
                    />
                )}

                {isPartTime && (
                    <div className="v" style={sx(styles.pickerSection)}>
                        <span className="t" style={sx(styles.sectionHeading)}>Worker's Time Slots</span>
                        <span className="t" style={sx(styles.sectionHint)}>
                            Choose the window you need {workerName} for on {date.toDateString()}.
                        </span>

                        {slotsLoading ? (
                            <Spinner size="small" color="#1E64D3" style={styles.slotsLoader} />
                        ) : bookingBlockedBySlots ? (
                            <div className="v" style={sx(styles.slotsEmptyBox)}>
                                <Icon name="calendar-remove-outline" size={30} color="#B45309" />
                                <span className="t" style={sx(styles.slotsEmptyText)}>
                                    This worker has not published any time slots yet, so a part-time
                                    booking cannot be created. Please try another worker or check back later.
                                </span>
                            </div>
                        ) : (
                            <div className="v" style={sx(styles.slotsWrap)}>
                                {slots.map((slot) => {
                                    const isSelected = slot.id === selectedSlotId;
                                    return (
                                        <button className="v btn" type="button"
                                            key={slot.id}
                                            disabled={slot.isTaken}
                                            onClick={press(() => setSelectedSlotId(slot.id))}
                                            style={sx([
                                                styles.slotChip,
                                                isSelected && styles.slotChipActive,
                                                slot.isTaken && styles.slotChipTaken
                                            ])}
                                        >
                                            <span className="t" style={sx([
                                                styles.slotChipText,
                                                isSelected && styles.slotChipTextActive,
                                                slot.isTaken && styles.slotChipTextTaken
                                            ])}>
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                            {slot.isTaken && <span className="t" style={sx(styles.slotTakenText)}>Booked</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="v" style={sx(styles.pickerSection)}>
                    <span className="t" style={sx(styles.sectionHeading)}>Interview Location</span>
                    <div className="v" style={sx(styles.selectorCard)}>
                        <div className="v" style={sx(styles.iconCircleOrange)}>
                            <Icon name="map-marker" size={24} color="#E65100" />
                        </div>
                        <div className="v" style={sx(styles.selectorTextCol)}>
                            <span className="t" style={sx(styles.selectorLabel)}>Your Address</span>
                            <span className="t" style={sx(styles.selectorValue, 2)} >
                                {clientAddress || 'Loading address...'}
                            </span>
                        </div>
                    </div>
                </div>

                {!isPartTime && (
                    <div className="v" style={sx(styles.pickerSection)}>
                        <span className="t" style={sx(styles.sectionHeading)}>Residence Provision</span>
                        <div className="v" style={sx(styles.selectorCard)}>
                            <div className="v" style={sx(styles.iconCircleGreen)}>
                                <Icon name="home-city-outline" size={24} color="#16A34A" />
                            </div>
                            <div className="v" style={sx(styles.selectorTextCol)}>
                                <span className="t" style={sx(styles.selectorLabel)}>Will residence be provided?</span>
                                <span className="t" style={sx(styles.selectorValue)}>
                                    {isResidenceProvided ? 'Yes, residence included' : 'No residence provided'}
                                </span>
                            </div>
                            <Toggle
                                value={isResidenceProvided}
                                onValueChange={setIsResidenceProvided}
                                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                                thumbColor={isResidenceProvided ? '#16A34A' : '#F3F4F6'}
                            />
                        </div>
                    </div>
                )}

                <div className="v" style={sx(styles.spacer)} />
            </div></div>

            <div className="v" style={sx(styles.footerContainer)}>
                <button className="v btn" type="button"
                    style={sx([styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled])}
                    onClick={press(handleConfirmInterview)}
                    disabled={!canConfirm}
                >
                    {isLoading ? (
                        <Spinner color="#FFF" />
                    ) : (
                        <span className="t" style={sx(styles.confirmBtnText)}>
                            {bookingBlockedBySlots
                                ? 'No Slots Available'
                                : needsSlot && !selectedSlot
                                    ? 'Pick A Time Slot'
                                    : 'Confirm Booking'}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FBFF' },
    header: { padding: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
    backCircle: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 5, zIndex: 10 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#000' },

    scrollContent: { paddingHorizontal: 20 },
    subTitle: { fontSize: 16, color: '#555', marginBottom: 20 },

    typeBanner: {
        backgroundColor: '#FFF4E5',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
    },
    typeBannerTop: { flexDirection: 'row', alignItems: 'center' },
    typeBannerText: { fontSize: 12, fontWeight: '800', color: '#B45309', marginLeft: 6 },
    typeBannerHint: { fontSize: 11, fontWeight: '700', color: '#B45309', marginLeft: 'auto' },
    typeBannerBody: { fontSize: 12, color: '#7C4A03', marginTop: 6, lineHeight: 17 },

    pickerSection: { marginBottom: 25 },
    sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 10, marginLeft: 5 },
    sectionHint: { fontSize: 12, color: '#777', marginBottom: 10, marginLeft: 5 },

    selectorCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 15, borderRadius: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE'
    },
    iconCircleBlue: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconCirclePurple: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#F3EDF7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconCircleOrange: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconCircleGreen: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E6F4EA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },

    selectorTextCol: { flex: 1 },
    selectorLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    selectorValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    slotsLoader: { marginTop: 10 },
    slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: {
        minWidth: 110,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#D8E6FF',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
    },
    slotChipActive: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    slotChipTaken: { backgroundColor: '#F2F2F7', borderColor: '#E5E5EA', elevation: 0 },
    slotChipText: { fontSize: 13, fontWeight: '700', color: '#1E64D3' },
    slotChipTextActive: { color: '#FFF' },
    slotChipTextTaken: { color: '#A1A1AA', textDecorationLine: 'line-through' },
    slotTakenText: { fontSize: 10, fontWeight: '700', color: '#A1A1AA', marginTop: 2 },

    slotsEmptyBox: {
        backgroundColor: '#FFF4E5',
        borderWidth: 1,
        borderColor: '#FCD9A4',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    slotsEmptyText: { fontSize: 12, color: '#7C4A03', textAlign: 'center', marginTop: 8, lineHeight: 17 },

    spacer: { height: 120 },
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#F8FBFF' },
    confirmBtn: { backgroundColor: '#1E64D3', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    confirmBtnDisabled: { backgroundColor: '#B9CCEA', elevation: 0 },
    confirmBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default InterviewSelectionScreen;
