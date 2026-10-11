import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';
import CriteriaReviewSection from '../helpers/CriteriaReviewSection';
import { Alert, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const TerminateContractScreen = ({ navigation, route }) => {
    const { workerId, interviewId } = route.params;

    const [reason, setReason] = useState('');
    const [remarks, setRemarks] = useState('');
    // Per-criterion scores: { [criteriaId]: score(1-5) } — the overall rating is
    // computed on the server from these, so there is no single star input any more.
    const [scores, setScores] = useState({});
    const [requiredTotal, setRequiredTotal] = useState(null); // null = loading, -1 = failed, 0 = none configured
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [worker, setWorker] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleScoreChange = (criteriaId, score) =>
        setScores((prev) => ({ ...prev, [criteriaId]: score }));

    const ratedCount = Object.values(scores).filter((v) => v > 0).length;

    useEffect(() => {
        fetchWorkerDetails();
    }, []);

    const fetchWorkerDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetWorkerDetail/${workerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setWorker(data);
            } else {
                NotificationHelper.showError("Failed to load worker details");
            }
        } catch (error) {
            console.error("Error fetching worker:", error);
            NotificationHelper.showError("Network error loading worker");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTerminate = async () => {
        if (!reason.trim()) {
            NotificationHelper.showError("Please enter a termination reason");
            return;
        }
        if (requiredTotal === null) {
            NotificationHelper.showError("Review criteria are still loading. Please wait a moment.");
            return;
        }
        if (requiredTotal < 0) {
            NotificationHelper.showError("Could not load the review criteria. Check your connection and reopen this screen.");
            return;
        }
        if (requiredTotal === 0) {
            NotificationHelper.showError("No review criteria are set up on the server yet. Please contact the administrator.");
            return;
        }
        if (ratedCount < requiredTotal) {
            NotificationHelper.showError(`Please rate every criterion (${ratedCount}/${requiredTotal} rated).`);
            return;
        }
        if (!isConfirmed) {
            NotificationHelper.showError("Please confirm termination by checking the box");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = {
                InterviewId: interviewId,
                Reason: reason,
                Remarks: remarks,
                CriteriaScores: Object.entries(scores).map(([criteriaId, score]) => ({
                    CriteriaId: Number(criteriaId),
                    Score: score
                }))
            };

            const response = await fetch(`${SERVER_BASE}/api/Dashboard/TerminateContract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                NotificationHelper.showSuccess("Contract terminated successfully");
                navigation.navigate('UserDashboardScreen', { refresh: true });
            } else {
                const errorData = await response.json();
                NotificationHelper.showError(errorData.message || "Termination failed");
            }
        } catch (error) {
            console.error("Termination error:", error);
            NotificationHelper.showError("Network error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="v" style={sx(styles.loadingContainer)}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    if (!worker) return null;

    return (
        <div className="v screen" style={sx(styles.container)}>
            
            <div className="v" style={sx(styles.bgDecoration)} />

            <div className="v scroll" ><div className="v scroll-content" style={sx(styles.scrollContent)}>
                <div className="v" style={sx(styles.header)}>
                    <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
                        <Icon name="arrow-left" size={24} color="#666" />
                    </button>
                    <span className="t" style={sx(styles.headerTitle)}>Terminate Contract</span>
                    <img className="img" alt="" src={imgSrc({ uri: 'https://servantmaidonline.com/logo.png' })} style={sx(styles.logo)} />
                </div>

                <div className="v" style={sx(styles.profileCard)}>
                    <img className="img" alt=""
                        src={imgSrc({ 
                            uri: worker.picture 
                                ? `${SERVER_BASE}${worker.picture}` 
                                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' 
                        })}
                        style={sx(styles.avatar)}
                    />
                    <div className="v" style={sx(styles.nameCol)}>
                        <span className="t" style={sx(styles.workerName)}>{worker.name}</span>
                        <span className="t" style={sx(styles.workerRole)}>{worker.categoryName || 'Hired Worker'}</span>
                    </div>
                </div>

                <div className="v" style={sx(styles.inputGroup)}>
                    <span className="t" style={sx(styles.label)}>Termination Reason</span>
                    <textarea className="input"
                        style={{ ...sx(styles.inputField), '--ph': "#999" }}
                        placeholder="Why are you ending this contract?"
                        
                        value={(reason) ?? ''}
                        onChange={changeText(setReason)}
                        
                    />
                </div>

                <div className="v" style={sx(styles.remarksCard)}>
                    <CriteriaReviewSection
                        interviewId={interviewId}
                        scores={scores}
                        onScoreChange={handleScoreChange}
                        onLoaded={setRequiredTotal}
                    />
                    <textarea className="input"
                        style={{ ...sx([styles.inputField, { height: 80, marginTop: 15 }]), '--ph': "#999" }}
                        placeholder="Add additional remarks/feedback"
                        
                        value={(remarks) ?? ''}
                        onChange={changeText(setRemarks)}
                        
                    />
                </div>

                <button className="v btn" type="button"
                    style={sx(styles.checkboxContainer)}
                    onClick={press(() => setIsConfirmed(!isConfirmed))}
                    
                >
                    <Icon
                        name={isConfirmed ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={26}
                        color={isConfirmed ? "#1E64D3" : "#666"}
                    />
                    <span className="t" style={sx(styles.checkboxLabel)}>
                        I confirm that I want to terminate this contract and have cleared all dues as per the agreement.
                    </span>
                </button>

                <button className="v btn" type="button" 
                    style={sx([styles.terminateBtn, (!isConfirmed || isSubmitting) && styles.disabledBtn])} 
                    onClick={press(handleTerminate)}
                    disabled={!isConfirmed || isSubmitting}
                >
                    {isSubmitting ? (
                        <Spinner color="#FFF" />
                    ) : (
                        <span className="t" style={sx(styles.terminateBtnText)}>Confirm Termination</span>
                    )}
                </button>

                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.cancelBtn)}>
                    <span className="t" style={sx(styles.cancelText)}>Cancel</span>
                </button>
            </div></div>
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    scrollContent: { padding: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        position: 'relative'
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
    logo: { width: 40, height: 40, position: 'absolute', right: 0 },

    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#1E64D3' },
    nameCol: { marginLeft: 15 },
    workerName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    workerRole: { fontSize: 16, color: '#666', marginTop: 2 },

    inputGroup: { marginBottom: 25 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    inputField: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 15,
        padding: 15,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#F9F9F9',
        textAlignVertical: 'top',
        marginTop: 10
    },

    remarksCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 30,
        elevation: 2,
    },
    starRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },

    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 35, paddingHorizontal: 5 },
    checkboxLabel: { fontSize: 13, color: '#555', marginLeft: 12, flex: 1, lineHeight: 18 },

    terminateBtn: {
        backgroundColor: '#E63917',
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#E63917',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledBtn: { backgroundColor: '#FFA4A4' },
    terminateBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    cancelBtn: { marginTop: 20, paddingVertical: 10, alignItems: 'center' },
    cancelText: { fontSize: 16, fontWeight: '600', color: '#666' }
});

export default TerminateContractScreen;
