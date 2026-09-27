// import React, { useState, useEffect, useRef } from 'react';
// import {
//     StyleSheet,
//     View,
//     Text,
//     TouchableOpacity,
//     Image,
//     SafeAreaView,
//     StatusBar,
//     Dimensions,
//     ActivityIndicator
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Geolocation from '@react-native-community/geolocation';
// import { SERVER_BASE, API_DASHBOARD } from '../../config';
// import NotificationHelper from '../Notification/NotificationHelper';

// const { width, height } = Dimensions.get('window');

// // Build the full-page Leaflet HTML with OSM tiles
// const getLeafletHTML = (lat, lng, workers, role) => {
//     const workersJson = JSON.stringify(workers || []);
//     const markerTitle = role === 'Worker' ? 'Your Service Location' : 'Your Location';
//     const markerPopup = role === 'Worker' ? 'Your Service Location<br><small>Drag to adjust</small>' : 'Your Location<br><small>Drag to adjust</small>';

//     return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
//   <title>OSM Map</title>
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//   <style>
//     * { margin: 0; padding: 0; box-sizing: border-box; }
//     html, body, #map { width: 100%; height: 100%; }
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//     var map = L.map('map', { zoomControl: true, attributionControl: true })
//                .setView([${lat}, ${lng}], 15);

//     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       maxZoom: 19,
//       attribution: '© OpenStreetMap contributors'
//     }).addTo(map);

//     // Primary User marker (blue, movable)
//     var userIcon = L.divIcon({
//       html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
//       iconSize: [18, 18],
//       iconAnchor: [9, 9],
//       className: ''
//     });

//     var userMarker = L.marker([${lat}, ${lng}], {
//       icon: userIcon,
//       draggable: true,
//       title: '${markerTitle}'
//     }).addTo(map).bindPopup('${markerPopup}');

//     // Notify RN whenever marker moves
//     function sendPosition(lat, lng) {
//       window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'position', lat: lat, lng: lng }));
//     }

//     userMarker.on('dragend', function(e) {
//       var pos = e.target.getLatLng();
//       sendPosition(pos.lat, pos.lng);
//     });

//     // Tap on map moves the marker
//     map.on('click', function(e) {
//       userMarker.setLatLng(e.latlng);
//       sendPosition(e.latlng.lat, e.latlng.lng);
//     });

//     // Worker markers (orange) - shown if array populated
//     var workers = ${workersJson};
//     var workerIcon = L.divIcon({
//       html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
//       iconSize: [16, 16],
//       iconAnchor: [8, 8],
//       className: ''
//     });

//     workers.forEach(function(w) {
//       var wLat = parseFloat(w.latitude);
//       var wLng = parseFloat(w.longitude);
//       if (!isNaN(wLat) && !isNaN(wLng)) {
//         L.marker([wLat, wLng], { icon: workerIcon })
//           .addTo(map)
//           .bindPopup('<b>' + (w.name || 'Worker') + '</b><br>' + (w.role || 'Service Worker'));
//       }
//     });
//   </script>
// </body>
// </html>
// `;
// };

// const MapScreen = ({ navigation, route }) => {
//     const { latitude, longitude, workers = [], requireLocationSave, userRole: paramUserRole, workerId: paramWorkerId } = route.params || {};

//     const webViewRef = useRef(null);
//     const [userRole, setUserRole] = useState(paramUserRole || 'Client');
//     const [clientPosition, setClientPosition] = useState(
//         (latitude && longitude && !isNaN(parseFloat(latitude)))
//             ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
//             : null
//     );
//     const [isSaving, setIsSaving] = useState(false);
//     const [isLoadingLocation, setIsLoadingLocation] = useState(!clientPosition);
//     const [mapHtml, setMapHtml] = useState(null);

//     useEffect(() => {
//         const initializeMap = async () => {
//             // Determine active user role from params or storage
//             let activeRole = paramUserRole;
//             if (!activeRole) {
//                 activeRole = (await AsyncStorage.getItem('userRole')) || 'Client';
//             }
//             setUserRole(activeRole);

//             if (clientPosition) {
//                 setMapHtml(getLeafletHTML(clientPosition.latitude, clientPosition.longitude, workers, activeRole));
//                 setIsLoadingLocation(false);
//             } else {
//                 Geolocation.getCurrentPosition(
//                     (pos) => {
//                         const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
//                         setClientPosition(coords);
//                         setMapHtml(getLeafletHTML(coords.latitude, coords.longitude, workers, activeRole));
//                         setIsLoadingLocation(false);
//                     },
//                     () => {
//                         const fallback = { latitude: 33.6844, longitude: 73.0479 };
//                         setClientPosition(fallback);
//                         setMapHtml(getLeafletHTML(fallback.latitude, fallback.longitude, workers, activeRole));
//                         setIsLoadingLocation(false);
//                     },
//                     { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
//                 );
//             }
//         };

//         initializeMap();
//     }, []);

//     // Receive messages from the Leaflet WebView
//     const handleWebViewMessage = (event) => {
//         try {
//             const data = JSON.parse(event.nativeEvent.data);
//             if (data.type === 'position') {
//                 setClientPosition({ latitude: data.lat, longitude: data.lng });
//             }
//         } catch (e) {
//             console.warn('WebView message parse error:', e);
//         }
//     };

//     const saveLocation = async () => {
//         if (!clientPosition) return;
//         setIsSaving(true);

//         try {
//             const token = await AsyncStorage.getItem('userToken');
//             if (!token) {
//                 NotificationHelper.showError('Session expired. Please login again.');
//                 setIsSaving(false);
//                 return;
//             }

//             if (userRole === 'Worker') {
//                 const storedWorkerId = await AsyncStorage.getItem('workerId');
//                 const targetWorkerId = paramWorkerId || storedWorkerId;

//                 if (!targetWorkerId) {
//                     NotificationHelper.showError('Worker ID missing. Please log in again.');
//                     setIsSaving(false);
//                     return;
//                 }
//                 const endpoint = `${API_DASHBOARD}/UpdateWorkerLocation`;

//                 const payload = {
//                     workerId: parseInt(targetWorkerId, 10),
//                     latitude: parseFloat(clientPosition.latitude),
//                     longitude: parseFloat(clientPosition.longitude)
//                 };

//                 console.log("Sending Location Payload:", payload, "to Endpoint:", endpoint);

//                 // MUST be PUT method to match [HttpPut("UpdateWorkerLocation")]
//                 const response = await fetch(endpoint, {
//                     method: 'PUT',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     },
//                     body: JSON.stringify(payload)
//                 });

//                 if (response.ok) {
//                     await AsyncStorage.setItem('workerLatitude', clientPosition.latitude.toString());
//                     await AsyncStorage.setItem('workerLongitude', clientPosition.longitude.toString());
//                     NotificationHelper.showSuccess('Worker location saved successfully!');

//                     if (requireLocationSave) {
//                         navigation.replace('WorkerDashboardScreen');
//                     } else {
//                         navigation.goBack();
//                     }
//                 } else {
//                     const errText = await response.text();
//                     console.error(`Update Location Failed [${response.status}]:`, errText);
//                     NotificationHelper.showError(`Failed (${response.status}): ${errText || 'Server error'}`);
//                 }
//             }
//         } catch (error) {
//             console.error('saveLocation error:', error);
//             NotificationHelper.showError('Network error while saving location.');
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     if (isLoadingLocation || !mapHtml) {
//         return (
//             <SafeAreaView style={styles.loadingContainer}>
//                 <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />
//                 <ActivityIndicator size="large" color="#1E64D3" />
//                 <Text style={styles.loadingText}>Detecting your location...</Text>
//             </SafeAreaView>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.container}>
//             <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

//             {/* Leaflet Map via WebView */}
//             <WebView
//                 ref={webViewRef}
//                 style={styles.map}
//                 source={{ html: mapHtml }}
//                 originWhitelist={['*']}
//                 onMessage={handleWebViewMessage}
//                 javaScriptEnabled={true}
//                 domStorageEnabled={true}
//                 mixedContentMode="always"
//                 startInLoadingState={true}
//                 renderLoading={() => (
//                     <View style={styles.webViewLoader}>
//                         <ActivityIndicator size="large" color="#1E64D3" />
//                     </View>
//                 )}
//             />

//             {/* Floating Header */}
//             <View style={styles.header}>
//                 <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
//                     <Icon name="arrow-left" size={24} color="#1A1C1E" />
//                 </TouchableOpacity>
//                 <View style={styles.headerTitleContainer}>
//                     <Text style={styles.headerTitle}>
//                         Set Your Work Location
//                     </Text>
//                     <Text style={styles.headerSubtitle}>
//                         {userRole === 'Worker' ? 'Pin your service location' : 'let the worker find you'}
//                     </Text>
//                 </View>
//             </View>

//             {/* Save Location Button Area */}
//             {clientPosition && (
//                 <View style={styles.saveBtnContainer}>
//                     <View style={styles.coordsChip}>
//                         <Icon name="crosshairs-gps" size={13} color="#1E64D3" />
//                         <Text style={styles.coordsText}>
//                             {clientPosition.latitude.toFixed(5)}, {clientPosition.longitude.toFixed(5)}
//                         </Text>
//                     </View>
//                     <TouchableOpacity style={styles.saveLocationBtn} onPress={saveLocation} disabled={isSaving}>
//                         {isSaving ? (
//                             <ActivityIndicator color="#FFF" />
//                         ) : (
//                             <>
//                                 <Icon name="content-save-check" size={20} color="#FFF" />
//                                 <Text style={styles.saveLocationBtnText}>Save Location</Text>
//                             </>
//                         )}
//                     </TouchableOpacity>
//                     <Text style={styles.hintText}>Tap the map or drag the blue dot to adjust</Text>
//                 </View>
//             )}
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#FFF' },
//     map: { flex: 1 },
//     loadingContainer: {
//         flex: 1,
//         backgroundColor: '#F7F9FC',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     loadingText: { fontSize: 15, color: '#5F6368', marginTop: 14 },
//     webViewLoader: {
//         position: 'absolute',
//         top: 0, left: 0, right: 0, bottom: 0,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#F7F9FC',
//     },

//     // Floating header
//     header: {
//         position: 'absolute',
//         top: 20,
//         left: 16,
//         right: 16,
//         zIndex: 10,
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#FFF',
//         borderRadius: 16,
//         paddingHorizontal: 15,
//         paddingVertical: 10,
//         elevation: 6,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 3 },
//         shadowOpacity: 0.15,
//         shadowRadius: 6,
//     },
//     backBtn: { padding: 5, marginRight: 10 },
//     headerTitleContainer: { flex: 1 },
//     headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
//     headerSubtitle: { fontSize: 12, color: '#666' },

//     // Save button area at bottom
//     saveBtnContainer: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: '#FFF',
//         paddingHorizontal: 20,
//         paddingTop: 14,
//         paddingBottom: 20,
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         elevation: 12,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -3 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         alignItems: 'center',
//         gap: 10,
//     },
//     coordsChip: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#EEF4FF',
//         paddingVertical: 5,
//         paddingHorizontal: 12,
//         borderRadius: 20,
//         gap: 5,
//     },
//     coordsText: { fontSize: 12, color: '#1E64D3', fontWeight: '600' },
//     saveLocationBtn: {
//         width: '100%',
//         backgroundColor: '#00B14F',
//         borderRadius: 16,
//         paddingVertical: 15,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         elevation: 4,
//         shadowColor: '#00B14F',
//         shadowOffset: { width: 0, height: 3 },
//         shadowOpacity: 0.3,
//         shadowRadius: 6,
//         gap: 10,
//     },
//     saveLocationBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
//     hintText: { fontSize: 12, color: '#999', textAlign: 'center' },
// });

// export default MapScreen;

import React, { useState, useEffect, useRef } from 'react';

import { WebView } from '@/web/WebView';
import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import Geolocation from '@/web/Geolocation';
import { SERVER_BASE, API_DASHBOARD } from '../../config';
import NotificationHelper from '../Notification/NotificationHelper';
import { Dimensions, Spinner, StyleSheet, press, sx } from '@/web';


const { width, height } = Dimensions.get('window');

// Fallback map centre (Rawalpindi) used when the device has no GPS fix yet, so
// the user can always drag/tap a pin and finish signup.
const FALLBACK_CENTER = { latitude: 33.6844, longitude: 73.0479 };

// Build the full-page Leaflet HTML with OSM tiles
const getLeafletHTML = (lat, lng, workers, role) => {
    const workersJson = JSON.stringify(workers || []);
    const markerTitle = role === 'Worker' ? 'Your Service Location' : 'Your Location';
    const markerPopup = role === 'Worker' ? 'Your Service Location<br><small>Drag to adjust</small>' : 'Your Location<br><small>Drag to adjust</small>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>OSM Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true })
               .setView([${lat}, ${lng}], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Primary User marker (blue, movable)
    var userIcon = L.divIcon({
      html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: ''
    });

    var userMarker = L.marker([${lat}, ${lng}], {
      icon: userIcon,
      draggable: true,
      title: '${markerTitle}'
    }).addTo(map).bindPopup('${markerPopup}');

    // Notify RN whenever marker moves
    function sendPosition(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'position', lat: lat, lng: lng }));
    }

    userMarker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendPosition(pos.lat, pos.lng);
    });

    // Tap on map moves the marker
    map.on('click', function(e) {
      userMarker.setLatLng(e.latlng);
      sendPosition(e.latlng.lat, e.latlng.lng);
    });

    // Worker markers (orange) - shown if array populated
    var workers = ${workersJson};
    var workerIcon = L.divIcon({
      html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: ''
    });

    workers.forEach(function(w) {
      var wLat = parseFloat(w.latitude);
      var wLng = parseFloat(w.longitude);
      if (!isNaN(wLat) && !isNaN(wLng)) {
        L.marker([wLat, wLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup('<b>' + (w.name || 'Worker') + '</b><br>' + (w.role || 'Service Worker'));
      }
    });
  </script>
</body>
</html>
`;
};

const MapScreen = ({ navigation, route }) => {
    const {
        latitude,
        longitude,
        workers = [],
        requireLocationSave,
        userRole: paramUserRole,
        workerId: paramWorkerId,
        // NEW: signup mode — pick a pin, then hand it back to SignupScreen.
        pickLocationForSignup = false,
        signupDraft = null,
    } = route.params || {};

    const webViewRef = useRef(null);
    const [userRole, setUserRole] = useState(paramUserRole || 'Client');
    const [clientPosition, setClientPosition] = useState(
        (latitude && longitude && !isNaN(parseFloat(latitude)))
            ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
            : null
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(!clientPosition);
    const [mapHtml, setMapHtml] = useState(null);

    useEffect(() => {
        const initializeMap = async () => {
            // Determine active user role from params or storage
            let activeRole = paramUserRole;
            if (!activeRole) {
                activeRole = (await AsyncStorage.getItem('userRole')) || 'Client';
            }
            setUserRole(activeRole);

            if (clientPosition) {
                setMapHtml(getLeafletHTML(clientPosition.latitude, clientPosition.longitude, workers, activeRole));
                setIsLoadingLocation(false);
            } else {
                Geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                        setClientPosition(coords);
                        setMapHtml(getLeafletHTML(coords.latitude, coords.longitude, workers, activeRole));
                        setIsLoadingLocation(false);
                    },
                    () => {
                        // No GPS fix (or permission denied): still show the map so
                        // the user can drop the pin manually — mandatory location
                        // must never be a dead end.
                        const fallback = { ...FALLBACK_CENTER };
                        setClientPosition(fallback);
                        setMapHtml(getLeafletHTML(fallback.latitude, fallback.longitude, workers, activeRole));
                        setIsLoadingLocation(false);
                    },
                    { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
                );
            }
        };

        initializeMap();
    }, []);

    // Receive messages from the Leaflet WebView
    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'position') {
                setClientPosition({ latitude: data.lat, longitude: data.lng });
            }
        } catch (e) {
            console.warn('WebView message parse error:', e);
        }
    };

    const currentCoords = () => {
        if (!clientPosition) return null;
        const lat = parseFloat(clientPosition.latitude);
        const lng = parseFloat(clientPosition.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { latitude: lat, longitude: lng };
    };

    const saveLocation = async () => {
        const coords = currentCoords();
        if (!coords) return;

        // ─── MODE 1: SIGNUP PICKER (NEW) ──────────────────────────────────────
        // No API call and no token here — the account does not exist yet.
        // We just hand the pin (plus the form snapshot) back to SignupScreen,
        // which is the screen that owns the signup API call.
        if (pickLocationForSignup) {
            navigation.navigate('Signup', {
                ...(signupDraft || {}),
                signupDraft,
                signupLocation: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    pickedAt: Date.now(),
                },
            });
            return;
        }
        // ──────────────────────────────────────────────────────────────────────

        setIsSaving(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                NotificationHelper.showError('Session expired. Please login again.');
                setIsSaving(false);
                return;
            }

            if (userRole === 'Worker') {
                const storedWorkerId = await AsyncStorage.getItem('workerId');
                const targetWorkerId = paramWorkerId || storedWorkerId;

                if (!targetWorkerId) {
                    NotificationHelper.showError('Worker ID missing. Please log in again.');
                    setIsSaving(false);
                    return;
                }
                const endpoint = `${API_DASHBOARD}/UpdateWorkerLocation`;

                const payload = {
                    workerId: parseInt(targetWorkerId, 10),
                    latitude: coords.latitude,
                    longitude: coords.longitude
                };

                console.log("Sending Location Payload:", payload, "to Endpoint:", endpoint);

                // MUST be PUT method to match [HttpPut("UpdateWorkerLocation")]
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    await AsyncStorage.setItem('workerLatitude', coords.latitude.toString());
                    await AsyncStorage.setItem('workerLongitude', coords.longitude.toString());
                    NotificationHelper.showSuccess('Worker location saved successfully!');

                    if (requireLocationSave) {
                        navigation.replace('WorkerDashboardScreen');
                    } else {
                        navigation.goBack();
                    }
                } else {
                    const errText = await response.text();
                    console.error(`Update Location Failed [${response.status}]:`, errText);
                    NotificationHelper.showError(`Failed (${response.status}): ${errText || 'Server error'}`);
                }
            } else {
                // ─── CLIENT BRANCH (FIXED) ───────────────────────────────────
                // Previously only the Worker branch existed, so a Client tapping
                // "Save Location" silently did nothing and stayed stuck here.
                const storedClientId = await AsyncStorage.getItem('clientId');

                if (!storedClientId) {
                    NotificationHelper.showError('Client ID missing. Please log in again.');
                    setIsSaving(false);
                    return;
                }

                const endpoint = `${API_DASHBOARD}/update-location`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ClientId: parseInt(storedClientId, 10),
                        Latitude: coords.latitude,
                        Longitude: coords.longitude
                    })
                });

                if (response.ok) {
                    await AsyncStorage.setItem('clientLatitude', coords.latitude.toString());
                    await AsyncStorage.setItem('clientLongitude', coords.longitude.toString());
                    NotificationHelper.showSuccess('Your location has been saved!');

                    if (requireLocationSave) {
                        navigation.replace('FindServiceScreen');
                    } else {
                        navigation.goBack();
                    }
                } else {
                    const errText = await response.text();
                    console.error(`Update Location Failed [${response.status}]:`, errText);
                    NotificationHelper.showError(`Failed (${response.status}): ${errText || 'Server error'}`);
                }
            }
        } catch (error) {
            console.error('saveLocation error:', error);
            NotificationHelper.showError('Network error while saving location.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingLocation || !mapHtml) {
        return (
            <div className="v screen" style={sx(styles.loadingContainer)}>
                
                <Spinner size="large" color="#1E64D3" />
                <span className="t" style={sx(styles.loadingText)}>Detecting your location...</span>
            </div>
        );
    }

    // Text that adapts to the mode the screen was opened in
    const headerTitle = pickLocationForSignup
        ? (userRole === 'Worker' ? 'Set Your Work Location' : 'Set Your Location')
        : 'Set Your Work Location';

    const headerSubtitle = pickLocationForSignup
        ? (userRole === 'Worker'
            ? 'Pin the area where you provide service'
            : 'Pin the area where you need service')
        : (userRole === 'Worker' ? 'Pin your service location' : 'let the worker find you');

    const saveLabel = pickLocationForSignup ? 'Confirm Location' : 'Save Location';

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Leaflet Map via WebView */}
            <WebView
                ref={webViewRef}
                style={styles.map}
                source={{ html: mapHtml }}
                originWhitelist={['*']}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                startInLoadingState={true}
                renderLoading={() => (
                    <div className="v" style={sx(styles.webViewLoader)}>
                        <Spinner size="large" color="#1E64D3" />
                    </div>
                )}
            />

            {/* Floating Header */}
            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" style={sx(styles.backBtn)} onClick={press(() => navigation.goBack())}>
                    <Icon name="arrow-left" size={24} color="#1A1C1E" />
                </button>
                <div className="v" style={sx(styles.headerTitleContainer)}>
                    <span className="t" style={sx(styles.headerTitle)}>
                        {headerTitle}
                    </span>
                    <span className="t" style={sx(styles.headerSubtitle)}>
                        {headerSubtitle}
                    </span>
                </div>
            </div>

            {/* Save Location Button Area */}
            {clientPosition && (
                <div className="v" style={sx(styles.saveBtnContainer)}>
                    <div className="v" style={sx(styles.coordsChip)}>
                        <Icon name="crosshairs-gps" size={13} color="#1E64D3" />
                        <span className="t" style={sx(styles.coordsText)}>
                            {clientPosition.latitude.toFixed(5)}, {clientPosition.longitude.toFixed(5)}
                        </span>
                    </div>
                    <button className="v btn" type="button" style={sx(styles.saveLocationBtn)} onClick={press(saveLocation)} disabled={isSaving}>
                        {isSaving ? (
                            <Spinner color="#FFF" />
                        ) : (
                            <>
                                <Icon name={pickLocationForSignup ? "map-marker-check" : "content-save-check"} size={20} color="#FFF" />
                                <span className="t" style={sx(styles.saveLocationBtnText)}>{saveLabel}</span>
                            </>
                        )}
                    </button>
                    <span className="t" style={sx(styles.hintText)}>Tap the map or drag the blue dot to adjust</span>
                </div>
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { flex: 1 },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F7F9FC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { fontSize: 15, color: '#5F6368', marginTop: 14 },
    webViewLoader: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
    },

    // Floating header
    header: {
        position: 'absolute',
        top: 20,
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    backBtn: { padding: 5, marginRight: 10 },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    headerSubtitle: { fontSize: 12, color: '#666' },

    // Save button area at bottom
    saveBtnContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        alignItems: 'center',
        gap: 10,
    },
    coordsChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF4FF',
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 5,
    },
    coordsText: { fontSize: 12, color: '#1E64D3', fontWeight: '600' },
    saveLocationBtn: {
        width: '100%',
        backgroundColor: '#00B14F',
        borderRadius: 16,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#00B14F',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        gap: 10,
    },
    saveLocationBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    hintText: { fontSize: 12, color: '#999', textAlign: 'center' },
});

export default MapScreen;
