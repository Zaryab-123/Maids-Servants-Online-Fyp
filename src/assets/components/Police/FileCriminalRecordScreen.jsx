import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import DateTimePicker from '@/web/DateTimePicker';
import { API_POLICE, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';
import { Dialog, Platform, Spinner, StyleSheet, Toggle, changeText, imgSrc, press, sx, tin } from '@/web';


const CRIME_TYPES = [
  'Theft / Burglary',
  'Physical Assault',
  'Fraud / Misrepresentation',
  'Property Damage',
  'Substance Abuse',
  'Other Violation',
];

const FileCriminalRecordScreen = ({ route, navigation }) => {
  const workerId = route?.params?.workerId || 1;

  const [policeId, setPoliceId] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [firNumber, setFirNumber] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [dateOfOffense, setDateOfOffense] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flagOnly, setFlagOnly] = useState(true);
  const [details, setDetails] = useState('');

  // Dropdown Modal State
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadSessionAndWorker();
  }, [workerId]);

  const loadSessionAndWorker = async () => {
    try {
      const storedPoliceId = await AsyncStorage.getItem('policeId');
      if (storedPoliceId) {
        setPoliceId(parseInt(storedPoliceId, 10));
      }

      const response = await fetch(`${API_POLICE}/GetWorkerDetails/${workerId}`);
      const data = await response.json();
      if (response.ok) {
        setWorker(data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      NotificationHelper.showError('Failed to load worker profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlagOnly = (value) => {
    setFlagOnly(value);
    if (value) {
      setFirNumber('');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfOffense(selectedDate);
    }
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!flagOnly && !firNumber.trim()) {
      NotificationHelper.showError('FIR Number / Case ID is required when filing an official FIR.');
      return;
    }

    if (!crimeType || !details.trim()) {
      NotificationHelper.showError('Please complete all required crime report details.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        workerId: workerId,
        policeId: policeId || 0,
        firNumber: flagOnly ? null : firNumber.trim(),
        offenseCategory: crimeType,
        offenseDate: formatDateString(dateOfOffense),
        isFlagged: true,
        isBlocked: !flagOnly,
        caseDetails: details.trim(),
      };

      const response = await fetch(`${SERVER_BASE}/api/Police/FileCriminalRecord`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = flagOnly 
          ? 'Warning issued and worker profile flagged successfully.' 
          : 'Official FIR filed successfully.';

        NotificationHelper.showSuccess(successMessage, () => {
          navigation.goBack();
        });
      } else {
        const errorMessage = result.error 
          ? `${result.message} - ${result.error}` 
          : (result.message || 'Failed to submit report.');
        NotificationHelper.showError(errorMessage);
      }
    } catch (error) {
      console.error('Submission error:', error);
      NotificationHelper.showError('Server network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="v" style={sx(styles.centerContainer)}>
        <Spinner size="large" color="#1E293B" />
      </div>
    );
  }

  const avatarUri = worker?.picture
    ? worker.picture.startsWith('http')
      ? worker.picture
      : `${SERVER_BASE}${worker.picture}`
    : 'https://via.placeholder.com/150';

  return (
    <div className="v screen" style={sx(styles.container)}>
      {/* Header */}
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backButton)}>
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </button>
        <span className="t" style={sx(styles.headerTitle)}>File Criminal Record</span>
        <div className="v" style={sx({ width: 32 })} />
      </div>

      <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
        {/* Worker Summary Card */}
        <div className="v" style={sx(styles.workerCard)}>
          <div className="v" style={sx(styles.avatarWrapper)}>
            <img className="img" alt="" src={imgSrc({ uri: avatarUri })} style={sx(styles.avatar)} />
            <div className="v" style={sx(styles.verifiedBadge)}>
              <Icon name="check-decagram" size={16} color="#0284C7" />
            </div>
          </div>
          <div className="v" style={sx(styles.workerInfo)}>
            <span className="t" style={sx(styles.workerName)}>{worker?.name || 'Worker Profile'}</span>
            <span className="t" style={sx(styles.workerCnic)}>CNIC: {worker?.cnic || 'N/A'}</span>
          </div>
        </div>

        {/* Input: FIR Number */}
        <div className="v" style={sx([styles.inputContainer, flagOnly && styles.disabledInput])}>
          <Icon 
            name="badge-account-outline" 
            size={20} 
            color={flagOnly ? '#94A3B8' : '#64748B'} 
            style={styles.inputIcon} 
          />
          <input className="input" {...tin({ editable: !flagOnly })}
            style={{ ...sx([styles.textInput, flagOnly && styles.disabledTextInput]), '--ph': "#94A3B8" }}
            placeholder={flagOnly ? 'FIR Number (Disabled for Warning)' : 'FIR Number / Case ID *'}
            
            value={(firNumber) ?? ''}
            onChange={changeText(setFirNumber)}
            
          />
        </div>

        {/* Dropdown: Select Crime Type */}
        <button className="v btn" type="button"
          style={sx(styles.inputContainer)}
          onClick={press(() => setShowDropdown(true))}
          
        >
          <span className="t" style={sx([styles.textInput, !crimeType && { color: '#94A3B8' }])}>
            {crimeType || 'Select Crime Type *'}
          </span>
          <Icon name="chevron-down" size={22} color="#64748B" />
        </button>

        {/* Calendar Field: Date of Offense */}
        <button className="v btn" type="button"
          style={sx(styles.inputContainer)}
          onClick={press(() => setShowDatePicker(true))}
          
        >
          <Icon name="calendar-month-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <span className="t" style={sx(styles.textInput)}>
            {formatDateString(dateOfOffense)}
          </span>
          <Icon name="calendar" size={20} color="#0284C7" />
        </button>

        {/* DateTimePicker Component */}
        {showDatePicker && (
          <DateTimePicker
            value={dateOfOffense}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {/* System Security Action Toggle */}
        <div className="v" style={sx(styles.toggleCard)}>
          <div className="v" style={sx(styles.toggleTextContainer)}>
            <span className="t" style={sx(styles.toggleHeader)}>SYSTEM SECURITY ACTION</span>
            <span className="t" style={sx(styles.toggleSubtext)}>
              {flagOnly ? 'Flag Only (Warning Badge Only)' : 'Official FIR (Flag Profile)'}
            </span>
          </div>
          <Toggle
            value={flagOnly}
            onValueChange={handleToggleFlagOnly}
            trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
            thumbColor={flagOnly ? '#0284C7' : '#F1F5F9'}
          />
        </div>

        {/* Text Area: Details */}
        <div className="v" style={sx(styles.textAreaContainer)}>
          <textarea className="input"
            style={{ ...sx(styles.textAreaInput), '--ph': "#94A3B8" }}
            placeholder="Type detailed crime report and official legal investigation specifics here... *"
            
            
            rows={5}
            
            value={(details) ?? ''}
            onChange={changeText(setDetails)}
          />
        </div>

        {/* Submit Button */}
        <button className="v btn" type="button"
          style={sx([styles.submitButton, !flagOnly && styles.firSubmitButton])}
          onClick={press(handleSubmit)}
          disabled={submitting}
        >
          {submitting ? (
            <Spinner color="#FFFFFF" />
          ) : (
            <>
              <div className="v" style={sx(styles.alertCircle)}>
                <Icon name="alert" size={16} color={flagOnly ? '#D97706' : '#B91C1C'} />
              </div>
              <span className="t" style={sx(styles.submitButtonText)}>
                {flagOnly ? 'Issue Warning & Flag Profile' : 'Submit Official FIR'}
              </span>
            </>
          )}
        </button>
      </div></div>

      {/* Crime Type Dropdown Modal */}
      <Dialog visible={showDropdown} transparent animationType="fade">
        <button className="v btn" type="button"
          style={sx(styles.modalOverlay)}
          
          onClick={press(() => setShowDropdown(false))}
        >
          <div className="v" style={sx(styles.modalContent)}>
            <span className="t" style={sx(styles.modalTitle)}>Select Crime Type</span>
            {CRIME_TYPES.map((item, index) => (
              <button className="v btn" type="button"
                key={index}
                style={sx(styles.modalItem)}
                onClick={press(() => {
                  setCrimeType(item);
                  setShowDropdown(false);
                })}
              >
                <span className="t" style={sx(styles.modalItemText)}>{item}</span>
              </button>
            ))}
          </div>
        </button>
      </Dialog>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatarWrapper: { position: 'relative', marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  workerCnic: { fontSize: 13, color: '#64748B', marginTop: 3 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  disabledInput: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  disabledTextInput: { color: '#64748B' },

  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  toggleTextContainer: { flex: 1, paddingRight: 10 },
  toggleHeader: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  toggleSubtext: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginTop: 4 },

  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  textAreaInput: { fontSize: 14, color: '#1E293B' },

  submitButton: {
    backgroundColor: '#D97706',
    borderRadius: 25,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  firSubmitButton: {
    backgroundColor: '#B91C1C',
    shadowColor: '#B91C1C',
  },
  alertCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 14, color: '#334155' },
});

export default FileCriminalRecordScreen;