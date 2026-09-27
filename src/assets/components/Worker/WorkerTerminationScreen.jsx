import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE } from '../../config';
import { Alert, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const WorkerTerminationScreen = ({ navigation }) => {
    const [termination, setTermination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    useEffect(() => {
        fetchTerminationStatus();
    }, []);

    const fetchTerminationStatus = async () => {
        try {
            const workerId = await AsyncStorage.getItem('workerId');
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetLatestTermination/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTermination(data);
                // The backend now reports whether this worker already rated the
                // client for this contract, so the star form stays hidden.
                setReviewSubmitted(!!data.workerReviewSubmitted);
            }
        } catch (error) {
            console.error("Error fetching termination status:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please provide a star rating for the client.");
            return;
        }
        
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/SubmitWorkerReviewToClient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    InterviewId: termination?.interviewId,
                    Rating: rating,
                    Comment: reviewComment
                })
            });

            if (response.ok) {
                Alert.alert("Success", "Your review has been submitted successfully!");
                setReviewSubmitted(true);
            } else {
                let msg = "Failed to submit review.";
                try {
                    const errJson = await response.json();
                    if (errJson && errJson.message) msg = errJson.message;
                } catch (e) { /* non-JSON body — keep the default message */ }
                Alert.alert("Review", msg);
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Network connection failed.");
        }
    };

    if (isLoading) {
        return (
            <div className="v" style={sx(styles.loadingContainer)}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </button>
                <span className="t" style={sx(styles.headerTitle)}>Termination Status</span>
                <img className="img" alt="" src={imgSrc({ uri: 'https://servantmaidonline.com/logo.png' })} style={sx(styles.logo)} />
            </div>

            <div className="v scroll" ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                {!termination ? (
                    <div className="v" style={sx(styles.emptyContainer)}>
                        <div className="v" style={sx(styles.iconCircle)}>
                            <Icon name="check-decagram" size={80} color="#4CAF50" />
                        </div>
                        <span className="t" style={sx(styles.emptyTitle)}>Good News!</span>
                        <span className="t" style={sx(styles.emptySubtitle)}>
                            You currently have no recorded terminations. Your professional record is clean.
                        </span>
                        <button className="v btn" type="button"
                            style={sx(styles.goBackBtn)}
                            onClick={press(() => navigation.goBack())}
                        >
                            <span className="t" style={sx(styles.goBackText)}>Return to Dashboard</span>
                        </button>
                    </div>
                ) : (
                    <div className="v">
                        {/* Status Card */}
                        <div className="v" style={sx(styles.statusCard)}>
                            <div className="v" style={sx(styles.statusHeader)}>
                                <div className="v" style={sx(styles.alertIcon)}>
                                    <Icon name="alert-octagon" size={30} color="#E63917" />
                                </div>
                                <div className="v">
                                    <span className="t" style={sx(styles.statusLabel)}>Contract Status</span>
                                    <span className="t" style={sx(styles.statusValue)}>Terminated</span>
                                </div>
                            </div>
                            <div className="v" style={sx(styles.divider)} />
                            <div className="v" style={sx(styles.dateRow)}>
                                <Icon name="calendar-range" size={20} color="#666" />
                                <span className="t" style={sx(styles.dateText)}>
                                    Terminated on: {new Date(termination.terminatedDate).toLocaleDateString('en-US', {
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Reason Section */}
                        <span className="t" style={sx(styles.sectionTitle)}>Reason for Termination</span>
                        <div className="v" style={sx(styles.reasonCard)}>
                            <Icon name="format-quote-open" size={24} color="#1E64D3" />
                            <span className="t" style={sx(styles.reasonText)}>
                                {termination.terminatedReason || "No specific reason provided by the client."}
                            </span>
                            <div className="v" style={sx({ alignSelf: 'flex-end' })}>
                                <Icon name="format-quote-close" size={24} color="#1E64D3" />
                            </div>
                        </div>

                        {/* Employer Info */}
                        <span className="t" style={sx(styles.sectionTitle)}>Employer Details</span>
                        <div className="v" style={sx(styles.employerCard)}>
                            <img className="img" alt=""
                                src={imgSrc({
                                    uri: termination.clientPicture
                                        ? `${SERVER_BASE}${termination.clientPicture}`
                                        : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png'
                                })}
                                style={sx(styles.employerAvatar)}
                            />
                            <div className="v" style={sx(styles.employerInfo)}>
                                <span className="t" style={sx(styles.employerName)}>{termination.clientName}</span>
                                <span className="t" style={sx(styles.employerLabel)}>Client / Employer</span>
                            </div>
                        </div>

                        {/* Feedback / Next Steps */}
                        <div className="v" style={sx(styles.infoBox)}>
                            <Icon name="information-outline" size={22} color="#1E64D3" />
                            <span className="t" style={sx(styles.infoBoxText)}>
                                Termination is a part of professional life. Don't be discouraged!
                                Your profile is now visible for other potential employers.
                            </span>
                        </div>

                        {/* Client Review Section */}
                        {!reviewSubmitted && (
                            <div className="v" style={sx(styles.reviewSection)}>
                                <span className="t" style={sx(styles.sectionTitle)}>Rate Your Client</span>
                                <div className="v" style={sx(styles.starsRow)}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button className="v btn" type="button" key={star} onClick={press(() => setRating(star))}>
                                            <Icon name={star <= rating ? "star" : "star-outline"} size={40} color="#FFD700" style={{ marginRight: 8 }}/>
                                        </button>
                                    ))}
                                </div>
                                <textarea className="input"
                                    style={{ ...sx(styles.reviewInput), '--ph': "#999" }}
                                    placeholder="Share your experience working with this client..."
                                    
                                    
                                    rows={3}
                                    value={(reviewComment) ?? ''}
                                    onChange={changeText(setReviewComment)}
                                />
                                <button className="v btn" type="button" style={sx(styles.submitReviewBtn)} onClick={press(handleSubmitReview)}>
                                    <span className="t" style={sx(styles.submitReviewText)}>Submit Review</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        elevation: 2,
    },
    backBtn: { position: 'absolute', left: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    logo: { width: 35, height: 35, position: 'absolute', right: 20 },

    scrollContent: { padding: 20 },

    // Empty State
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    emptyTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },
    emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    goBackBtn: {
        backgroundColor: '#1E64D3',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 3,
    },
    goBackText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // Active State
    statusCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        marginBottom: 25,
        borderLeftWidth: 8,
        borderLeftColor: '#E63917'
    },
    statusHeader: { flexDirection: 'row', alignItems: 'center' },
    alertIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    statusLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
    statusValue: { fontSize: 24, fontWeight: 'bold', color: '#E63917' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
    dateRow: { flexDirection: 'row', alignItems: 'center' },
    dateText: { marginLeft: 10, color: '#555', fontSize: 15, fontWeight: '500' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
    reasonCard: {
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#BBDEFB'
    },
    reasonText: {
        fontSize: 16,
        color: '#1E64D3',
        lineHeight: 24,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 5,
        fontWeight: '500'
    },

    employerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 20,
        elevation: 2,
        marginBottom: 30
    },
    employerAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#EEE' },
    employerInfo: { marginLeft: 15 },
    employerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
    employerLabel: { fontSize: 14, color: '#999', marginTop: 2 },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 30
    },
    infoBoxText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#666', lineHeight: 20 },

    findJobBtn: {
        backgroundColor: '#1E64D3',
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        marginBottom: 20
    },
    findJobText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    
    reviewSection: { marginBottom: 30, backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 2 },
    starsRow: { flexDirection: 'row', marginTop: 5, marginBottom: 15, justifyContent: 'center' },
    reviewInput: {
        borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 15,
        minHeight: 100, textAlignVertical: 'top', fontSize: 16, backgroundColor: '#F9F9F9',
        marginBottom: 15
    },
    submitReviewBtn: {
        backgroundColor: '#4CAF50', height: 50, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center', elevation: 2
    },
    submitReviewText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default WorkerTerminationScreen;
