import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';

import DateTimePicker from '@/web/DateTimePicker';
import { confirmAction } from '../helpers/courseApi';

// Local calendar date as YYYY-MM-DD (toISOString() would shift it back a day in UTC+5).
const toLocalYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
import { Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const LeaveJobScreen = ({ navigation }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [jobData, setJobData] = useState(null);
    const [lastWorkingDay, setLastWorkingDay] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');

    useEffect(() => {
        fetchActiveJob();
    }, []);

    const fetchActiveJob = async () => {
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            if (!workerId) {
                NotificationHelper.showError("Worker identity not found. Please re-login.");
                navigation.goBack();
                return;
            }

            const response = await fetch(`${API_DASHBOARD}/GetActiveJob/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setJobData(data);
            } else {
                const errData = await response.json().catch(() => ({}));
                NotificationHelper.showError(errData.message || "No active job found to resign from.");
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Connection error. Check API configuration.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResign = async () => {
        if (!reason.trim()) {
            NotificationHelper.showError("Please provide a reason for resignation.");
            return;
        }

        if (rating === 0) {
            NotificationHelper.showError("Please provide a rating for the client.");
            return;
        }

        if (!jobData || !jobData.interviewId) {
            NotificationHelper.showError("Process error: Job data missing.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');

            const payload = {
                InterviewId: jobData.interviewId,
                ResignationReason: reason,
                LastWorkingDate: toLocalYMD(lastWorkingDay)
            };

            console.log("Submitting Resignation:", payload);

            const response = await fetch(`${API_DASHBOARD}/SubmitResignation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                let reviewSaved = true;
                try {
                    const reviewRes = await fetch(`${API_DASHBOARD}/SubmitWorkerReviewToClient`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            InterviewId: jobData.interviewId,
                            Rating: rating,
                            Comment: reviewComment
                        })
                    });
                    if (!reviewRes.ok) reviewSaved = false;
                } catch (e) {
                    reviewSaved = false;
                    console.error("Review error", e);
                }

                if (reviewSaved) {
                    NotificationHelper.showSuccess("Resignation submitted successfully.");
                } else {
                    NotificationHelper.showError("Your resignation was submitted, but your rating could not be saved.");
                }
                navigation.navigate('WorkerDashboardScreen');
            } else {
                let errorMsg = "Failed to submit resignation.";
                try {
                    // Read body ONCE as text, then parse in-memory to avoid "Already read" error
                    const rawText = await response.text();
                    console.log("Server Error Response:", rawText);
                    const errJson = JSON.parse(rawText);
                    errorMsg = errJson.message || errorMsg;
                } catch (e) {
                    // Body was empty or not JSON — use default message
                    console.log("Could not parse error response:", e.message);
                }
                NotificationHelper.showError(errorMsg);
            }
        } catch (error) {
            console.error(error);
            NotificationHelper.showError("Network error. Please try again.");
        }
    };

    if (isLoading) {
        return (
            <div className="v" style={sx(styles.centerContainer)}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    return (
        <div className="v screen" style={sx(styles.container)}>
            
            <div className="v" style={sx(styles.bgDecoration)} />

            <div className="v scroll" ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                <div className="v" style={sx(styles.header)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Resign from Job</span>
                    <img className="img" alt="" src={imgSrc({ uri: 'https://servantmaidonline.com/logo.png' })} style={sx(styles.logo)} />
                </div>

                {jobData && (
                    <div className="v" style={sx(styles.jobCard)}>
                        <div className="v" style={sx(styles.jobInfo)}>
                            <span className="t" style={sx(styles.employerName)}>{jobData.employerName}</span>
                            <span className="t" style={sx(styles.employerAddress)}>{jobData.employerAddress}</span>
                        </div>
                        <div className="v" style={sx(styles.noticeBadge)}>
                            <span className="t" style={sx(styles.noticeText)}>Standard 1-Week Notice</span>
                        </div>
                    </div>
                )}

                <div className="v" style={sx(styles.inputGroup)}>
                    <span className="t" style={sx(styles.inputLabel)}>Proposed Last Working Day</span>
                    <button className="v btn" type="button"
                        style={sx(styles.dateDisplay)}
                        onClick={press(() => setShowDatePicker(true))}
                        
                    >
                        <span className="t" style={sx(styles.dateText)}>{lastWorkingDay.toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        })}</span>
                        <Icon name="calendar-clock" size={24} color="#1E64D3" />
                    </button>
                </div>

                {showDatePicker && (
                    <DateTimePicker
                        value={lastWorkingDay}
                        mode="date"
                        display="default"
                        minimumDate={new Date()} // Cannot resign in the past
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setLastWorkingDay(selectedDate);
                        }}
                    />
                )}

                <div className="v" style={sx(styles.inputGroup)}>
                    <span className="t" style={sx(styles.inputLabel)}>Reason for Leaving</span>
                    <textarea className="input"
                        style={{ ...sx(styles.reasonInput), '--ph': "#999" }}
                        placeholder="Please explain why you are leaving..."
                        
                        
                        rows={3}
                        value={(reason) ?? ''}
                        onChange={changeText(setReason)}
                    />
                </div>

                <div className="v" style={sx(styles.inputGroup)}>
                    <span className="t" style={sx(styles.inputLabel)}>Client Rating</span>
                    <div className="v" style={sx({ flexDirection: 'row', marginTop: 5, marginBottom: 10 })}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button className="v btn" type="button" key={star} onClick={press(() => setRating(star))}>
                                <Icon name={star <= rating ? "star" : "star-outline"} size={40} color="#FFD700" style={{ marginRight: 8 }} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="v" style={sx(styles.inputGroup)}>
                    <span className="t" style={sx(styles.inputLabel)}>Client Feedback</span>
                    <textarea className="input"
                        style={{ ...sx(styles.reasonInput), '--ph': "#999" }}
                        placeholder="Share your experience working with this client..."
                        
                        
                        rows={3}
                        value={(reviewComment) ?? ''}
                        onChange={changeText(setReviewComment)}
                    />
                </div>

                <button className="v btn" type="button" style={sx(styles.submitBtn)} onClick={press(() => confirmAction('Submit resignation?', 'Your resignation notice will be sent to the client. This cannot be undone.', 'Submit', handleResign))}>
                    <span className="t" style={sx(styles.submitBtnText)}>Submit Resignation Notice</span>
                </button>

                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.cancelBtn)}>
                    <span className="t" style={sx(styles.cancelBtnText)}>Keep Current Job</span>
                </button>
            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bgDecoration: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E3F2FD',
        zIndex: -1,
    },
    scrollContent: { padding: 25 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    backBtn: { padding: 5 },
    logo: { width: 40, height: 40 },

    jobCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    employerName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    employerAddress: { fontSize: 14, color: '#666', marginTop: 4 },
    noticeBadge: {
        backgroundColor: '#E3F2FD',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginTop: 15
    },
    noticeText: { color: '#1E64D3', fontSize: 12, fontWeight: 'bold' },

    inputGroup: { marginBottom: 25 },
    inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
    dateDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
        backgroundColor: '#F9F9F9'
    },
    dateText: { fontSize: 16, color: '#333' },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        padding: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 16,
        backgroundColor: '#F9F9F9'
    },

    submitBtn: {
        backgroundColor: '#E91E63',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 2
    },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cancelBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    cancelBtnText: { color: '#666', fontSize: 16, fontWeight: '500' }
});

export default LeaveJobScreen;