import React, { useState, useEffect, useCallback, useRef } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { useFocusEffect } from '@/web/navigation';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_POLICE, SERVER_BASE } from '../../config';
import { ListView, Spinner, StyleSheet, changeText, imgSrc, press, sx, tin } from '@/web';


const PoliceVerificationPortal = ({ navigation }) => {
  const [searchCnic, setSearchCnic] = useState('');
  const [workers, setWorkers] = useState([]);
  const [counts, setCounts] = useState({ certified: 0, uncertified: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const authRedirectedRef = useRef(false);
  // Tab 1 = Uncertified (default), Tab 2 = Certified
  const [activeTab, setActiveTab] = useState('Uncertified');

  const fetchWorkers = useCallback(async (cnicQuery = '') => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        if (!authRedirectedRef.current) {
          authRedirectedRef.current = true;
          NotificationHelper.showError('Your police session has expired. Please log in again.');
          navigation.replace('Login');
        }
        return;
      }

      const response = await fetch(`${API_POLICE}/GetWorkersForVerification?searchCnic=${encodeURIComponent(cnicQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // A 401/403 from the API has an empty body: don't crash on JSON parsing.
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        if (!authRedirectedRef.current) {
          authRedirectedRef.current = true;
          NotificationHelper.showError('Your police session is invalid or expired. Please log in again.');
          navigation.replace('Login');
        }
        return;
      }
      if (response.ok) {
        setWorkers(data.workers || []);
        setCounts({
          certified: data.certifiedCount || 0,
          uncertified: data.uncertifiedCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  // Refresh on focus so a freshly-issued certificate moves the worker to the
  // Certified tab the moment the officer comes back.
  useFocusEffect(
    useCallback(() => {
      fetchWorkers(searchCnic);
    }, [fetchWorkers, searchCnic])
  );

  const handleSearch = (text) => {
    setSearchCnic(text);
  };

  const visibleWorkers = workers.filter((w) =>
    activeTab === 'Certified' ? w.isCertified : !w.isCertified
  );

  const renderWorkerCard = ({ item }) => {
    const imageUri = item.picture
      ? item.picture.startsWith('http')
        ? item.picture
        : `${SERVER_BASE}${item.picture}`
      : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    return (
      <div className="v" style={sx(styles.card)}>
        <div className="v" style={sx(styles.cardHeader)}>
          <img className="img" alt="" src={imgSrc({ uri: imageUri })} style={sx(styles.avatar)} />
          <div className="v" style={sx(styles.infoContainer)}>
            <span className="t" style={sx(styles.workerName)}>{item.name}</span>
            <div className="v" style={sx(styles.metaRow)}>
              <span className="t" style={sx(styles.categoryText)}>{item.category || item.profession}</span>
              <span className="t" style={sx(styles.cnicText)}>CNIC: {item.cnic}</span>
            </div>
          </div>

          {item.isCertified ? (
            <div className="v" style={sx(styles.certChip)}>
              <Icon name="shield-check" size={12} color="#166534" />
              <span className="t" style={sx(styles.certChipText)}>Certified</span>
            </div>
          ) : (
            <div className="v" style={sx(styles.uncertChip)}>
              <Icon name="shield-off-outline" size={12} color="#92400E" />
              <span className="t" style={sx(styles.uncertChipText)}>Uncertified</span>
            </div>
          )}
        </div>

        {item.isCertified && item.certExpiry ? (
          <span className="t" style={sx(styles.expiryText)}>Valid until {item.certExpiry}</span>
        ) : null}

        <button className="v btn" type="button"
          style={sx([styles.reviewButton, item.isCertified && styles.renewButton])}
          onClick={press(() =>
            navigation.navigate('IssueCharacterCertificateScreen', { workerId: item.id }))
          }
        >
          <Icon
            name={item.isCertified ? 'certificate-outline' : 'certificate'}
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <span className="t" style={sx(styles.reviewButtonText)}>
            {item.isCertified ? 'RENEW CHARACTER CERTIFICATE' : 'ISSUE CHARACTER CERTIFICATE'}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="v screen" style={sx(styles.container)}>
      {/* Top Header */}
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backButton)}>
          <Icon name="arrow-left" size={22} color="#1E293B" />
        </button>
        <div className="v" style={sx(styles.headerTextContainer)}>
          <span className="t" style={sx(styles.headerTitle)}>Police Verification Portal</span>
          <span className="t" style={sx(styles.headerSubtitle)}>CHARACTER CERTIFICATE DATABASE</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="v" style={sx(styles.searchSection)}>
        <Icon name="magnify" size={22} color="#64748B" style={styles.searchIcon} />
        <input className="input" {...tin({ keyboardType: "numeric" })}
          style={{ ...sx(styles.searchInput), '--ph': "#94A3B8" }}
          placeholder="Search worker by CNIC..."
          
          value={(searchCnic) ?? ''}
          onChange={changeText(handleSearch)}
          
        />
      </div>

      {/* Tabs: Uncertified | Certified */}
      <div className="v" style={sx(styles.tabRow)}>
        <button className="v btn" type="button"
          style={sx([styles.tabButton, activeTab === 'Uncertified' && styles.activeTabButton])}
          onClick={press(() => setActiveTab('Uncertified'))}
        >
          <span className="t" style={sx([styles.tabText, activeTab === 'Uncertified' && styles.activeTabText])}>
            Uncertified ({counts.uncertified})
          </span>
        </button>
        <button className="v btn" type="button"
          style={sx([styles.tabButton, activeTab === 'Certified' && styles.activeTabButton])}
          onClick={press(() => setActiveTab('Certified'))}
        >
          <span className="t" style={sx([styles.tabText, activeTab === 'Certified' && styles.activeTabText])}>
            Certified ({counts.certified})
          </span>
        </button>
      </div>

      {/* Workers List */}
      {isLoading ? (
        <Spinner size="large" color="#111E2E" style={{ marginTop: 40 }} />
      ) : (
        <ListView
          data={visibleWorkers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContainer}
          
          ListEmptyComponent={
            <span className="t" style={sx(styles.emptyText)}>
              No {activeTab.toLowerCase()} workers found.
            </span>
          }
        />
      )}
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },

  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#111E2E',
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  activeTabText: { color: '#FFFFFF' },

  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  workerName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  metaRow: { marginTop: 4 },
  categoryText: { fontSize: 13, color: '#0284C7', fontWeight: '600' },
  cnicText: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },

  certChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  certChipText: { color: '#166534', fontWeight: '800', fontSize: 10 },
  uncertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  uncertChipText: { color: '#92400E', fontWeight: '800', fontSize: 10 },
  expiryText: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginBottom: 10 },

  reviewButton: {
    backgroundColor: '#111E2E',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  renewButton: { backgroundColor: '#0F766E' },
  reviewButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
});

export default PoliceVerificationPortal;
