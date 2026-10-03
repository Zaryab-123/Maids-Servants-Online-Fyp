import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DIRECTORY } from '../../config';
import { Platform, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


// Extract base server URL (e.g., "http://10.0.2.2:5000") by stripping "/api/CompanyDirectory" or similar API suffixes
const SERVER_BASE = API_DIRECTORY ? API_DIRECTORY.split('/api')[0] : 'http://10.0.2.2:5000';

const WorkerDetailsVerificationScreen = ({ route, navigation }) => {
  const { workerId } = route.params || {};

  const [worker, setWorker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [certificateTitle, setCertificateTitle] = useState('');
  const [trainingNotes, setTrainingNotes] = useState('');

  // Helper to format relative picture URIs into complete HTTP URLs
  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/worker_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  useEffect(() => {
    if (workerId) {
      fetchWorkerDetails();
    }
  }, [workerId]);

  const fetchWorkerDetails = async () => {
    try {
      setIsLoading(true);
      // Compatible with both route params (/GetWorkerDetails/1) and query params (?workerId=1)
      const authToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_DIRECTORY}/GetWorkerDetails/${workerId}`, {
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      });
      const data = await response.json();

      if (response.ok) {
        setWorker(data);
      } else {
        NotificationHelper.showError(data.message || "Could not load worker details.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Server network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!certificateTitle.trim()) {
      NotificationHelper.showError("Please enter a certificate title.");
      return;
    }

    try {
      setIsSubmitting(true);

      let companyIdRaw = await AsyncStorage.getItem('companyId') || await AsyncStorage.getItem('userId');

      if (!companyIdRaw) {
        const userObjStr = await AsyncStorage.getItem('user');
        if (userObjStr) {
          const parsedUser = JSON.parse(userObjStr);
          companyIdRaw = parsedUser?.companyID || parsedUser?.companyId || parsedUser?.userId || parsedUser?.id;
        }
      }

      const companyId = parseInt(companyIdRaw, 10);

      if (!companyId || isNaN(companyId)) {
        NotificationHelper.showError("Session expired: Please log out and log in again.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        workerId: parseInt(workerId, 10),
        companyId: companyId,
        certificateTitle: certificateTitle.trim(),
        trainingEvaluationNotes: trainingNotes.trim()
      };

      const authToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_DIRECTORY}/IssueCertificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let data = {};
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = { message: rawText.slice(0, 180) }; }
      if (response.status === 401 || response.status === 403) data.message = data.message || 'Your company session has expired. Please log in again.';

      if (response.ok) {
        NotificationHelper.showSuccess(data.message || "Certificate issued successfully!");
        navigation.goBack();
      } else {
        NotificationHelper.showError(data.message || "Failed to issue certificate.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Network error issuing certificate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="v screen" style={sx([styles.container, styles.centered])}>
        <Spinner size="large" color="#026597" />
      </div>
    );
  }

  // Construct valid avatar HTTP URL using the helper
  const avatarUri = getImageUri(worker?.picture);

  return (
    <div className="v screen" style={sx(styles.container)}>
      

      {/* Navigation Header */}
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" style={sx(styles.backButton)} onClick={press(() => navigation.goBack())}>
          <Icon name="chevron-left" size={32} color="#1A1C1E" />
        </button>
        <span className="t" style={sx(styles.headerTitle)}>Worker Details & Certification</span>
        <div className="v" style={sx({ width: 32 })} />
      </div>

      <div className="v"
        
        style={sx({ flex: 1 })}
      >
        <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
          {/* Top Profile Summary Card */}
          <div className="v" style={sx(styles.profileCard)}>
            <div className="v" style={sx(styles.avatarWrapper)}>
              <img className="img" alt="" 
                src={imgSrc({ uri: avatarUri })} 
                style={sx(styles.avatar)} 
              />
              <div className="v" style={sx(styles.verifiedBadge)}>
                <Icon name="check-decagram" size={22} color="#026597" />
              </div>
            </div>

            <span className="t" style={sx(styles.workerName)}>{worker?.name}</span>
            <span className="t" style={sx(styles.workerTitle)}>{worker?.roleTitle}</span>

            <div className="v" style={sx(styles.divider)} />

            {/* Info Table Rows */}
            <div className="v" style={sx(styles.infoRow)}>
              <span className="t" style={sx(styles.infoLabel)}>CNIC</span>
              <span className="t" style={sx(styles.infoValue)}>{worker?.cnic}</span>
            </div>

            <div className="v" style={sx(styles.infoRow)}>
              <span className="t" style={sx(styles.infoLabel)}>Phone</span>
              <span className="t" style={sx(styles.infoValue)}>{worker?.phone}</span>
            </div>

            <div className="v" style={sx(styles.infoRow)}>
              <span className="t" style={sx(styles.infoLabel)}>Address</span>
              <span className="t" style={sx(styles.infoValue, 2)} >
                {worker?.address}
              </span>
            </div>
          </div>

          {/* Form Section */}
          <span className="t" style={sx(styles.sectionLabel)}>CERTIFICATE TITLE</span>
          <div className="v" style={sx(styles.inputContainer)}>
            <Icon name="ribbon" size={20} color="#666" style={styles.inputIcon} />
            <input className="input"
              style={{ ...sx(styles.textInput), '--ph': "#999" }}
              placeholder="e.g., Advanced Cleaning Certification"
              
              value={(certificateTitle) ?? ''}
              onChange={changeText(setCertificateTitle)}
            />
          </div>

          <span className="t" style={sx(styles.sectionLabel)}>TRAINING DETAILS</span>
          <div className="v" style={sx([styles.inputContainer, styles.textAreaContainer])}>
            <textarea className="input"
              style={{ ...sx([styles.textInput, styles.textArea]), '--ph': "#999" }}
              placeholder="Type training assessment and evaluation notes here..."
              
              
              rows={4}
              
              value={(trainingNotes) ?? ''}
              onChange={changeText(setTrainingNotes)}
            />
          </div>

          {/* Action Button */}
          <button className="v btn" type="button"
            style={sx([styles.submitButton, isSubmitting && styles.disabledButton])}
            onClick={press(handleIssueCertificate)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner color="#FFF" />
            ) : (
              <div className="v" style={sx(styles.buttonContent)}>
                <Icon name="send-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <span className="t" style={sx(styles.submitButtonText)}>Issue & Publish Certificate</span>
              </div>
            )}
          </button>
        </div></div>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF'
  },
  backButton: { padding: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1E' },
  scrollContent: { padding: 20 },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#E0E0E0' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 1
  },
  workerName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E', marginBottom: 2 },
  workerTitle: { fontSize: 12, fontWeight: '700', color: '#026597', letterSpacing: 0.6, marginBottom: 12 },
  divider: { width: '100%', height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginVertical: 6
  },
  infoLabel: { fontSize: 13, color: '#888', width: 75, fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1A1C1E', textAlign: 'right' },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, height: 50, fontSize: 14, color: '#333' },
  textAreaContainer: { alignItems: 'flex-start', paddingVertical: 12 },
  textArea: { height: 110, width: '100%' },

  submitButton: {
    backgroundColor: '#026597',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    elevation: 3,
    shadowColor: '#026597',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  disabledButton: { opacity: 0.7 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  submitButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});

export default WorkerDetailsVerificationScreen;