import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@/web/navigation';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { SERVER_BASE } from '../../config';
import JobTypeBadge from '../helpers/JobTypeBadge';
import SlotTimeLabel from '../helpers/SlotTimeLabel';
import { ListView, Platform, Spinner, StyleSheet, imgSrc, press, sx } from '@/web';


const UserDashboard = ({ navigation }) => {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview', 'Active', 'Past'

  // User details state
  const [userName, setUserName] = useState("Client User");
  const [userPicture, setUserPicture] = useState("");
  const [userAddress, setUserAddress] = useState("Your Address");
  const [userPhone, setUserPhone] = useState("03XXXXXXX");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

  const sortWorkersByInterviewIdDesc = (list = []) => {
    return [...list].sort((a, b) => {
      const aId = Number(a.interviewId || a.id || 0);
      const bId = Number(b.interviewId || b.id || 0);
      return bId - aId;
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
      fetchWorkers();
    }, [])
  );

  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const pic = await AsyncStorage.getItem('userPicture');
      const addr = await AsyncStorage.getItem('userAddress');
      const phone = await AsyncStorage.getItem('userPhone');
      const email = await AsyncStorage.getItem('userEmail');
      const id = await AsyncStorage.getItem('clientId');

      if (name) setUserName(name);
      if (pic) setUserPicture(pic);
      if (addr) setUserAddress(addr);
      if (phone) setUserPhone(phone);
      if (email) setUserEmail(email);
      if (id) setUserId(id);
    } catch (error) {
      console.error("Error loading user info from AsyncStorage:", error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('Signup', {
      isEdit: true,
      role: 'Client',
      initialData: {
        id: userId,
        name: userName,
        email: userEmail,
        phone: userPhone,
        location: userAddress,
        picture: userPicture
      }
    });
  };

  const fetchWorkers = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${SERVER_BASE}/api/Dashboard/GetClientDashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = sortWorkersByInterviewIdDesc(data.hiredWorkers || []);

        const activeWorkers = list.filter(w => {
          const s = (w.status || '').toString().toLowerCase();
          return !s.includes('terminate') && !s.includes('resign');
        });

        setWorkers(list);
        setHiredCount(activeWorkers.length);
        setPendingInterviewsCount(data.pendingInterviewsCount || 0);
      } else if (response.status === 401) {
        NotificationHelper.showError("Session Expired. Please login again.");
        navigation.replace('Login');
      } else {
        console.error("Failed to fetch dashboard data", await response.text());
      }
    } catch (error) {
      console.error("Network error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const isTerminatedWorker = (item) => {
    const s = (item.status || '').toString().trim().toLowerCase();
    return s.includes('terminate') || s.includes('resign');
  };

  const activeWorkersList = workers.filter(w => !isTerminatedWorker(w));
  const pastWorkersList = workers.filter(w => isTerminatedWorker(w));

  const getDisplayedWorkers = () => {
    if (activeTab === 'Active') return activeWorkersList;
    if (activeTab === 'Past') return pastWorkersList;
    return [];
  };

  const renderWorkerCard = ({ item }) => {
    const rawStatus = (item.status || '').toString();
    const statusNorm = rawStatus.trim().toLowerCase();

    let displayStatus = 'On Work';
    if (statusNorm.includes('resign')) {
      displayStatus = 'Resigned';
    } else if (statusNorm.includes('terminate')) {
      displayStatus = 'Terminated';
    }

    const isPast = isTerminatedWorker(item);

    return (
      <button className="v btn" type="button"
        style={sx(styles.workerCard)}
        onClick={press(() => navigation.navigate('WorkerDetailScreen', { workerId: item.id }))}
        
      >
        {/* Row 1 — who is working for you */}
        <div className="v" style={sx(styles.cardHeader)}>
          <img className="img" alt=""
            src={imgSrc({
              uri: item.picture && item.picture.startsWith('/')
                ? `${SERVER_BASE}${item.picture}`
                : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            })}
            style={sx(styles.workerImage)}
          />

          <div className="v" style={sx(styles.workerInfo)}>
            <span className="t" style={sx(styles.workerName, 1)} >{item.name}</span>
            <span className="t" style={sx(styles.workerCaption, 1)} >
              {isPast ? 'Contract closed' : 'Working with you'}
            </span>
          </div>

          <div className="v" style={sx([styles.statusPill, isPast ? styles.resignedPill : styles.activePill])}>
            <span className="t" style={sx([styles.statusPillText, isPast ? styles.resignedPillText : styles.activePillText])}>
              {displayStatus}
            </span>
          </div>
        </div>

        {/* Row 2 — part-time / full-time, and the reserved window when part-time */}
        <div className="v" style={sx(styles.chipRow)}>
          <JobTypeBadge jobType={item.jobType} small />
          <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} small />
        </div>

        {/* Row 3 — where the job is */}
        <div className="v" style={sx(styles.locationRow)}>
          <Icon name="map-marker-outline" size={15} color="#E91E63" />
          <span className="t" style={sx(styles.locationText, 1)} >
            {item.location || 'Location not set'}
          </span>
        </div>

        <div className="v" style={sx(styles.cardDivider)} />

        {/* Row 4 — record + the only real action here */}
        <div className="v" style={sx(styles.cardFooter)}>
          <div className="v" style={sx(styles.recordIdWrap)}>
            <Icon name="file-document-outline" size={13} color="#A0AEC0" />
            <span className="t" style={sx(styles.recordIdText)}>Record ID: #{item.interviewId || item.id || 'N/A'}</span>
          </div>

          {!isPast && (
            <button className="v btn" type="button"
              style={sx(styles.terminateBtn)}
              onClick={press(() => navigation.navigate('TerminateContractScreen', {
                workerId: item.id,
                interviewId: item.interviewId
              }))}
              
            >
              <Icon name="account-off-outline" size={14} color="#C53030" />
              <span className="t" style={sx(styles.terminateBtnText)}>Terminate</span>
            </button>
          )}
        </div>
      </button>
    );
  };

  const renderHeader = () => (
    <div className="v" style={sx(styles.headerContainer)}>
      {/* Top Navigation / Action Bar */}
      <div className="v" style={sx(styles.topBar)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.circleBackBtn)}>
          <Icon name="chevron-left" size={24} color="#4A5568" style={styles.centeredIcon} />
        </button>

        <div className="v" style={sx(styles.headerRightActions)}>
          <button className="v btn" type="button" style={sx(styles.editPillBtn)} onClick={press(handleEditProfile)}>
            <Icon name="pencil-outline" size={14} color="#3182CE" />
            <span className="t" style={sx(styles.editPillText)}>Edit</span>
          </button>
          <button className="v btn" type="button" style={sx(styles.logoutPillBtn)} onClick={press(handleLogout)}>
            <Icon name="logout" size={14} color="#E53E3E" />
            <span className="t" style={sx(styles.logoutPillText)}>Logout</span>
          </button>
        </div>
      </div>

      {/* User Info Overview */}
      <div className="v" style={sx(styles.profileSection)}>
        <div className="v" style={sx({ flex: 1, justifyContent: 'center' })}>
          <span className="t" style={sx(styles.greetingText)}>GOOD MORNING</span>
          <span className="t" style={sx(styles.userName)}>{userName}</span>
        </div>

        <img className="img" alt=""
          src={imgSrc({
            uri: userPicture && userPicture.startsWith('/')
              ? `${SERVER_BASE}${userPicture}`
              : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png'
          })}
          style={sx(styles.profilePic)}
          onError={() => console.log('Dashboard profile image failed:', `${SERVER_BASE}${userPicture}`)}
        />
      </div>

      {/* Contact Card */}
      <div className="v" style={sx(styles.addressCard)}>
        <div className="v" style={sx(styles.infoRow)}>
          <Icon name="map-marker" size={16} color="#E91E63" />
          <span className="t" style={sx(styles.infoText)}>{userAddress}</span>
        </div>
        <div className="v" style={sx(styles.infoRow)}>
          <Icon name="phone" size={16} color="#2B6CB0" />
          <span className="t" style={sx(styles.infoText)}>{userPhone}</span>
        </div>
      </div>

      {/* Quick Access Service Cards Grid */}
      <div className="v" style={sx(styles.gridContainer)}>
        <button className="v btn" type="button" style={sx(styles.gridCard)} onClick={press(() => navigation.navigate('FindServiceScreen'))}>
          <div className="v" style={sx([styles.gridIconBg, { backgroundColor: '#EBF8FF' }])}>
            <Icon name="bag-personal-outline" size={20} color="#3182CE" />
          </div>
          <span className="t" style={sx(styles.gridCardText)}>Services</span>
        </button>

        <button className="v btn" type="button" style={sx(styles.gridCard)} onClick={press(() => navigation.navigate('ActiveRequestScreen'))}>
          <div className="v" style={sx([styles.gridIconBg, { backgroundColor: '#FEFCBF' }])}>
            <Icon name="calendar-month-outline" size={20} color="#D69E2E" />
          </div>
          {pendingInterviewsCount > 0 && <div className="v" style={sx(styles.orangeNotificationDot)} />}
          <span className="t" style={sx(styles.gridCardText)}>Interviews</span>
        </button>

        <button className="v btn" type="button" style={sx(styles.gridCard)} onClick={press(() => navigation.navigate('WorkerDecisionScreen'))}>
          <div className="v" style={sx([styles.gridIconBg, { backgroundColor: '#E6FFFA' }])}>
            <Icon name="briefcase-outline" size={20} color="#319795" />
          </div>
          <span className="t" style={sx(styles.gridCardText)}>Job Reqs</span>
        </button>

        <button className="v btn" type="button" style={sx(styles.gridCard)} onClick={press(() => navigation.navigate('ResignationsScreen'))}>
          <div className="v" style={sx([styles.gridIconBg, { backgroundColor: '#FFF5F5' }])}>
            <Icon name="file-document-outline" size={20} color="#E53E3E" />
          </div>
          <span className="t" style={sx(styles.gridCardText)}>Resignations</span>
        </button>
      </div>

      {/* Segment Tab Control Bar */}
      <div className="v" style={sx(styles.segmentContainer)}>
        {['Overview', 'Active', 'Past'].map((tab) => (
          <button className="v btn" type="button"
            key={tab}
            style={sx([styles.segmentBtn, activeTab === tab && styles.segmentBtnActive])}
            onClick={press(() => setActiveTab(tab))}
          >
            <span className="t" style={sx([styles.segmentText, activeTab === tab && styles.segmentTextActive])}>
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* Overview View Content */}
      {activeTab === 'Overview' && (
        <div className="v" style={sx(styles.overviewCardsRow)}>
          <div className="v" style={sx(styles.overviewCard)}>
            <div className="v" style={sx(styles.overviewIconBgBlue)}>
              <Icon name="account-group" size={22} color="#3182CE" />
            </div>
            <div className="v" style={sx(styles.overviewCardTextCol)}>
              <span className="t" style={sx(styles.overviewCardLabel)}>Workers</span>
              <span className="t" style={sx(styles.overviewCardNum)}>{hiredCount}</span>
            </div>
            <div className="v" style={sx(styles.liveTag)}>
              <span className="t" style={sx(styles.liveTagText)}>Live</span>
            </div>
          </div>

          <div className="v" style={sx(styles.overviewCard)}>
            <div className="v" style={sx(styles.overviewIconBgOrange)}>
              <Icon name="clock-outline" size={22} color="#DD6B20" />
            </div>
            <div className="v" style={sx(styles.overviewCardTextCol)}>
              <span className="t" style={sx(styles.overviewCardLabel)}>Interview</span>
              <span className="t" style={sx(styles.overviewCardNum)}>{pendingInterviewsCount}</span>
            </div>
            <div className="v" style={sx(styles.pendingTag)}>
              <span className="t" style={sx(styles.pendingTagText)}>Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub Header Row for Active and Past Lists */}
      {activeTab !== 'Overview' && (
        <div className="v" style={sx(styles.subHeaderRow)}>
          <span className="t" style={sx(styles.subHeaderText)}>
            Showing {getDisplayedWorkers().length} {activeTab === 'Past' ? 'historical worker records' : 'active worker records'}
          </span>
          {/* <TouchableOpacity>
            <Text style={styles.filterText}>Filter by Status</Text>
          </TouchableOpacity> */}
        </div>
      )}
    </div>
  );

  return (
    <div className="v screen" style={sx(styles.container)}>
      
      {isLoading ? (
        <div className="v" style={sx(styles.loadingContainer)}>
          <Spinner size="large" color="#3182CE" />
        </div>
      ) : (
        <ListView
          data={getDisplayedWorkers()}
          renderItem={renderWorkerCard}
          keyExtractor={item => (item.interviewId || item.id || '').toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          
          ListEmptyComponent={
            activeTab !== 'Overview' ? (
              <span className="t" style={sx(styles.emptyListText)}>
                No worker records found in {activeTab.toLowerCase()}.
              </span>
            ) : null
          }
        />
      )}
    </div>
  );
};

const styles = StyleSheet.create({

    workerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8EDF5',
        elevation: 2,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    workerImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EAF2FF' },
    workerInfo: { marginLeft: 12, flex: 1, marginRight: 8 },
    workerName: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
    workerCaption: { fontSize: 11.5, color: '#94A3B8', marginTop: 2 },

    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexShrink: 0 },
    activePill: { backgroundColor: '#DCFCE7' },
    activePillText: { fontSize: 11, fontWeight: '800', color: '#166534' },
    resignedPill: { backgroundColor: '#FEF3C7' },
    resignedPillText: { fontSize: 11, fontWeight: '800', color: '#92400E' },
    statusPillText: { fontSize: 11, fontWeight: '800' },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },

    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    locationText: { fontSize: 12.5, color: '#64748B', marginLeft: 6, flex: 1 },

    cardDivider: { height: 1, backgroundColor: '#EEF2F7', marginTop: 12, marginBottom: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    recordIdWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    recordIdText: { fontSize: 11, color: '#94A3B8', marginLeft: 5, fontWeight: '600' },
    terminateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    terminateBtnText: { fontSize: 12, fontWeight: '800', color: '#C53030', marginLeft: 5 },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  headerContainer: { paddingTop: 4 },

  topBar: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  circleBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  centeredIcon: {
    alignSelf: 'center',
    textAlign: 'center'
  },
  headerRightActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  editPillText: { color: '#3182CE', fontSize: 13, fontWeight: '600' },
  logoutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4
  },
  logoutPillText: { color: '#E53E3E', fontSize: 13, fontWeight: '600' },

  profileSection: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  greetingText: { fontSize: 11, fontWeight: '800', color: '#3182CE', letterSpacing: 0.5 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginTop: 2 },
  profilePic: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#3182CE' },

  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    gap: 8
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 8, color: '#4A5568', fontSize: 13 },

  gridContainer: {
    flexDirection: 'row',
    justify: 'space-between',
    marginBottom: 20,
    gap: 8
  },
  gridCard: {
    backgroundColor: '#FFF',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    position: 'relative'
  },
  gridIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  gridCardText: { fontSize: 11, fontWeight: '600', color: '#2D3748', textAlign: 'center' },
  orangeNotificationDot: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DD6B20'
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 22,
    padding: 4,
    marginBottom: 20
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18
  },
  segmentBtnActive: { backgroundColor: '#FFF' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#718096' },
  segmentTextActive: { color: '#3182CE', fontWeight: 'bold' },

  overviewCardsRow: {
    flexDirection: 'row',
    justify: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 16
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
    position: 'relative'
  },
  overviewIconBgBlue: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF8FF',
    justify: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  overviewIconBgOrange: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFAF0',
    justify: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  overviewCardTextCol: { flex: 1 },
  overviewCardLabel: { fontSize: 11, color: '#718096', fontWeight: '600' },
  overviewCardNum: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginTop: 2 },
  liveTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    top: 12,
    right: 10
  },
  liveTagText: { fontSize: 10, color: '#3182CE', fontWeight: 'bold' },
  pendingTag: {
    backgroundColor: '#FFFAF0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    position: 'absolute',
    top: 12,
    right: 10
  },
  pendingTagText: { fontSize: 10, color: '#DD6B20', fontWeight: 'bold' },

  subHeaderRow: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  subHeaderText: { fontSize: 12, color: '#718096', fontWeight: '500' },
  filterText: { fontSize: 12, color: '#3182CE', fontWeight: '600' },

  emptyListText: { textAlign: 'center', marginTop: 24, fontStyle: 'italic', color: '#A0AEC0', fontSize: 13 }
});

export default UserDashboard;