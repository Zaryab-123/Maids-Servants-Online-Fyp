import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import AsyncStorage from '@/web/AsyncStorage';
import { Spinner, StyleSheet, imgSrc, press, sx } from '@/web';




const ClientProfileScreen = ({ route, navigation }) => {
  const { clientId, id } = route.params || {};
  const targetClientId = clientId || id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (targetClientId) {
      fetchClientProfile();
    } else {
      setLoading(false);
    }
  }, [targetClientId]);

const fetchClientProfile = async () => {
  if (!targetClientId) {
    setLoading(false);
    return;
  }

  try {
    // Retrieve token from storage
    const token = await AsyncStorage.getItem('userToken'); // Replace 'userToken' with your exact storage key name

    const res = await fetch(`${API_DASHBOARD}/GetClientDetail/${targetClientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.error("Failed to fetch client profile:", res.status, errorData.message);
      Toast.show({
        type: 'error',
        text1: `Failed to fetch client profile: ${res.status} ${res.statusText}`
      });
      setProfile(null);
    }
  } catch (err) {
    console.error("Error fetching client profile:", err);
    setProfile(null);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="v" style={sx(styles.centerContainer)}>
        <Spinner size="large" color="#1E64D3" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="v" style={sx(styles.centerContainer)}>
        <span className="t" style={sx(styles.emptyText)}>Client profile unavailable.</span>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? (profile.reviews || []) : (profile.reviews?.slice(0, 2) || []);

  return (
    <div className="v screen" style={sx(styles.container)}>
      {/* Header Bar */}
      <div className="v" style={sx(styles.headerBar)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
          <Icon name="arrow-left" size={24} color="#111" />
        </button>
        <span className="t" style={sx(styles.headerTitle)}>Client Profile</span>
        <div className="v" style={sx({ width: 24 })} />
      </div>

      <div className="v scroll" ><div className="v scroll-content card-grid" style={sx({ padding: 20 })}>
        {/* Read-Only Profile Card */}
        <div className="v" style={sx(styles.profileHeader)}>
          <img className="img" alt=""
            src={imgSrc({ 
              uri: profile.picture?.startsWith('/') 
                ? `${SERVER_BASE}${profile.picture}` 
                : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' 
            })}
            style={sx(styles.avatar)}
          />
          <span className="t" style={sx(styles.name)}>{profile.name}</span>
          <span className="t" style={sx(styles.location)}>
            <Icon name="map-marker" size={14} color="#666" /> {profile.address || 'Location Not Specified'}
          </span>

          {/* Average Rating Banner */}
          <div className="v" style={sx(styles.ratingBadge)}>
            <Icon name="star" size={18} color="#FFD700" />
            <span className="t" style={sx(styles.ratingText)}>
              {profile.rating > 0 ? profile.rating.toFixed(1) : 'New'} 
              <span className="t" style={sx(styles.reviewCountText)}> ({profile.reviewCount || 0} reviews)</span>
            </span>
          </div>
        </div>

        <div className="v" style={sx(styles.divider)} />

        {/* Worker Reviews Section */}
        <span className="t" style={sx(styles.sectionTitle)}>Reviews from Workers</span>

        {displayedReviews.length === 0 ? (
          <span className="t" style={sx(styles.emptyText)}>No reviews have been left for this client yet.</span>
        ) : (
          displayedReviews.map((item) => (
            <div className="v grid-item" key={item.id} style={sx(styles.reviewCard)}>
              <div className="v" style={sx(styles.reviewerRow)}>
                <div className="v" style={sx({ flexDirection: 'row', alignItems: 'center' })}>
                  <img className="img" alt=""
                    src={imgSrc({ 
                      uri: item.reviewerImage?.startsWith('/') 
                        ? `${SERVER_BASE}${item.reviewerImage}` 
                        : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' 
                    })}
                    style={sx(styles.reviewerAvatar)}
                  />
                  <span className="t" style={sx(styles.reviewerName)}>{item.reviewerName}</span>
                </div>
                <div className="v" style={sx(styles.starRow)}>
                  <Icon name="star" size={14} color="#FFD700" />
                  <span className="t" style={sx(styles.singleRatingText)}>{item.rating}</span>
                </div>
              </div>
              <span className="t" style={sx(styles.comment)}>{item.comment}</span>
              <span className="t" style={sx(styles.date)}>{item.date}</span>
              {item.workedPeriod ? (
                <div className="v" style={sx(styles.workedRow)}>
                  <Icon name="briefcase-outline" size={12} color="#1E75EB" />
                  <span className="t" style={sx(styles.workedPeriodText)}>Worked: {item.workedPeriod}</span>
                </div>
              ) : null}
            </div>
          ))
        )}

        {profile.reviews && profile.reviews.length > 2 && !showAllReviews && (
          <button className="v btn" type="button" 
            style={sx(styles.viewAllBtn)} 
            onClick={press(() => setShowAllReviews(true))}
          >
            <span className="t" style={sx(styles.viewAllText)}>View All ({profile.reviews.length}) Reviews</span>
          </button>
        )}
      </div></div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE'
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111' },
  backBtn: { padding: 4 },
  profileHeader: { alignItems: 'center', marginVertical: 10 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF9E6', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: 10 
  },
  ratingText: { marginLeft: 6, fontSize: 15, fontWeight: '700', color: '#111' },
  reviewCountText: { fontSize: 13, fontWeight: '400', color: '#666' },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  reviewCard: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#EEEEEE' 
  },
  reviewerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  reviewerName: { fontWeight: '600', fontSize: 14, color: '#222' },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  singleRatingText: { fontSize: 13, fontWeight: '700', marginLeft: 3, color: '#333' },
  comment: { color: '#444', marginVertical: 6, fontSize: 13, lineHeight: 18 },
  date: { color: '#999', fontSize: 11 },
  workedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  workedPeriodText: { fontSize: 11, color: '#1E75EB', fontWeight: '600', marginLeft: 4 },
  emptyText: { fontStyle: 'italic', color: '#888', textAlign: 'center', marginVertical: 10 },
  viewAllBtn: { marginTop: 8, padding: 12, alignItems: 'center', backgroundColor: '#E8F0FE', borderRadius: 8 },
  viewAllText: { color: '#1E64D3', fontWeight: '600' }
});

export default ClientProfileScreen;