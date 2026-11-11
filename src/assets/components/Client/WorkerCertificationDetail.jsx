import React, { useCallback, useEffect, useState } from 'react';

import AsyncStorage from '@/web/AsyncStorage';
import Icon from '@/web/Icon';
import { API_DIRECTORY } from '../../config';
import { ListView, RefreshControl, Spinner, StyleSheet, press, sx } from '@/web';


const formatDate = (value) => {
  if (!value) return 'Date not recorded';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const getCertificateTypeLabel = (certificate) => (
  certificate.certificateType === 'CourseCompletion'
    ? 'Course completion'
    : 'Company certification'
);

export default function WorkerCertificationDetail({ navigation, route }) {
  const { workerId, workerName: routeWorkerName, viewerRole } = route.params || {};
  const isWorkerView = viewerRole === 'Worker';
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchCertificates = useCallback(async (showInitialLoader = true) => {
    if (!workerId) {
      setCertificates([]);
      setError('Worker information is unavailable.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (showInitialLoader) setIsLoading(true);
      else setIsRefreshing(true);
      setError('');
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(
        `${API_DIRECTORY}/GetWorkerCertificates/${workerId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.message || 'Could not load training certificates.');
      }

      const data = await response.json();
      setCertificates(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.warn('Worker certificates fetch failed:', fetchError);
      setCertificates([]);
      setError(fetchError.message || 'Could not load training certificates.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchCertificates();
    const unsubscribe = navigation.addListener('focus', fetchCertificates);
    return unsubscribe;
  }, [navigation, fetchCertificates]);

  const openCertificate = (certificate) => {
    navigation.navigate('WorkerCertificateRecordDetail', { certificate, viewerRole });
  };

  const renderCertificate = ({ item }) => (
      <button className="v btn" type="button"
        style={sx(styles.certificateCard)}
        
        onClick={press(() => openCertificate(item))}
        
        aria-label={`View ${item.certificateTitle || 'training certificate'} details`}
      >
        <div className="v" style={sx(styles.cardTopRow)}>
          <div className="v" style={sx(styles.typeIcon)}>
            <Icon
              name={item.certificateType === 'CourseCompletion' ? 'school-outline' : 'certificate-outline'}
              size={22}
              color="#0876A8"
            />
          </div>
          <div className="v" style={sx(styles.typeCopy)}>
            <span className="t" style={sx(styles.typeLabel)}>{getCertificateTypeLabel(item)}</span>
            {!!item.companyName && (
              <span className="t" style={sx(styles.issuerText, 1)} >
                {item.companyName}
              </span>
            )}
          </div>
        </div>

        <span className="t" style={sx(styles.certificateTitle, 2)} >
          {item.certificateTitle || 'Title not recorded'}
        </span>

        <div className="v" style={sx(styles.cardBottomRow)}>
          <div className="v" style={sx(styles.dateCopy)}>
            <Icon name="calendar-month-outline" size={15} color="#728096" />
            <span className="t" style={sx(styles.dateText)}>Issued {formatDate(item.issuedDate)}</span>
          </div>
          <Icon name="chevron-right" size={23} color="#8190A5" />
        </div>
      </button>
    );

  const listHeader = () => {
    const displayName = certificates[0]?.workerName || routeWorkerName;
    return (
      <div className="v" style={sx(styles.introCard)}>
        <div className="v" style={sx(styles.introIcon)}>
          <Icon name="shield-check-outline" size={25} color="#0876A8" />
        </div>
        <div className="v" style={sx(styles.introCopy)}>
          <span className="t" style={sx(styles.introTitle)}>{isWorkerView ? 'My certificates' : 'Training certificates'}</span>
          <span className="t" style={sx(styles.introSubtitle)}>
            {isWorkerView
              ? 'Your company-issued and course-completion certificate records.'
              : displayName
                ? `Certificates and training records for ${displayName}.`
                : 'Certificates and training records provided for this worker.'}
          </span>
        </div>
      </div>
    );
  };

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
        <span className="t" style={sx(styles.headerTitle)}>{isWorkerView ? 'My Certificates' : 'Verified Training'}</span>
        <div className="v" style={sx(styles.headerSpacer)} />
      </div>

      {isLoading ? (
        <div className="v" style={sx(styles.centeredState)}>
          <Spinner size="large" color="#0876A8" />
          <span className="t" style={sx(styles.loadingText)}>Loading certificates…</span>
        </div>
      ) : error ? (
        <div className="v" style={sx(styles.centeredState)}>
          <div className="v" style={sx(styles.emptyIcon)}>
            <Icon name="wifi-alert" size={30} color="#7D8BA0" />
          </div>
          <span className="t" style={sx(styles.emptyTitle)}>Certificates unavailable</span>
          <span className="t" style={sx(styles.emptyText)}>{error}</span>
          <button className="v btn" type="button" style={sx(styles.retryButton)} onClick={press(fetchCertificates)}>
            <span className="t" style={sx(styles.retryButtonText)}>Try again</span>
          </button>
        </div>
      ) : (
        <ListView
          data={certificates}
          keyExtractor={(item) => `${item.certificateType || 'certificate'}-${item.certificateId}`}
          renderItem={renderCertificate}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={(
            <div className="v" style={sx(styles.emptyState)}>
              <div className="v" style={sx(styles.emptyIcon)}>
                <Icon name="certificate-outline" size={30} color="#7D8BA0" />
              </div>
              <span className="t" style={sx(styles.emptyTitle)}>No certificates found</span>
              <span className="t" style={sx(styles.emptyText)}>
                There are no company-issued certifications or course-completion certificates on record for this worker.
              </span>
            </div>
          )}
          contentContainerStyle={styles.listContent}
          
          refreshControl={(
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchCertificates(false)} tintColor="#0876A8" />
          )}
        />
      )}
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
  listContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 28, flexGrow: 1 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5FA',
    borderWidth: 1,
    borderColor: '#D4EAF4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  introCopy: { flex: 1, marginLeft: 12 },
  introTitle: { color: '#14334B', fontSize: 16, fontWeight: '800' },
  introSubtitle: { color: '#536B7D', fontSize: 12, lineHeight: 18, marginTop: 4 },
  certificateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7ECF2',
    shadowColor: '#18324D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5FA',
  },
  typeCopy: { flex: 1, marginLeft: 11, marginRight: 8 },
  typeLabel: { color: '#526174', fontSize: 12, fontWeight: '800' },
  issuerText: { color: '#8090A3', fontSize: 11, marginTop: 3 },
  certificateTitle: { color: '#17263D', fontSize: 18, fontWeight: '800', lineHeight: 24, marginTop: 14 },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    paddingTop: 12,
    marginTop: 13,
  },
  dateCopy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: '#728096', fontSize: 12, fontWeight: '600' },
  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  loadingText: { color: '#728096', fontSize: 13, marginTop: 12 },
  emptyState: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9EEF4',
  },
  emptyTitle: { color: '#233349', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  emptyText: { color: '#718097', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 330 },
  retryButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0876A8' },
  retryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
