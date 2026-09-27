import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import { API_DIRECTORY, SERVER_BASE } from '../../config';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';


const WorkerCertificateDetail = ({ navigation, route }) => {
  const { workerId } = route.params || {};
  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [workerId]);

  const fetchCertificate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_DIRECTORY}/GetWorkerCertificateDetail/${workerId}`
      );
      const data = await response.json();

      if (response.ok) {
        setCertData(data);
      } else {
        setCertData(null);
      }
    } catch (error) {
      console.error('Certificate fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/worker_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  if (isLoading) {
    return (
      <div className="v screen" style={sx([styles.container, styles.centered])}>
        <Spinner size="large" color="#0088CC" />
      </div>
    );
  }

  if (!certData) {
    return (
      <div className="v screen" style={sx([styles.container, styles.centered])}>
        <Icon name="certificate-outline" size={60} color="#CCC" />
        <span className="t" style={sx(styles.errorText)}>No Certificate Record Found</span>
        <button className="v btn" type="button"
          style={sx(styles.backBtnSimple)}
          onClick={press(() => navigation.goBack())}
        >
          <span className="t" style={sx(styles.backBtnText)}>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="v screen" style={sx(styles.container)}>
      

      {/* Navigation Header */}
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button"
          onClick={press(() => navigation.goBack())}
          style={sx(styles.iconButton)}
          
        >
          <Icon name="chevron-left" size={28} color="#1A1C1E" />
        </button>
        <span className="t" style={sx(styles.headerTitle)}>Verified Training Certificate</span>
        <div className="v" style={sx({ width: 28 })} />
      </div>

      <div className="v scroll"
        
        
      ><div className="v scroll-content" style={sx(styles.scrollContent)}>
        {/* Worker Card */}
        <div className="v" style={sx(styles.workerCard)}>
          <div className="v" style={sx(styles.avatarWrapper)}>
            <img className="img" alt=""
              src={imgSrc({ uri: getImageUri(certData.workerPicture) })}
              style={sx(styles.avatar)}
              
            />
            <div className="v" style={sx(styles.onlineDot)} />
          </div>
          <div className="v" style={sx(styles.workerInfo)}>
            <span className="t" style={sx(styles.workerName)}>{certData.workerName}</span>
            <span className="t" style={sx(styles.workerSub)}>VERIFIED PERSONNEL</span>
          </div>
        </div>

        {/* Issuing Authority Card */}
        <div className="v" style={sx(styles.authorityCard)}>
          <div className="v" style={sx(styles.buildingIconBox)}>
            <Icon name="office-building" size={22} color="#FFF" />
          </div>
          <div className="v" style={sx(styles.authorityInfo)}>
            <span className="t" style={sx(styles.authorityLabel)}>ISSUING AUTHORITY</span>
            <span className="t" style={sx(styles.authorityName)}>{certData.companyName}</span>
            <div className="v" style={sx(styles.dateRow)}>
              <Icon
                name="calendar-month-outline"
                size={14}
                color="#64748B"
                style={{ marginRight: 4 }}
              />
              <span className="t" style={sx(styles.dateText)}>
                Issued Date: {certData.issuedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Content Card */}
        <div className="v" style={sx(styles.certCard)}>
          {/* Main Shield Icon */}
          <div className="v" style={sx(styles.badgeCircle)}>
            <Icon name="shield-check" size={34} color="#FFF" />
          </div>

          {/* Title */}
          <span className="t" style={sx(styles.certTitle)}>{certData.certificateTitle}</span>

          <div className="v" style={sx(styles.divider)} />

          {/* Evaluation Notes */}
          <span className="t" style={sx(styles.notesLabel)}>EVALUATION & TRAINING NOTES</span>
          <span className="t" style={sx(styles.notesText)}>
            "{certData.evaluationNotes && certData.evaluationNotes.trim().length > 0
              ? certData.evaluationNotes
              : 'Completed an accredited driver training program covering theoretical traffic regulations, highway maneuvering, reverse parking, and emergency braking procedures. Certified with a practical understanding of vehicle dynamics and modern road safety standards.'}"
          </span>

          {/* Digital Signature Footer */}
          <div className="v" style={sx(styles.signatureBlock)}>
            <span className="t" style={sx(styles.digitalSignature)}>Digital Signature</span>
            <div className="v" style={sx(styles.signatureLine)} />
            <span className="t" style={sx(styles.verificationId)}>
              Verification ID: CERT-{certData.certificateId || '1'}
            </span>
          </div>
        </div>
      </div></div>

      {/* Bottom Sticky Action */}
      <div className="v" style={sx(styles.footer)}>
        <button className="v btn" type="button"
          style={sx(styles.closeButton)}
          onClick={press(() => navigation.goBack())}
          
        >
          <span className="t" style={sx(styles.closeButtonText)}>Close Details</span>
        </button>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1E' },
  iconButton: { padding: 4 },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Worker Card
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EEE' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  workerInfo: { marginLeft: 14, flex: 1 },
  workerName: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
  workerSub: {
    fontSize: 12,
    color: '#1E64D3',
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // Authority Card
  authorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBECEE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  buildingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorityInfo: { marginLeft: 12, flex: 1 },
  authorityLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  authorityName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dateText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  // Main Certificate Card
  certCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  badgeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#0088CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  certTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 6,
    fontWeight: '400',
  },

  // Signature Section
  signatureBlock: { marginTop: 28, alignItems: 'center' },
  digitalSignature: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  signatureLine: {
    width: 150,
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 6,
  },
  verificationId: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  closeButton: {
    backgroundColor: '#E2E8F0',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { color: '#1E293B', fontWeight: 'bold', fontSize: 16 },

  errorText: { color: '#888', fontSize: 16, marginTop: 12, marginBottom: 18 },
  backBtnSimple: {
    backgroundColor: '#1E64D3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default WorkerCertificateDetail;