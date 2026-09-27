import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import { API_POLICE, SERVER_BASE } from '../../config';
import { ListView, Spinner, StyleSheet, changeText, imgSrc, press, sx, tin } from '@/web';


const PoliceVerificationPortal = ({ navigation }) => {
  const [searchCnic, setSearchCnic] = useState('');
  const [workers, setWorkers] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkers = async (cnicQuery = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_POLICE}/GetWorkersForVerification?searchCnic=${cnicQuery}`);
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers || []);
        setTotalResults(data.totalResults || 0);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers('');
  }, []);

  const handleSearch = (text) => {
    setSearchCnic(text);
    fetchWorkers(text);
  };

  const renderWorkerCard = ({ item }) => {
    const imageUri = item.picture
      ? (item.picture.startsWith('http') ? item.picture : `${SERVER_BASE}${item.picture}`)
      : 'https://via.placeholder.com/150';

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
        </div>

        <button className="v btn" type="button"
          style={sx(styles.reviewButton)}
          onClick={press(() => navigation.navigate('FileCriminalRecordScreen', { workerId: item.id }))}
        >
          <span className="t" style={sx(styles.reviewButtonText)}>REVIEW & FLAG WORKER</span>
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
          <span className="t" style={sx(styles.headerSubtitle)}>CRIMINAL RECORD DATABASE</span>
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

      {/* Subheader */}
      <div className="v" style={sx(styles.subHeader)}>
        <div className="v" style={sx(styles.filterChip)}>
          <span className="t" style={sx(styles.filterChipText)}>All Workers List</span>
        </div>
        <span className="t" style={sx(styles.totalResultsText)}>{totalResults} Total Results</span>
      </div>

      {/* Workers List */}
      {isLoading ? (
        <Spinner size="large" color="#111E2E" style={{ marginTop: 40 }} />
      ) : (
        <ListView
          data={workers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContainer}
          
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

  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#111E2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  totalResultsText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },

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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  workerName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  metaRow: { marginTop: 4 },
  categoryText: { fontSize: 13, color: '#0284C7', fontWeight: '600' },
  cnicText: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },

  reviewButton: {
    backgroundColor: '#111E2E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default PoliceVerificationPortal;