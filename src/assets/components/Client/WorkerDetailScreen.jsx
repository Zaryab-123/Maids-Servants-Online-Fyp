import React, { useState, useEffect, useRef, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import { Dimensions, ScrollView, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE = API_DASHBOARD;

const WorkerDetailScreen = ({ navigation, route }) => {
    const { workerId } = route.params;
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const horizontalScrollRef = useRef(null);

    // Compute dynamic tabs array
    const tabs = [
        'Overview',
        'Experience',
        'Reviews',
        // Conditional pages stay at the END so the pager indexes always line up.
        ...(worker?.isPartTimeAvailable ? ['Time Slots'] : []),
        ...(worker?.habits && worker.habits.length > 0 ? ['Habits'] : []),
    ];

    // Refetch when the screen regains focus, so after booking (or after the worker
    // changes something) the footer button no longer shows a stale state.

    const fetchWorkerDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const clientId = await AsyncStorage.getItem('clientId');

            const response = await fetch(`${API_BASE}/GetWorkerDetail/${workerId}?clientIdParam=${clientId || ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
            } else {
                NotificationHelper.showError("Failed to fetch worker details.");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching worker details:", error);
            NotificationHelper.showError("Could not connect to server.");
        } finally {
            setIsLoading(false);
        }
    }, [workerId, navigation]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkerDetails();
        });
        return unsubscribe;
    }, [navigation, fetchWorkerDetails]);

    const callLockRef = useRef(false);

    // Opens the interview booking screen. The lock makes a double tap harmless and the
    // guard means a tap that arrives before the worker payload exists cannot push a
    // screen without a workerId (which used to land the client back on the dashboard).
    const handleCallForInterview = () => {
        if (callLockRef.current) return;

        const id = worker?.id || route.params?.workerId;
        if (!id) {
            NotificationHelper.showError('Worker details are still loading. Please try again.');
            return;
        }

        callLockRef.current = true;
        setTimeout(() => { callLockRef.current = false; }, 800);

        navigation.navigate('InterviewSelectionScreen', {
            workerId: id,
            workerName: worker?.name || 'this worker',
        });
    };

    const handleTabPress = (index) => {
        setActiveTab(index);
        horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    const handleScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / SCREEN_WIDTH);
        if (index !== activeTab && index >= 0 && index < tabs.length) {
            setActiveTab(index);
        }
    };

    if (isLoading) {
        return (
            <div className="v" style={sx([styles.container, styles.center])}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    if (!worker) return null;

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header / Hero Section */}
            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button"
                    style={sx(styles.backButton)}
                    onClick={press(() => navigation.goBack())}
                >
                    <Icon name="arrow-left" size={24} color="#1F2937" />
                </button>

                <div className="v" style={sx(styles.profileHeader)}>
                    <img className="img" alt=""
                        src={imgSrc({
                            uri: worker.picture && worker.picture.startsWith('/')
                                ? `${SERVER_BASE}${worker.picture}`
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                        })}
                        style={sx(styles.avatar)}
                    />
                    <div className="v" style={sx(styles.profileInfo)}>
                        <span className="t" style={sx(styles.nameText)}>{worker.name}</span>
                        <span className="t" style={sx(styles.roleTitle)}>{worker.role}</span>

                        <div className="v" style={sx(styles.badgeRow)}>
                            <div className="v" style={sx([
                                styles.statusBadge,
                                (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusBadgeUnavailable
                            ])}>
                                <div className="v" style={sx([
                                    styles.statusDot,
                                    (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusDotUnavailable
                                ])} />
                                <span className="t" style={sx([
                                    styles.statusText,
                                    (worker.availability === "NOT AVAILABLE" || worker.availability === "Currently Booked") && styles.statusTextUnavailable
                                ])}>
                                    {worker.availability === "Available 24/7" ? "AVAILABLE" : worker.availability}
                                </span>
                            </div>

                            {/* Conditional Part-Time Available Badge */}
                            {worker.isPartTimeAvailable && (
                                <div className="v" style={sx(styles.partTimeTag)}>
                                    <Icon name="clock-outline" size={11} color="#975A16" />
                                    <span className="t" style={sx(styles.partTimeTagText)}>PART-TIME AVAILABLE</span>
                                </div>
                            )}
                        </div>
                        <span className="t" style={sx(styles.genderTitle)}>{worker.gender ? worker.gender.toUpperCase() : ''} • {worker.age} Y/O</span>
                    </div>
                </div>

                {/* Stat Grid */}
                <div className="v" style={sx(styles.statsContainer)}>
                    <StatItem
                        flex={0.8}
                        label="RATING"
                        value={`★ ${worker.rating || '0.0'}`}
                        subText={`(${worker.reviewCount || 0})`}
                    />
                    <div className="v" style={sx(styles.divider)} />
                    <StatItem
                        flex={1.8}
                        label="LOCATION"
                        value={worker.location ? worker.location.toUpperCase() : "N/A"}
                    />
                    <div className="v" style={sx(styles.divider)} />
                    <StatItem
                        flex={1.1}
                        label="SALARY"
                        value={`Rs.${worker.salary}`}
                    />
                </div>

                {/* Tab Controls */}
                <div className="v" style={sx(styles.tabContainer)}>
                    {tabs.map((tab, index) => (
                        <button className="v btn" type="button"
                            key={tab}
                            style={sx([styles.tabButton, activeTab === index && styles.activeTabButton])}
                            onClick={press(() => handleTabPress(index))}
                        >
                            <span className="t" style={sx([styles.tabText, activeTab === index && styles.activeTabText])}>
                                {tab}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Horizontal Swipeable Container for Tabs */}
            <ScrollView
                ref={horizontalScrollRef}
                horizontal
                pagingEnabled
                
                onMomentumScrollEnd={handleScroll}
                style={{ flex: 1 }}
            >
                {/* ── OVERVIEW TAB ── */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })}  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                    <span className="t" style={sx(styles.sectionTitle)}>Trust & Verification</span>

                    <button className="v btn" type="button"
                        style={sx(styles.companyBadgeButton)}
                        onClick={press(() => navigation.navigate('WorkerCertificationDetail', { workerId: worker.id || workerId }))}
                    >
                        <Icon name="shield-check" size={22} color="#026597" />
                        <div className="v" style={sx(styles.badgeTextContainer)}>
                            <span className="t" style={sx(styles.companyBadgeTitle)}>Verified Training</span>
                            <span className="t" style={sx(styles.companyBadgeSubtitle)}>
                                Certified by {worker.companyName || 'Proton Services'}
                            </span>
                        </div>
                        <Icon name="chevron-right" size={20} color="#026597" />
                    </button>

                    <button className="v btn" type="button"
                        style={sx(styles.policeAlertButton)}
                        onClick={press(() => navigation.navigate('CharacterCertificateScreen', { workerId: worker.id || workerId }))}
                    >
                        <Icon name="shield-alert" size={22} color="#B91C1C" />
                        <div className="v" style={sx(styles.badgeTextContainer)}>
                            <span className="t" style={sx(styles.policeAlertTitle)}>Criminal Background Check</span>
                            <span className="t" style={sx(styles.policeAlertSubtitle)}>Click to review FIR & verification status</span>
                        </div>
                        <Icon name="chevron-right" size={20} color="#B91C1C" />
                    </button>

                    <span className="t" style={sx(styles.sectionTitle)}>About Worker</span>
                    <span className="t" style={sx(styles.aboutDescription)}>{worker.bio || "No description provided."}</span>

                    <span className="t" style={sx(styles.sectionTitle)}>Primary Skills</span>
                    <div className="v" style={sx(styles.chipWrapper)}>
                        {worker.primarySkills && worker.primarySkills.length > 0 ? (
                            worker.primarySkills.map((skill, index) => (
                                <div className="v" key={index} style={sx(styles.skillChip)}>
                                    <span className="t" style={sx(styles.skillText)}>{skill.toUpperCase()}</span>
                                </div>
                            ))
                        ) : (
                            <span className="t" style={sx(styles.emptyText)}>No primary skills listed.</span>
                        )}
                    </div>

                    <span className="t" style={sx(styles.sectionTitle)}>Part-Time Services</span>
                    {worker.partTimeSkills && worker.partTimeSkills.length > 0 ? (
                        worker.partTimeSkills.map((item, index) => (
                            <div className="v" key={index} style={sx({ marginBottom: 10 })}>
                                <span className="t" style={sx(styles.subCategoryLabel)}>{item.categoryName.toUpperCase()}</span>
                                <div className="v" style={sx(styles.chipWrapper)}>
                                    {item.skills.map((skill, sIndex) => (
                                        <div className="v" key={sIndex} style={sx(styles.skillChipSecondary)}>
                                            <span className="t" style={sx(styles.skillTextSecondary)}>{skill.toUpperCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <span className="t" style={sx(styles.emptyText)}>No part-time skills added.</span>
                    )}
                    <div className="v" style={sx({ height: 100 })} />
                </div></div>

                {/* ── EXPERIENCE TAB ── */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })}  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                    <span className="t" style={sx(styles.sectionTitle)}>Work History</span>
                    {worker.experiences && worker.experiences.length > 0 ? (
                        worker.experiences.map((exp, index) => (
                            <ExperienceItem
                                key={index}
                                title={exp.title}
                                period={exp.period}
                                bullets={[exp.details]}
                                isActive={index === 0}
                            />
                        ))
                    ) : (
                        <span className="t" style={sx(styles.emptyText)}>No experience history available.</span>
                    )}

                    <span className="t" style={sx(styles.sectionTitle)}>Booking Procedure</span>
                    <div className="v" style={sx(styles.procedureCard)}>
                        <ProcedureStep step="1" text="Send an interview request with preferred timings." />
                        <ProcedureStep step="2" text="Wait for status confirmation or callback." />
                        <ProcedureStep step="3" text="Finalize details & start service." />
                    </div>
                    <div className="v" style={sx({ height: 100 })} />
                </div></div>

                {/* ── REVIEWS TAB ── */}
                <div className="v scroll" style={sx({ width: SCREEN_WIDTH })}  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                    <span className="t" style={sx(styles.sectionTitle)}>Client Feedback & Ratings</span>

                    <div className="v" style={sx(styles.overallRatingCard)}>
                        <span className="t" style={sx(styles.bigRatingText)}>{worker.rating || "0.0"}</span>
                        <div className="v" style={sx({ marginLeft: 12 })}>
                            <div className="v" style={sx(styles.starsRow)}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Icon
                                        key={i}
                                        name={i <= Math.round(worker.rating || 0) ? "star" : "star-outline"}
                                        size={18}
                                        color={i <= Math.round(worker.rating || 0) ? "#FFD700" : "#CBD5E1"}
                                    />
                                ))}
                            </div>
                            <span className="t" style={sx(styles.totalReviewsSubText)}>Based on {worker.reviewCount || 0} reviews</span>
                        </div>
                    </div>

                    {worker.reviews && worker.reviews.length > 0 ? (
                        worker.reviews.map((rev, index) => (
                            <ReviewCard
                                key={index}
                                name={rev.reviewerName}
                                rating={rev.rating}
                                text={rev.comment}
                                date={rev.date}
                                workedPeriod={rev.workedPeriod}
                                onNamePress={() => {
                                    if (rev.clientId) {
                                        navigation.navigate('ClientProfileScreen', {
                                            clientId: rev.clientId,
                                            id: rev.clientId
                                        });
                                    } else {
                                        console.warn('Client ID is missing for this review.');
                                    }
                                }}
                            />
                        ))
                    ) : (
                        <div className="v" style={sx(styles.emptyReviewBox)}>
                            <Icon name="message-outline" size={40} color="#94A3B8" />
                            <span className="t" style={sx(styles.emptyText)}>No reviews submitted yet.</span>
                        </div>
                    )}
                    <div className="v" style={sx({ height: 100 })} />
                </div></div>

                {/* ── TIME SLOTS TAB (RENDERED CONDITIONALLY) ── */}
                {worker.isPartTimeAvailable && (
                    <div className="v scroll" style={sx({ width: SCREEN_WIDTH })}  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                        <span className="t" style={sx(styles.sectionTitle)}>Part-Time Available Slots</span>
                        <span className="t" style={sx({ fontSize: 12, color: '#64748B', marginBottom: 12 })}>
                            This worker is within your radius ({worker.distanceKm} km away).
                        </span>

                        {worker.timeSlots && worker.timeSlots.length > 0 ? (
                            worker.timeSlots.map((slot) => (
                                <div className="v" key={slot.id} style={sx(styles.slotCard)}>
                                    <Icon name="clock-time-four-outline" size={20} color="#3182CE" />
                                    <span className="t" style={sx(styles.slotText)}>{slot.startTime} - {slot.endTime}</span>
                                </div>
                            ))
                        ) : (
                            <div className="v" style={sx(styles.emptyReviewBox)}>
                                <Icon name="clock-alert-outline" size={36} color="#94A3B8" />
                                <span className="t" style={sx(styles.emptyText)}>No active time slots defined for this worker.</span>
                            </div>
                        )}
                        <div className="v" style={sx({ height: 100 })} />
                    </div></div>
                )}

                {/* ── HABITS TAB (RENDERED CONDITIONALLY) ── */}
                {worker.habits && worker.habits.length > 0 && (
                    <div className="v scroll" style={sx({ width: SCREEN_WIDTH })}  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                        <span className="t" style={sx(styles.sectionTitle)}>Habits</span>
                        <span className="t" style={sx(styles.habitsSubtitle)}>
                            Declared by the worker — worth knowing before they work in your home.
                        </span>

                        <div className="v" style={sx(styles.habitsGrid)}>
                            {worker.habits.map((habit) => (
                                <div className="v" key={habit.id ?? habit.name} style={sx(styles.habitChip)}>
                                    <Icon name="check-circle-outline" size={15} color="#1E64D3" />
                                    <span className="t" style={sx(styles.habitChipText)}>{habit.name}</span>
                                </div>
                            ))}
                        </div>

                        <span className="t" style={sx(styles.sectionTitle)}>Looking for something specific?</span>
                        <span className="t" style={sx(styles.habitsSubtitle)}>
                            The filter on the search screen lets you show only workers who match the
                            habits you need — for example a non-smoker who is comfortable with pets.
                        </span>

                        <div className="v" style={sx({ height: 100 })} />
                    </div></div>
                )}
            </ScrollView>

            {/* Bottom Sticky Action Footer */}
            <div className="v" style={sx(styles.footer)}>
                <button className="v btn" type="button"
                    style={sx([
                        styles.callBtn,
                        (worker.hasActiveInterview || worker.availability === "NOT AVAILABLE") && styles.disabledBtn
                    ])}
                    disabled={worker.hasActiveInterview || worker.availability === "NOT AVAILABLE"}
                    onClick={press(handleCallForInterview)}
                >
                    <span className="t" style={sx(styles.callBtnText)}>
                        {['finalized', 'hired', 'accepted'].includes((worker.activeInterviewStatus || '').toString().toLowerCase())
                            ? 'Worker Hired'
                            : worker.availability === 'NOT AVAILABLE'
                                ? 'Worker Not Available'
                                : worker.hasActiveInterview
                                    ? 'Interview Request Pending'
                                    : 'Call For Interview'}
                    </span>
                </button>
            </div>
        </div>
    );
};

// Sub-components
const StatItem = ({ label, value, subText, flex = 1 }) => (
    <div className="v" style={sx([styles.statBox, { flex }])}>
        <span className="t" style={sx(styles.statLabel)}>{label}</span>
        <span className="t" style={sx(styles.statValue)}>{value}</span>
        {subText ? <span className="t" style={sx(styles.statSubText)}>{subText}</span> : null}
    </div>
);

const ExperienceItem = ({ title, period, bullets, isActive }) => (
    <div className="v" style={sx(styles.expContainer)}>
        <div className="v" style={sx(styles.timelineCol)}>
            <div className="v" style={sx([styles.dot, isActive && styles.activeDot])} />
            <div className="v" style={sx(styles.line)} />
        </div>
        <div className="v" style={sx(styles.expContent)}>
            <div className="v" style={sx(styles.rowBetween)}>
                <span className="t" style={sx(styles.expTitle)}>{title}</span>
                <span className="t" style={sx(styles.periodText)}>{period}</span>
            </div>
            {bullets.map((b, i) => (
                <span className="t" key={i} style={sx(styles.bulletText)}>{b}</span>
            ))}
        </div>
    </div>
);

const ReviewCard = ({ name, rating, date, text, workedPeriod, onNamePress }) => (
    <div className="v" style={sx(styles.reviewCard)}>
        <div className="v" style={sx(styles.rowBetween)}>
            <button className="v btn" type="button" onClick={press(onNamePress)}>
                <span className="t" style={sx([styles.reviewName, { textDecorationLine: 'underline' }])}>{name}</span>
            </button>
            <div className="v" style={sx(styles.starsRow)}>
                {[1, 2, 3, 4, 5].map(i => (
                    <Icon
                        key={i}
                        name={i <= rating ? "star" : "star-outline"}
                        size={14}
                        color={i <= rating ? "#FFD700" : "#CCC"}
                    />
                ))}
            </div>
        </div>
        <span className="t" style={sx(styles.reviewDuration)}>{date}</span>
        {workedPeriod ? (
            <div className="v" style={sx(styles.reviewWorkedRow)}>
                <Icon name="briefcase-outline" size={11} color="#1E64D3" />
                <span className="t" style={sx(styles.reviewWorkedText)}>Worked: {workedPeriod}</span>
            </div>
        ) : null}
        <span className="t" style={sx(styles.reviewText)}>"{text}"</span>
    </div>
);

const ProcedureStep = ({ step, text }) => (
    <div className="v" style={sx(styles.procedureStepRow)}>
        <div className="v" style={sx(styles.stepNumberBadge)}><span className="t" style={sx(styles.stepNumberText)}>{step}</span></div>
        <span className="t" style={sx(styles.procedureText)}>{text}</span>
    </div>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, alignSelf: 'flex-start', marginBottom: 8 },

    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 14 },
    profileInfo: { flex: 1 },
    nameText: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
    roleTitle: { fontSize: 14, color: '#1E64D3', fontWeight: '600', marginBottom: 4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    genderTitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 4 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    statusBadgeUnavailable: { backgroundColor: '#FEE2E2' },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginRight: 4 },
    statusDotUnavailable: { backgroundColor: '#DC2626' },
    statusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
    statusTextUnavailable: { color: '#B91C1C' },

    partTimeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEFCBF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 3
    },
    partTimeTagText: { fontSize: 10, fontWeight: '800', color: '#975A16' },

    statsContainer: {
        flexDirection: 'row',
        justify: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 16
    },
    statBox: {
        alignItems: 'center',
        justify: 'center',
        paddingHorizontal: 4
    },
    statLabel: {
        fontSize: 9,
        color: '#64748B',
        fontWeight: '700',
        marginBottom: 4
    },
    statValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 15
    },
    statSubText: {
        fontSize: 10,
        fontWeight: '400',
        color: '#64748B',
        marginTop: 2
    },
    divider: {
        width: 1,
        height: '70%',
        backgroundColor: '#CBD5E1'
    },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    activeTabButton: { borderBottomWidth: 2, borderBottomColor: '#1E64D3' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    activeTabText: { color: '#1E64D3', fontWeight: 'bold' },

    scrollContent: { padding: 16 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 12, marginBottom: 8 },
    aboutDescription: { fontSize: 13, color: '#475569', lineHeight: 20 },

    companyBadgeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 12, padding: 12, marginBottom: 8 },
    policeAlertButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
    badgeTextContainer: { flex: 1, marginLeft: 10 },
    companyBadgeTitle: { color: '#0369A1', fontSize: 13, fontWeight: '700' },
    companyBadgeSubtitle: { color: '#0284C7', fontSize: 11 },
    policeAlertTitle: { color: '#991B1B', fontSize: 13, fontWeight: '700' },
    policeAlertSubtitle: { color: '#B91C1C', fontSize: 11 },

    chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    skillChip: { backgroundColor: '#1E64D3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, marginBottom: 6 },
    skillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
    skillChipSecondary: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, marginBottom: 6 },
    skillTextSecondary: { fontSize: 11, fontWeight: '600', color: '#334155' },
    subCategoryLabel: { fontSize: 12, fontWeight: '700', color: '#1E64D3', marginBottom: 4 },
    emptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginVertical: 8 },

    expContainer: { flexDirection: 'row', marginBottom: 12 },
    timelineCol: { alignItems: 'center', marginRight: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
    activeDot: { backgroundColor: '#1E64D3' },
    line: { flex: 1, width: 2, backgroundColor: '#E2E8F0' },
    expContent: { flex: 1, backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    expTitle: { fontWeight: '700', fontSize: 13, color: '#0F172A' },
    periodText: { fontSize: 10, color: '#64748B' },
    bulletText: { fontSize: 11, color: '#475569', marginTop: 4 },

    procedureCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    procedureStepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    stepNumberBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    stepNumberText: { fontSize: 10, fontWeight: '700', color: '#4338CA' },
    procedureText: { fontSize: 12, color: '#334155', flex: 1 },

    overallRatingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
    bigRatingText: { fontSize: 32, fontWeight: '800', color: '#0F172A' },
    starsRow: { flexDirection: 'row' },
    totalReviewsSubText: { fontSize: 11, color: '#64748B', marginTop: 2 },
    reviewCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    habitsSubtitle: { fontSize: 12.5, color: '#64748B', marginBottom: 14, lineHeight: 18 },
    habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    habitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF4FF',
        borderWidth: 1,
        borderColor: '#D8E6FF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    habitChipText: { fontSize: 12.5, fontWeight: '700', color: '#1E293B', marginLeft: 6 },
    reviewName: { fontWeight: '700', fontSize: 12, color: '#0F172A' },
    reviewDuration: { fontSize: 10, color: '#94A3B8', marginVertical: 2 },
    reviewText: { fontSize: 12, color: '#334155', fontStyle: 'italic' },
    reviewWorkedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    reviewWorkedText: { fontSize: 10, color: '#1E64D3', fontWeight: '600', marginLeft: 4 },
    emptyReviewBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },

    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF8FF',
        padding: 14,
        borderRadius: 10,
        marginBottom: 8,
        gap: 10,
        borderWidth: 1,
        borderColor: '#BEE3F8'
    },
    slotText: { color: '#2B6CB0', fontWeight: '700', fontSize: 14 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    callBtn: { backgroundColor: '#1E64D3', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    disabledBtn: { backgroundColor: '#94A3B8' },
    callBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
});

export default WorkerDetailScreen;