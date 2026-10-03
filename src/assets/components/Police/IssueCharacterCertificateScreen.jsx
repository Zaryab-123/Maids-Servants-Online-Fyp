import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_POLICE, SERVER_BASE } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';
import { Dialog, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';

// The verdict the officer records on the certificate.
const CHARACTER_STATUSES = [
  'Clear - No Record',
  'Good Character',
  'Verified - Satisfactory',
];

const IssueCharacterCertificateScreen = ({ route, navigation }) => {
  const workerId = route?.params?.workerId;

  const [worker, setWorker] = useState(null);
  const [existingCert, setExistingCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state (the "detailed" field set)
  const [certificateNo, setCertificateNo] = useState('');
  const [characterStatus, setCharacterStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cnicVerified, setCnicVerified] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadWorker();
  }, [workerId]);

  const loadWorker = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_POLICE}/GetWorkerDetails/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setWorker(data);
        if (data.existingCertificate) {
          setExistingCert(data.existingCertificate);
          // Pre-fill for a renewal so the officer only changes what is needed.
          setCertificateNo(data.existingCertificate.certificateNo || '');
          setCharacterStatus(data.existingCertificate.characterStatus || '');
          setRemarks(data.existingCertificate.remarks || '');
        }
      } else {
        NotificationHelper.showError(data.message || 'Failed to load worker.');
      }
    } catch (error) {
      console.error('Error loading worker:', error);
      NotificationHelper.showError('Failed to load worker profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!characterStatus) {
      NotificationHelper.showError('Please select the character status.');
      return;
    }
    if (!cnicVerified) {
      NotificationHelper.showError("Please confirm you have verified the worker's CNIC.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        workerId: workerId,
        certificateNo: certificateNo.trim(), // blank → server auto-generates
        characterStatus: characterStatus,
        remarks: remarks.trim(),
        verifiedCnic: worker?.cnic || '',
        cnicVerified: cnicVerified,
      };

      const response = await fetch(`${API_POLICE}/IssueCharacterCertificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        NotificationHelper.showSuccess(`${result.message} (valid until ${result.expiryDate})`);
        // Return through the SPA router explicitly; browser-history back can
        // leave the app when this screen was opened from a fresh/deep link.
        navigation.replace('PoliceVerificationPortal');
      } else {
        const errorMsg = result.detail ? `${result.message} (${result.detail})` : (result.message || 'Failed to issue certificate.');
        NotificationHelper.showError(errorMsg);
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
      <div className="v" style={sx(styles.centerContainer)} role="status" aria-label="Loading worker">
        <Spinner size="large" color="#0F766E" />
      </div>
    );
  }

  const avatarUri = worker?.picture
    ? worker.picture.startsWith('http')
      ? worker.picture
      : `${SERVER_BASE}${worker.picture}`
    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  const isRenewal = existingCert && existingCert.isValid;
  const title = isRenewal ? 'Renew Character Certificate' : 'Issue Character Certificate';

  return (
    <main className="v screen" style={sx(styles.container)}>
      {/* Header */}
      <header className="v" style={sx(styles.header)}>
        <button
          className="v btn"
          type="button"
          aria-label="Go back"
          onClick={press(() => navigation.goBack())}
          style={sx(styles.backButton)}
        >
          <Icon name="arrow-left" size={24} color="#1E293B" />
        </button>
        <h1 className="t" style={sx(styles.headerTitle)}>{title}</h1>
        <div className="v" style={sx({ width: 32 })} />
      </header>

      <div className="v scroll">
        <div className="cert-layout" style={sx(styles.scrollContent)}>
          {/* ── Left column: who the certificate is about ── */}
          <aside className="v cert-side">
            <section className="v" style={sx(styles.workerCard)} aria-label="Worker">
              <img className="img" alt={worker?.name || 'Worker'} src={imgSrc({ uri: avatarUri })} style={sx(styles.avatar)} />
              <div className="v" style={sx(styles.workerInfo)}>
                <h2 className="t" style={sx(styles.workerName)}>{worker?.name || 'Worker Profile'}</h2>
                <span className="t" style={sx(styles.workerCnic)}>CNIC: {worker?.cnic || 'N/A'}</span>
              </div>
            </section>

            {existingCert ? (
              <div className="v" style={sx(styles.noticeBox)} role="note">
                <Icon name="information-outline" size={16} color="#0F766E" />
                <p className="t" style={sx(styles.noticeText)}>
                  {existingCert.isValid
                    ? `A valid certificate exists (until ${existingCert.expiryDate}). Submitting will renew it for another 5 years.`
                    : `The previous certificate expired on ${existingCert.expiryDate}. Submitting will issue a fresh 5-year certificate.`}
                </p>
              </div>
            ) : null}

            <div className="v" style={sx(styles.validityNote)}>
              <Icon name="calendar-check" size={16} color="#475569" />
              <span className="t" style={sx(styles.validityText)}>This certificate will be valid for 5 years from today.</span>
            </div>
          </aside>

          {/* ── Right column: the form ── */}
          <form
            className="v cert-form"
            style={sx(styles.formCard)}
            onSubmit={(e) => { e.preventDefault(); if (!submitting) handleSubmit(); }}
            noValidate
          >
            <label className="t" htmlFor="cert-no" style={sx(styles.label)}>Certificate Reference No.</label>
            <div className="v" style={sx(styles.inputContainer)}>
              <Icon name="pound" size={20} color="#64748B" style={styles.inputIcon} />
              <input
                id="cert-no"
                className="input"
                style={{ ...sx(styles.textInput), '--ph': '#94A3B8' }}
                placeholder="Leave blank to auto-generate"
                value={certificateNo ?? ''}
                onChange={changeText(setCertificateNo)}
                maxLength={50}
                autoComplete="off"
              />
            </div>

            <span className="t" id="status-label" style={sx(styles.label)}>Character Status *</span>
            <button
              className="v btn"
              type="button"
              aria-labelledby="status-label"
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
              style={sx(styles.inputContainer)}
              onClick={press(() => setShowDropdown(true))}
            >
              <Icon name="shield-check-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <span className="t" style={sx([styles.textInput, styles.selectText, !characterStatus && { color: '#94A3B8' }])}>
                {characterStatus || 'Select character status'}
              </span>
              <Icon name="chevron-down" size={22} color="#64748B" />
            </button>

            <label className="t" htmlFor="cert-remarks" style={sx(styles.label)}>Remarks / Verification Detail</label>
            <div className="v" style={sx(styles.textAreaContainer)}>
              <textarea
                id="cert-remarks"
                className="input"
                style={{ ...sx(styles.textAreaInput), '--ph': '#94A3B8' }}
                placeholder="Enter background verification detail, references checked, station notes..."
                rows={5}
                value={remarks ?? ''}
                onChange={changeText(setRemarks)}
              />
            </div>

            {/* CNIC re-verification confirmation */}
            <button
              className="v btn"
              type="button"
              role="checkbox"
              aria-checked={cnicVerified}
              style={sx(styles.checkboxRow)}
              onClick={press(() => setCnicVerified(!cnicVerified))}
            >
              <Icon
                name={cnicVerified ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={cnicVerified ? '#0F766E' : '#94A3B8'}
              />
              <span className="t" style={sx(styles.checkboxText)}>
                I confirm I have physically re-verified this worker's CNIC ({worker?.cnic || 'N/A'}).
              </span>
            </button>

            {/* Submit */}
            <button className="v btn" type="submit" style={sx([styles.submitButton, submitting && { opacity: 0.8 }])} disabled={submitting}>
              {submitting ? (
                <Spinner color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="certificate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <span className="t" style={sx(styles.submitButtonText)}>
                    {isRenewal ? 'Renew Certificate (5 yrs)' : 'Issue Certificate (5 yrs)'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Character status dropdown */}
      <Dialog visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <div
          className="v"
          style={sx(styles.modalOverlay)}
          onClick={press(() => setShowDropdown(false))}
        >
          <div
            className="v"
            style={sx(styles.modalContent)}
            role="listbox"
            aria-label="Select Character Status"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="t" style={sx(styles.modalTitle)}>Select Character Status</h3>
            {CHARACTER_STATUSES.map((item, index) => (
              <button
                className="v btn"
                type="button"
                role="option"
                aria-selected={characterStatus === item}
                key={index}
                style={sx([styles.modalItem, characterStatus === item && styles.modalItemActive])}
                onClick={press(() => {
                  setCharacterStatus(item);
                  setShowDropdown(false);
                })}
              >
                <span className="t" style={sx(styles.modalItemText)}>{item}</span>
                {characterStatus === item ? <Icon name="check" size={18} color="#0F766E" /> : null}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </main>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 320 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', margin: 0 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16, objectFit: 'cover' },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', margin: 0 },
  workerCnic: { fontSize: 13, color: '#64748B', marginTop: 3 },

  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, color: '#0F766E', lineHeight: 17, margin: 0 },

  formCard: { display: 'flex', flexDirection: 'column' },

  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, color: '#1E293B' },
  selectText: { textAlign: 'left' },

  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textAreaInput: { fontSize: 14, color: '#1E293B', minHeight: 100, resize: 'vertical' },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    textAlign: 'left',
  },
  checkboxText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18 },

  validityNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, marginLeft: 4, marginRight: 4 },
  validityText: { flex: 1, minWidth: 0, fontSize: 12, color: '#475569', fontWeight: '600', lineHeight: 17 },

  submitButton: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    width: '100%',
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    minHeight: '100vh',
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 420 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 15, marginTop: 0 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
    textAlign: 'left',
  },
  modalItemActive: { backgroundColor: '#F0FDFA' },
  modalItemText: { fontSize: 14, color: '#334155' },
});

export default IssueCharacterCertificateScreen;
