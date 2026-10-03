import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE, API_DIRECTORY } from '../../config';
import { ListView, ScrollView, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const WorkerDirectoryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesList, setCategoriesList] = useState(['All Workers', 'Cleaning', 'Driver', 'Cooking', 'Security']);
  const [selectedCategory, setSelectedCategory] = useState('All Workers');
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Company');
  const [companyPicture, setCompanyPicture] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadUserData();
    fetchWorkers();
  }, []);

  const loadUserData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      let companyId = await AsyncStorage.getItem('companyId') || await AsyncStorage.getItem('userId');

      if (!companyId) {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          companyId = userObj?.companyID || userObj?.companyId || userObj?.userId || userObj?.id;
        }
      }

      if (savedName) setCompanyName(savedName);

      if (companyId) {
        const authToken = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${API_DIRECTORY}/GetCompanyProfile?companyId=${companyId}`, {
          headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        });
        const data = await response.json();
        if (response.ok && data.companyPicture) {
          setCompanyPicture(data.companyPicture);
          await AsyncStorage.setItem('userPicture', data.companyPicture);
        }
      } else {
        const savedPic = await AsyncStorage.getItem('userPicture');
        if (savedPic) setCompanyPicture(savedPic);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const authToken = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_DIRECTORY}/GetAllWorkers`, {
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      });
      const data = await response.json();

      if (response.ok) {
        setWorkers(data);
        setFilteredWorkers(data);
      } else {
        NotificationHelper.showError("Failed to fetch directory.");
      }
    } catch (error) {
      console.error(error);
      NotificationHelper.showError("Cannot reach the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAndFilter = (text, category) => {
    let result = workers;

    if (category && category !== 'All Workers') {
      result = result.filter(w =>
        (w.categories && w.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))) ||
        (w.roleTitle && w.roleTitle.toLowerCase().includes(category.toLowerCase()))
      );
    }

    if (text && text.trim()) {
      result = result.filter(w =>
        w.name.toLowerCase().includes(text.toLowerCase()) ||
        w.roleTitle.toLowerCase().includes(text.toLowerCase())
      );
    }

    setFilteredWorkers(result);
  };

  const extractCity = (address) => {
    if (!address || address === 'N/A') return 'Rawalpindi';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  const getImageUri = (path) => {
    if (!path) return `${SERVER_BASE}/Images/company_default.jpg`;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_BASE}${formattedPath}`;
  };

  const renderWorkerCard = ({ item }) => {
    const city = extractCity(item.location);
    const avatarUri = getImageUri(item.picture);

    return (
      <div className="v" style={sx(styles.card)}>
        <div className="v" style={sx(styles.cardContent)}>
          <div className="v" style={sx(styles.imageWrapper)}>
            <img className="img" alt=""
              src={imgSrc({ uri: avatarUri })}
              style={sx(styles.workerImage)}
              
            />
            <div className="v" style={sx(styles.ratingBadge)}>
              <Icon name="star" size={12} color="#FFD700" />
              <span className="t" style={sx(styles.ratingText)}>{item.rating || "4.0"}</span>
            </div>
          </div>

          {/* Details */}
          <div className="v" style={sx(styles.mainInfo)}>
            <div className="v" style={sx(styles.headerRow)}>
              <span className="t" style={sx(styles.workerName, 1)} >{item.name}</span>
              <span className="t" style={sx(styles.salaryText)}>{item.salary}</span>
            </div>

            <span className="t" style={sx(styles.roleLabel, 1)} >{item.roleTitle}</span>

            {/* Badges */}
            <div className="v" style={sx(styles.badgeRow)}>
              {item.categories && item.categories.length > 0 ? (
                item.categories.slice(0, 2).map((cat, index) => (
                  <div className="v" key={index} style={sx(styles.skillBadge)}>
                    <span className="t" style={sx(styles.skillBadgeText)}>{cat}</span>
                  </div>
                ))
              ) : (
                <div className="v" style={sx(styles.skillBadge)}>
                  <span className="t" style={sx(styles.skillBadgeText)}>General</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="v" style={sx(styles.locationContainer)}>
              <span className="t" style={sx(styles.locationLabel)}>City</span>
              <span className="t" style={sx(styles.locationText)}>{city}</span>
            </div>
          </div>
        </div>

        <button className="v btn" type="button"
          style={sx(styles.actionButton)}
          onClick={press(() => navigation.navigate('WorkerDetailsVerificationScreen', { workerId: item.workerId }))}
        >
          <span className="t" style={sx(styles.actionButtonText)}>Verify Profile</span>
        </button>
      </div>
    );
  };

  const companyPicUri = getImageUri(companyPicture);

  return (
    <div className="v screen" style={sx(styles.container)}>
      

      {/* Screen Header */}
      <div className="v" style={sx(styles.header)}>
        <div className="v" style={sx({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' })}>
          <div className="v" style={sx({ flex: 1 })}>
            <span className="t" style={sx(styles.welcomeText)}>Welcome, {companyName}</span>
            <span className="t" style={sx(styles.subHeading)}>WORKFORCE DIRECTORY</span>
            <span className="t" style={sx(styles.questionText)}>Manage and verify your workforce directory.</span>
          </div>

          {/* Profile Picture (Top Right) */}
          <button className="v btn" type="button"
            style={sx(styles.profileContainer)}
            onClick={press(() => navigation.navigate('UserDashboardScreen'))}
          >
            {companyPicture && !imageError ? (
              <img className="img" alt=""
                src={imgSrc({ uri: companyPicUri })}
                style={sx(styles.profilePic)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="v" style={sx([styles.profilePic, styles.profilePlaceholder])}>
                <Icon name="domain" size={28} color="#1E64D3" />
              </div>
            )}
            <div className="v" style={sx(styles.profileBadge)}>
              <Icon name="account" size={12} color="#000" />
            </div>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="v" style={sx(styles.searchContainer)}>
        <input className="input"
          style={{ ...sx(styles.searchInput), '--ph': "#999" }}
          placeholder="Search by Name or Role"
          
          value={(searchQuery) ?? ''}
          onChange={changeText((text) => {
            setSearchQuery(text);
            handleSearchAndFilter(text, selectedCategory);
          })}
        />
        <Icon name="magnify" size={22} color="#333" style={styles.searchIcon} />
      </div>

      {/* Single-Line Scrollable Category Filters */}
      <div className="v" style={sx(styles.filterWrapper)}>
        <ScrollView
          horizontal
          
          contentContainerStyle={styles.filterScrollContent}
        >
          {categoriesList.map((cat) => (
            <button className="v btn" type="button"
              key={cat}
              style={sx([styles.tab, selectedCategory === cat && styles.activeTab])}
              onClick={press(() => {
                setSelectedCategory(cat);
                handleSearchAndFilter(searchQuery, cat);
              })}
            >
              <span className="t" style={sx([styles.tabText, selectedCategory === cat && styles.activeTabText])}>{cat}</span>
            </button>
          ))}
        </ScrollView>
      </div>

      {/* Total Counter */}
      <span className="t" style={sx(styles.resultsCount)}>{filteredWorkers.length} Total Professionals</span>

      {/* Main List */}
      {isLoading ? (
        <Spinner size="large" color="#1E64D3" style={{ marginTop: 50 }} />
      ) : (
        <ListView
          data={filteredWorkers}
          keyExtractor={(item, index) => (item.workerId ? item.workerId.toString() : index.toString())}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContent}
          
          ListEmptyComponent={
            <div className="v" style={sx(styles.emptyBox)}>
              <Icon name="account-search-outline" size={60} color="#CCC" />
              <span className="t" style={sx(styles.emptyText)}>No professionals found</span>
            </div>
          }
        />
      )}
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, marginTop: 15 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#001F3F' },
  subHeading: { fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 2 },
  questionText: { fontSize: 13, color: '#666' },
  profileContainer: { position: 'relative', marginLeft: 10 },
  profilePic: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#EEE' },
  profilePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F0FE' },
  profileBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEE', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#FFF', elevation: 2 },

  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 12, borderRadius: 15, paddingHorizontal: 15, alignItems: 'center', borderWidth: 1, borderColor: '#DDD', elevation: 2 },
  searchInput: { flex: 1, height: 45, color: '#333' },
  searchIcon: { marginLeft: 10 },

  filterWrapper: { height: 40, marginBottom: 10 },
  filterScrollContent: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' },
  activeTab: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  tabText: { fontWeight: 'bold', color: '#333', fontSize: 13 },
  activeTabText: { color: '#FFF' },

  resultsCount: { alignSelf: 'flex-start', marginLeft: 20, fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },

  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 18, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#F0F0F0' },
  cardContent: { flexDirection: 'row' },
  imageWrapper: { position: 'relative' },
  workerImage: { width: 85, height: 85, borderRadius: 20, backgroundColor: '#F8F9FA' },
  ratingBadge: { position: 'absolute', bottom: -5, right: -5, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, elevation: 3 },
  ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2, color: '#333' },

  mainInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workerName: { fontSize: 17, fontWeight: 'bold', color: '#1A1C1E', flex: 1, marginRight: 8 },
  salaryText: { fontSize: 14, fontWeight: '700', color: '#00B14F' },
  roleLabel: { color: '#1E64D3', fontSize: 13, fontWeight: '600', marginBottom: 6 },

  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: '#EAEAEA' },
  skillBadgeText: { fontSize: 11, fontWeight: '600', color: '#444' },

  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { fontSize: 11, color: '#888', marginRight: 4 },
  locationText: { fontSize: 12, color: '#333', fontWeight: 'bold' },

  actionButton: { backgroundColor: '#1E64D3', borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, elevation: 2 },
  actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});

export default WorkerDirectoryScreen;