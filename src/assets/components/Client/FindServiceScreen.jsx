import React, { useState, useEffect, useCallback } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { useFocusEffect } from '@/web/navigation';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD, SERVER_BASE } from '../../config';
import { ListView, Spinner, StyleSheet, changeText, imgSrc, press, sx } from '@/web';


const API_BASE = API_DASHBOARD;

const FindServiceScreen = ({ navigation, route }) => {
    const [search, setSearch] = useState('');
    const [categoriesList, setCategoriesList] = useState(['All']);
    const [categoryLookup, setCategoryLookup] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [workers, setWorkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clientName, setClientName] = useState('Client');
    const [clientPicture, setClientPicture] = useState('');

    // Unified Advanced Filters
    const [allFilters, setAllFilters] = useState({
        gender: '',
        city: '',
        categories: [],
        subSkills: {}
    });

    useEffect(() => {
        AsyncStorage.getItem('userName').then(n => { if (n) setClientName(n); });
        AsyncStorage.getItem('userPicture').then(p => { if (p) setClientPicture(p); });
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            console.log('🔄 Fetching categories from backend...');
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetFiltersData`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Categories fetched:', data.length, 'items -', data.map(c => c.categoryName).join(', '));
                const names = data.map(c => c.categoryName);
                setCategoriesList(['All', ...names]);
                const lookup = {};
                data.forEach(c => {
                    lookup[c.categoryId?.toString()] = c.categoryName;
                    lookup[c.categoryName] = c.categoryName;
                });
                setCategoryLookup(lookup);
            } else {
                console.log('❌ Failed to fetch categories - Status:', response.status);
            }
        } catch (error) {
            console.error("❌ Failed to fetch categories:", error.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (route.params?.appliedFilters) {
                setAllFilters(route.params.appliedFilters);
                navigation.setParams({ appliedFilters: undefined });
            }
        }, [route.params?.appliedFilters])
    );

    const getCategoryName = (selection) => {
        if (!selection) return '';
        const key = selection.toString();
        return categoryLookup[key] || key;
    };

    const fetchWorkers = useCallback(async (categoryTab, searchText, currentFilters) => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            let url = `${API_BASE}/GetWorkersForClient?`;

            if (searchText && searchText.trim()) {
                url += `search=${encodeURIComponent(searchText.trim())}&`;
            }

            const selectedCategoryNames = (currentFilters.categories || [])
                .map(getCategoryName)
                .filter(cat => cat && cat !== 'All');

            const combinedCategories = [...new Set(selectedCategoryNames)];
            if (categoryTab && categoryTab !== 'All' && !combinedCategories.includes(categoryTab)) {
                combinedCategories.push(categoryTab);
            }

            combinedCategories.forEach(cat => {
                url += `categories=${encodeURIComponent(cat)}&`;
            });

            if (currentFilters.gender && currentFilters.gender !== 'Both') {
                url += `gender=${encodeURIComponent(currentFilters.gender)}&`;
            }

            if (currentFilters.city) {
                url += `city=${encodeURIComponent(currentFilters.city)}&`;
            }

            Object.keys(currentFilters.subSkills).forEach(catName => {
                currentFilters.subSkills[catName].forEach(skill => {
                    url += `subSkills=${encodeURIComponent(skill)}&`;
                });
            });

            console.log('🔗 Worker API URL:', url.substring(0, 80) + '...');
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Workers fetched successfully:', data.length, 'workers');
                if (data.length > 0) {
                    console.log('📊 Sample worker:', { name: data[0].name, role: data[0].role, lat: data[0].latitude, lng: data[0].longitude });
                }
                setWorkers(data);
            } else if (response.status === 401) {
                console.log('❌ Unauthorized (401) - Token may be invalid');
                NotificationHelper.showError("Session Expired. Please login again.");
                navigation.replace('Login');
            } else {
                const errorText = await response.text();
                console.log('❌ Failed to fetch workers - Status:', response.status, '- Response:', errorText);
            }
        } catch (err) {
            console.error("❌ Network error fetching workers:", err.message);
        } finally {
            setIsLoading(false);
        }
    }, [navigation]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWorkers(selectedCategory, search, allFilters);
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedCategory, search, allFilters]);

    // Navigate to MapScreen
    const handleMapNavigation = async () => {
        try {
            const lat = await AsyncStorage.getItem('clientLatitude');
            const lng = await AsyncStorage.getItem('clientLongitude');
            console.log('🗺️  Map navigation - Coordinates:', { lat, lng });

            console.log('✅ Navigating to MapScreen with', workers.length, 'workers');
            navigation.navigate('MapScreen', { 
                latitude: lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null, 
                longitude: lng && !isNaN(parseFloat(lng)) ? parseFloat(lng) : null,
                workers 
            });
        } catch (error) {
            console.error("❌ Error fetching coordinates:", error);
            navigation.navigate('MapScreen', { workers });
        }
    };

    const extractCity = (address) => {
        if (!address || address === 'N/A') return 'N/A';
        const parts = address.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
    };

    const renderWorkerCard = ({ item }) => {
        const city = extractCity(item.city);
        
        const secondaryCategories = item.categories && item.categories.length > 1 
            ? item.categories.slice(1) 
            : [];

        return (
            <div className="v" style={sx(styles.card)}>
                <div className="v" style={sx(styles.cardContent)}>
                    <div className="v" style={sx(styles.imageColumn)}>
                        <img className="img" alt=""
                            src={imgSrc({
                                uri: item.picture && item.picture.startsWith('/')
                                    ? `${SERVER_BASE}${item.picture}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                            })}
                            style={sx(styles.workerImage)}
                        />
                        <div className="v" style={sx(styles.ratingBadge)}>
                            <Icon name="star" size={12} color="#FFD700" />
                            <span className="t" style={sx(styles.ratingText)}>{item.rating || "0.0"}</span>
                        </div>
                    </div>

                    <div className="v" style={sx(styles.mainInfo)}>
                        <div className="v" style={sx(styles.headerRow)}>
                            <span className="t" style={sx(styles.workerName, 1)} >{item.name}</span>
                            <span className="t" style={sx(styles.salaryText)}>{item.salary || 'N/A'}</span>
                        </div>

                        <span className="t" style={sx(styles.genderText)}>{item.gender || 'N/A'}</span>
                        <span className="t" style={sx(styles.roleLabel)}>{item.role}</span>

                        <div className="v" style={sx(styles.locationContainer)}>
                            <Icon name="map-marker-outline" size={14} color="#666" />
                            <span className="t" style={sx(styles.locationText, 1)} >
                                {city}
                            </span>
                        </div>

                        <div className="v" style={sx(styles.badgeRow)}>
                            <div className="v" style={sx([styles.skillBadge, { backgroundColor: item.availableStatus ? '#E8F0FE' : '#FFEBEE' }])}>
                                <span className="t" style={sx([styles.skillBadgeText, { color: item.availableStatus ? '#1E64D3' : '#D32F2F' }])}>
                                    {item.availableStatus ? 'Available' : 'Not Available'}
                                </span>
                            </div>

                            {item.isBlocked ? (
                                <div className="v" style={sx([styles.policeChip, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }])}>
                                    <Icon name="alert-octagon" size={12} color="#991B1B" />
                                    <span className="t" style={sx([styles.policeChipText, { color: '#991B1B' }])}>FIR Record</span>
                                </div>
                            ) : item.isFlagged ? (
                                <div className="v" style={sx([styles.policeChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }])}>
                                    <Icon name="alert" size={12} color="#92400E" />
                                    <span className="t" style={sx([styles.policeChipText, { color: '#92400E' }])}>Warned</span>
                                </div>
                            ) : null}

                            {secondaryCategories.map((cat, index) => (
                                <div className="v" key={index} style={sx([styles.skillBadge, { backgroundColor: '#F1F3F4' }])}>
                                    <span className="t" style={sx([styles.skillBadgeText, { color: '#5F6368' }])}>{cat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button className="v btn" type="button"
                    style={sx(styles.actionButton)}
                    onClick={press(() => navigation.navigate('WorkerDetailScreen', { workerId: item.id }))}
                >
                    <span className="t" style={sx(styles.actionButtonText)}>View Profile & Interview</span>
                    <Icon name="chevron-right" size={20} color="#FFF" />
                </button>
            </div>
        );
    };

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* Header */}
            <div className="v" style={sx(styles.header)}>
                <div className="v" style={sx({ flexDirection: 'row', alignItems: 'center', marginBottom: 5 })}>
                    <span className="t" style={sx(styles.welcomeText)}>Welcome, {clientName}</span>
                </div>
                <div className="v" style={sx({ flexDirection: 'row', justifyContent: 'space-between' })}>
                    <div className="v">
                        <span className="t" style={sx(styles.subHeading)}>FIND SERVICE</span>
                        <span className="t" style={sx(styles.questionText)}>What would you like to do?</span>
                    </div>
                    <button className="v btn" type="button"
                        style={sx(styles.profileContainer)}
                        onClick={press(() => navigation.navigate('UserDashboardScreen'))}
                    >
                        <img className="img" alt=""
                            src={imgSrc({
                                uri: clientPicture && clientPicture.startsWith('/')
                                    ? `${SERVER_BASE}${clientPicture}`
                                    : 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png'
                            })}
                            style={sx(styles.profilePic)}
                            onError={() => console.log('Client image failed:', `${SERVER_BASE}${clientPicture}`)}
                        />
                        <div className="v" style={sx(styles.profileBadge)}>
                            <Icon name="account" size={14} color="#000" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="v" style={sx(styles.searchContainer)}>
                <input className="input"
                    style={sx(styles.searchInput)}
                    placeholder="Search by Name"
                    value={(search) ?? ''}
                    onChange={changeText(setSearch)}
                />
                <Icon name="magnify" size={24} color="#333" style={styles.searchIcon} />
            </div>

            {/* Single-line Fitted Category Bar */}
            <div className="v" style={sx(styles.tabRow)}>
                {categoriesList.map((cat) => (
                    <button className="v btn" type="button"
                        key={cat}
                        style={sx([styles.tab, selectedCategory === cat && styles.activeTab])}
                        onClick={press(() => setSelectedCategory(cat))}
                    >
                        <span className="t" style={sx([styles.tabText, selectedCategory === cat && styles.activeTabText])}>{cat}</span>
                    </button>
                ))}
            </div>

            {/* Filter & Map Row */}
            <div className="v" style={sx(styles.filterRow)}>
                <button className="v btn" type="button"
                    style={sx(styles.filterBtn)}
                    onClick={press(() => navigation.navigate('FilterationScreen', { initialFilters: allFilters }))}
                >
                    <span className="t" style={sx(styles.filterBtnText)}>Filter</span>
                    <Icon name="format-list-bulleted" size={18} color="#666" />
                </button>
                <button className="v btn" type="button" 
                    style={sx(styles.filterBtn)}
                    onClick={press(handleMapNavigation)}
                >
                    <span className="t" style={sx(styles.filterBtnText)}>Map</span>
                    <Icon name="map-marker-radius-outline" size={18} color="#1E64D3" />
                </button>
            </div>

            <span className="t" style={sx(styles.resultsCount)}>{workers.length} Total Results</span>

            {/* Workers List */}
            {isLoading ? (
                <Spinner size="large" color="#1E64D3" style={{ marginTop: 50 }} />
            ) : (
                <ListView
                    data={workers}
                    keyExtractor={item => item.id}
                    renderItem={renderWorkerCard}
                    contentContainerStyle={styles.listContent}
                    
                    ListEmptyComponent={
                        <div className="v" style={sx(styles.emptyBox)}>
                            <Icon name="account-search-outline" size={60} color="#CCC" />
                            <span className="t" style={sx(styles.emptyText)}>No workers found</span>
                        </div>
                    }
                />
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, marginTop: 30, zIndex: 10 },
    welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#001F3F' },
    subHeading: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 2 },
    questionText: { fontSize: 13, color: '#666' },
    profileContainer: { position: 'relative' },
    profilePic: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#EEE' },
    profileBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEE', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#FFF', elevation: 2 },

    searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 12, borderRadius: 15, paddingHorizontal: 15, alignItems: 'center', borderWidth: 1, borderColor: '#DDD', elevation: 2 },
    searchInput: { flex: 1, height: 45 },
    searchIcon: { marginLeft: 10 },

    tabRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        marginBottom: 12, 
        alignItems: 'center' 
    },
    tab: { 
        flex: 1, 
        paddingVertical: 6, 
        paddingHorizontal: 2, 
        borderRadius: 16, 
        marginHorizontal: 3, 
        backgroundColor: '#F5F5F5', 
        borderWidth: 1, 
        borderColor: '#DDD', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    activeTab: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    tabText: { fontWeight: '600', color: '#333', fontSize: 11 },
    activeTabText: { color: '#FFF' },

    filterRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 5 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 30, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#DDD' },
    filterBtnText: { marginRight: 8, color: '#333', fontWeight: '500' },
    resultsCount: { alignSelf: 'flex-end', marginRight: 20, fontSize: 12, color: '#999', marginVertical: 8 },

    listContent: { paddingHorizontal: 20, paddingBottom: 30 },
    card: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' },

    cardContent: { flexDirection: 'row' },
    
    imageColumn: { width: 85, alignItems: 'center' },
    workerImage: { width: 85, height: 85, borderRadius: 20, backgroundColor: '#F8F9FA' },
    ratingBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFF', 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 12, 
        marginTop: -12, 
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 4,
        borderWidth: 0.5,
        borderColor: '#EEE'
    },
    ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 3, color: '#333' },

    mainInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    workerName: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', flex: 1, marginRight: 8 },
    salaryText: { fontSize: 15, fontWeight: '700', color: '#00B14F' },
    genderText: { fontSize: 14, fontWeight: '600', color: '#666', marginTop: 1 },
    roleLabel: { color: '#1A1C1E', fontSize: 13, fontWeight: '500', marginBottom: 4 },

    locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    locationText: { fontSize: 12, color: '#5F6368', marginLeft: 4 },

    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    skillBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    skillBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    policeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    policeChipText: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },

    actionButton: { backgroundColor: '#1E64D3', borderRadius: 16, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, elevation: 2 },
    actionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginRight: 4 },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});

export default FindServiceScreen;