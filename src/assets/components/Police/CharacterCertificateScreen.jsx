import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_POLICE, SERVER_BASE } from '../../config';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';

// Read-only view of a worker's police character certificate.
// Used by the CLIENT ("Criminal Background Check" button) and reusable elsewhere.
const CharacterCertificateScreen = ({ route, navigation }) => {
  const workerId = route?.params?.workerId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [workerId]);

  const fetchCertificate = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_POLICE}/GetWorkerCharacterCertificate/${workerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (response.ok) setData(json);
    } catch (error) {
      console.error('Error fetching certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="v" style={sx(styles.center)} role="status" aria-label="Loading certificate">
        <Spinner size="large" color="#0F766E" />
      </div>
    );
  }

  const status = data?.status || 'NotIssued';
  const cert = data?.certificate;

  const avatarUri = data?.workerPicture
    ? data.workerPicture.startsWith('http')
      ? data.workerPicture
      : `${SERVER_BASE}${data.workerPicture}`
    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  const theme =
    status === 'Verified'
      ? { color: '#166534', bg: '#DCFCE7', border: '#86EFAC', icon: 'shield-check', label: 'POLICE VERIFIED' }
      : status === 'Expired'
      ? { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: 'shield-alert', label: 'CERTIFICATE EXPIRED' }
      : { color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', icon: 'shield-off-outline', label: 'NOT CERTIFIED' };

  return (
    <main className="v screen" style={sx(styles.container)}>
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
        <h1 className="t" style={sx(styles.headerTitle)}>Character Certificate</h1>
        <div className="v" style={sx({ width: 32 })} />
      </header>

      <div className="v scroll">
        <div className="cert-layout" style={sx(styles.scroll)}>
          {/* ── Left column: who + verdict ── */}
          <aside className="v cert-side">
            {/* Worker header */}
            <section className="v" style={sx(styles.workerRow)} aria-label="Worker">
              <img className="img" alt={data?.workerName || 'Worker'} src={imgSrc({ uri: avatarUri })} style={sx(styles.avatar)} />
              <div className="v" style={sx({ flex: 1, minWidth: 0 })}>
                <h2 className="t" style={sx(styles.workerName)}>{data?.workerName || 'Worker'}</h2>
                <span className="t" style={sx(styles.workerCnic)}>CNIC: {data?.workerCnic || 'N/A'}</span>
              </div>
            </section>

            {/* Status banner */}
            <div
              className="v"
              role="status"
              style={sx([styles.statusBanner, { backgroundColor: theme.bg, borderColor: theme.border }])}
            >
              <Icon name={theme.icon} size={40} color={theme.color} />
              <span className="t" style={sx([styles.statusLabel, { color: theme.color }])}>{theme.label}</span>
            </div>
          </aside>

          {/* ── Right column: certificate details ── */}
          <section className="v cert-detail" aria-label="Certificate details">
            {cert ? (
              <article className="v" style={sx(styles.certCard)}>
                <h3 className="t" style={sx(styles.certHeading)}>Police Character Certificate</h3>
                <div className="v" style={sx(styles.divider)} />

                <dl style={sx(styles.detailList)}>
                  <DetailRow label="Certificate No." value={cert.certificateNo} />
                  <DetailRow label="Character Status" value={cert.characterStatus} />
                  <DetailRow label="Issued Date" value={cert.issuedDate} />
                  <DetailRow label="Valid Until" value={cert.expiryDate} highlight={status === 'Verified'} />
                  <DetailRow label="Issuing Station" value={cert.issuingStation || 'N/A'} />
                  <DetailRow label="Officer Badge" value={cert.issuingBadge || 'N/A'} />
                </dl>

                {cert.remarks ? (
                  <>
                    <h4 className="t" style={sx(styles.remarksLabel)}>Remarks</h4>
                    <p className="t" style={sx(styles.remarksText)}>{cert.remarks}</p>
                  </>
                ) : null}

                {status === 'Expired' ? (
                  <div className="v" style={sx(styles.warnBox)} role="alert">
                    <Icon name="alert-outline" size={16} color="#92400E" />
                    <span className="t" style={sx(styles.warnText)}>
                      This certificate has expired and is no longer valid. Ask the worker to get it renewed.
                    </span>
                  </div>
                ) : null}
              </article>
            ) : (
              <div className="v" style={sx(styles.emptyCard)}>
                <Icon name="shield-off-outline" size={48} color="#CBD5E1" />
                <p className="t" style={sx(styles.emptyText)}>
                  This worker has not been issued a police character certificate yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div className="v" style={sx(styles.detailRow)}>
    <dt className="t" style={sx(styles.detailLabel)}>{label}</dt>
    <dd className="t" style={sx([styles.detailValue, highlight && { color: '#16A34A', fontWeight: '800' }])}>
      {value || 'N/A'}
    </dd>
  </div>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 320 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', margin: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30 },

  workerRow: {
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
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, objectFit: 'cover' },
  workerName: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', margin: 0 },
  workerCnic: { fontSize: 13, color: '#64748B', marginTop: 3 },

  statusBanner: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    paddingVertical: 22,
    marginBottom: 16,
    gap: 8,
  },
  statusLabel: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  certHeading: { fontSize: 15, fontWeight: '800', color: '#0F172A', margin: 0 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  detailList: { margin: 0 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  detailValue: { fontSize: 13, color: '#0F172A', fontWeight: '700', maxWidth: '55%', textAlign: 'right', margin: 0, overflowWrap: 'anywhere' },

  remarksLabel: { fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 12, marginBottom: 4 },
  remarksText: { fontSize: 13, color: '#334155', lineHeight: 19, margin: 0, whiteSpace: 'pre-wrap' },

  warnBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  warnText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },

  emptyCard: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 30, lineHeight: 20, margin: 0 },
});

export default CharacterCertificateScreen;
