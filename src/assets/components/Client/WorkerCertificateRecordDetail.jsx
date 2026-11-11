import React from 'react';

import Icon from '@/web/Icon';
import { SERVER_BASE } from '../../config';
import { Alert, Linking, StyleSheet, imgSrc, press, sx } from '@/web';


const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const getUtcDay = (value) => {
  if (!value) return null;
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (dateParts) {
    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) return null;
    return timestamp;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
};

const calculateCourseDuration = (startDate, endDate) => {
  const startDay = getUtcDay(startDate);
  const endDay = getUtcDay(endDate);
  if (startDay === null || endDay === null || endDay < startDay) return null;

  // Course dates include both the first and last day (same-day courses = 1 day).
  const days = Math.round((endDay - startDay) / 86400000) + 1;
  return `${days} day${days === 1 ? '' : 's'}`;
};

const getImageUri = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/')
    ? path
    : path.includes('/') ? `/${path}` : `/Images/${path}`;
  return `${SERVER_BASE}${normalizedPath}`;
};

const DetailRow = ({ label, value, mono = false }) => {
  if (!value) return null;
  return (
    <div className="v" style={sx(styles.detailRow)}>
      <span className="t" style={sx(styles.detailLabel)}>{label}</span>
      <span className="t" style={sx([styles.detailValue, mono && styles.monoValue])} >
        {value}
      </span>
    </div>
  );
};

export default function WorkerCertificateRecordDetail({ navigation, route }) {
  const certificate = route.params?.certificate || {};
  const isWorkerView = route.params?.viewerRole === 'Worker';
  const isCourseCertificate = certificate.certificateType === 'CourseCompletion';
  const workerPhoto = getImageUri(certificate.workerPicture);
  const courseStart = formatDate(certificate.courseStartDate);
  const courseEnd = formatDate(certificate.courseEndDate);
  const courseDuration = calculateCourseDuration(certificate.courseStartDate, certificate.courseEndDate);
  const coursePeriod = courseStart || courseEnd
    ? [courseStart, courseEnd].filter(Boolean).join(' – ')
    : null;
  const issueDate = formatDate(certificate.issuedDate);
  const completionDate = formatDate(certificate.completionDateUtc);

  const openCertificateFile = async () => {
    if (!certificate.certificateUrl) return;
    const uri = /^https?:\/\//i.test(certificate.certificateUrl)
      ? certificate.certificateUrl
      : `${SERVER_BASE}${certificate.certificateUrl.startsWith('/') ? '' : '/'}${certificate.certificateUrl}`;
    try {
      await Linking.openURL(uri);
    } catch (error) {
      Alert.alert('Unable to open certificate', 'The certificate file could not be opened on this device.');
    }
  };

  const syllabusItems = (certificate.syllabus || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="v screen" style={sx(styles.container)}>
      
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button"
          onClick={press(() => navigation.goBack())}
          style={sx(styles.backButton)}
          
          
          aria-label="Go back"
        >
          <Icon name="arrow-left" size={23} color="#152238" />
        </button>
        <span className="t" style={sx(styles.headerTitle)}>Certificate details</span>
        <div className="v" style={sx(styles.headerSpacer)} />
      </div>

      <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
        
        <div className="v" style={sx(styles.certificateCard)}>
          <div className="v" style={sx(styles.certificateBorder)}>
            <div className="v" style={sx(styles.seal)}>
              <Icon name={isCourseCertificate ? 'school-outline' : 'certificate-outline'} size={34} color="#0876A8" />
            </div>
            <span className="t" style={sx(styles.eyebrow)}>
              {isCourseCertificate ? 'COURSE COMPLETION CERTIFICATE' : 'COMPANY CERTIFICATION'}
            </span>
            <span className="t" style={sx(styles.presentedLabel)}>Record for</span>

            <div className="v" style={sx(styles.workerLine)}>
              {workerPhoto ? (
                <img className="img" alt="" src={imgSrc({ uri: workerPhoto })} style={sx(styles.workerAvatar)} />
              ) : (
                <div className="v" style={sx([styles.workerAvatar, styles.avatarFallback])}>
                  <Icon name="account-outline" size={26} color="#6B8195" />
                </div>
              )}
              <span className="t" style={sx(styles.workerName)}>{certificate.workerName || 'Worker name not recorded'}</span>
            </div>

            <div className="v" style={sx(styles.accentLine)} />
            <span className="t" style={sx(styles.certificateTitle)}>
              {certificate.certificateTitle || 'Title not recorded'}
            </span>
            {!!certificate.companyName && (
              <span className="t" style={sx(styles.issuerLine)}>Issued by {certificate.companyName}</span>
            )}

          </div>
        </div>

        <div className="v" style={sx(styles.sectionCard)}>
          <span className="t" style={sx(styles.sectionTitle)}>Certificate information</span>
          <DetailRow label="Record type" value={isCourseCertificate ? 'Course completion' : 'Company-issued certification'} />
          <DetailRow label="Issuing company" value={certificate.companyName} />
          <DetailRow label="Issue date" value={issueDate} />

          {isCourseCertificate ? (
            <>
              <DetailRow label="Course period" value={coursePeriod} />
              <DetailRow label="Course duration" value={courseDuration || 'Not available'} />
              <DetailRow label="Completion date" value={completionDate} />
              <DetailRow label="Certificate code" value={certificate.certificateCode} mono />
            </>
          ) : (
            <DetailRow label="Training / evaluation notes" value={certificate.evaluationNotes?.trim()} />
          )}
        </div>

        {isCourseCertificate && !!certificate.courseDescription?.trim() && (
          <div className="v" style={sx(styles.sectionCard)}>
            <span className="t" style={sx(styles.sectionTitle)}>Course description</span>
            <span className="t" style={sx(styles.bodyText)}>{certificate.courseDescription.trim()}</span>
          </div>
        )}

        {isCourseCertificate && syllabusItems.length > 0 && (
          <div className="v" style={sx(styles.sectionCard)}>
            <span className="t" style={sx(styles.sectionTitle)}>Course syllabus</span>
            {syllabusItems.map((item, index) => (
              <div className="v" style={sx(styles.syllabusRow)} key={`${index}-${item}`}>
                <div className="v" style={sx(styles.syllabusDot)} />
                <span className="t" style={sx(styles.bodyText)}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {isCourseCertificate && certificate.certificateUrl ? (
          <button className="v btn" type="button" style={sx(styles.fileButton)} onClick={press(openCertificateFile)} >
            <Icon name="file-download-outline" size={20} color="#FFFFFF" />
            <span className="t" style={sx(styles.fileButtonText)}>Open certificate file</span>
            <Icon name="open-in-new" size={17} color="#FFFFFF" />
          </button>
        ) : null}

      </div></div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF3',
  },
  backButton: { width: 38, height: 38, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { color: '#152238', fontSize: 18, fontWeight: '800' },
  headerSpacer: { width: 38 },
  scrollContent: { padding: 18, paddingBottom: 34 },
  certificateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DAE5ED',
    shadowColor: '#18324D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  certificateBorder: {
    borderWidth: 1,
    borderColor: '#C9DEE9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 26,
    alignItems: 'center',
  },
  seal: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5FA',
  },
  eyebrow: { color: '#0876A8', fontSize: 10, fontWeight: '900', letterSpacing: 1.05, textAlign: 'center', marginTop: 14 },
  presentedLabel: { color: '#8290A1', fontSize: 12, marginTop: 18 },
  workerLine: { alignItems: 'center', marginTop: 10 },
  workerAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#EEF2F6' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  workerName: { color: '#26384F', fontSize: 18, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  accentLine: { width: 52, height: 3, borderRadius: 2, backgroundColor: '#D7AA55', marginTop: 19, marginBottom: 16 },
  certificateTitle: { color: '#152238', fontSize: 23, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  issuerLine: { color: '#607286', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E7ECF2',
  },
  sectionTitle: { color: '#1F3048', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  detailRow: { paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EEF1F5' },
  detailLabel: { color: '#7B899A', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  detailValue: { color: '#283950', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  monoValue: { fontFamily: 'monospace', letterSpacing: 0.2 },
  bodyText: { color: '#485A70', fontSize: 13, lineHeight: 20, flex: 1 },
  syllabusRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 9 },
  syllabusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D7AA55', marginTop: 7, marginRight: 10 },
  fileButton: {
    minHeight: 48,
    backgroundColor: '#0876A8',
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  fileButtonText: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginLeft: 9 },
});
