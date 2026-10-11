import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD } from '../../config';
import { Dialog, ListView, ScrollView, Spinner, StyleSheet, press, sx } from '@/web';


const API_BASE = API_DASHBOARD;

const RECOMMENDED_CITIES = [
    'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 
    'Faisalabad', 'Peshawar', 'Multan', 'Quetta', 
    'Gujranwala', 'Sialkot'
];

const FilterationScreen = ({ navigation, route }) => {
    // States for dynamic data
    const [allCategories, setAllCategories] = useState([]);
    const [workerAddresses, setWorkerAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // States for various filters
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]); // Array of Category IDs or names
    const [selectedCity, setSelectedCity] = useState('');
    const [cityModalVisible, setCityModalVisible] = useState(false);

    // State for sub-categories (Multi-select)
    // Key is category name, value is array of sub-skill names
    const [subFilters, setSubFilters] = useState({});

    // Habits (multi-select, ids from dbo.Habits). Applied with AND logic on the
    // server: the worker must hold every habit ticked here.
    const [habitsCatalog, setHabitsCatalog] = useState([]);
    const [selectedHabitIds, setSelectedHabitIds] = useState([]);

    // Initial load of categories
    useEffect(() => {
        fetchFilterData();
        fetchWorkerAddresses();
        fetchHabits();
    }, []);

    const fetchWorkerAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetWorkerAddresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const addresses = await response.json();
                setWorkerAddresses(Array.isArray(addresses) ? addresses : []);
            }
        } catch (error) {
            console.error('Worker addresses load failed:', error?.message);
        }
    };

    const cityOptions = [...new Map(
        [...RECOMMENDED_CITIES, ...workerAddresses, selectedCity]
            .map(city => (city || '').trim())
            .filter(Boolean)
            .map(city => [city.toLocaleLowerCase(), city])
    ).values()];

    const fetchHabits = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetHabits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const list = await response.json();
                setHabitsCatalog(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error('Habits load failed:', error?.message);
        }
    };

    const toggleHabitFilter = (habitId) => {
        setSelectedHabitIds((prev) =>
            prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]
        );
    };

    // Sync initial filters when categories are loaded or when params change
    useEffect(() => {
        if (!isLoading && route.params?.initialFilters) {
            const { gender, city, categories, subSkills, habits } = route.params.initialFilters;
            setSelectedGender(gender || '');
            setSelectedCity(city || '');
            setSelectedHabitIds(Array.isArray(habits) ? habits : []);
            setSelectedSkills((categories || []).map(item => item?.toString ? item.toString() : item));

            if (subSkills) {
                const syncedSubFilters = {};
                Object.keys(subSkills).forEach(key => {
                    syncedSubFilters[key] = Array.isArray(subSkills[key]) ? [...subSkills[key]] : [];
                });
                setSubFilters(syncedSubFilters);
            }
        }
    }, [isLoading, route.params?.initialFilters]);

    const fetchFilterData = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/GetFiltersData`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAllCategories(data);
                
                // Initialize subFilters state format if not already set by initialFilters
                if (Object.keys(subFilters).length === 0) {
                    const initialSubFilters = {};
                    data.forEach(cat => {
                        initialSubFilters[cat.categoryName] = [];
                    });
                    setSubFilters(initialSubFilters);
                }
            } else {
                console.error("Failed to fetch filter data");
            }
        } catch (error) {
            console.error("Network error fetching filter data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // const toggleSkillSelection = (skillName) => {
    //     if (selectedSkills.includes(skillName)) {
    //         setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    //     } else {
    //         setSelectedSkills([...selectedSkills, skillName]);
    //     }
    // };

    const toggleSkillSelection = (categoryId) => {
        const id = categoryId?.toString();
        const categoryName = getCategoryLabel(id);
        const isSelected = selectedSkills.some(item => {
            const itemName = getCategoryLabel(item);
            return item === id || item === categoryName || itemName === categoryName;
        });

        if (isSelected) {
            setSelectedSkills(selectedSkills.filter(item => {
                const itemName = getCategoryLabel(item);
                return item !== id && item !== categoryName && itemName !== categoryName;
            }));
        } else {
            setSelectedSkills([...selectedSkills, id]);
        }
    };

    const isCategorySelected = (cat) => {
        const idString = cat.categoryId?.toString();
        return selectedSkills.some(item => {
            const itemName = getCategoryLabel(item);
            return item === idString || item === cat.categoryName || itemName === cat.categoryName;
        });
    };

    const getCategoryLabel = (selection) => {
        const match = allCategories.find(cat => cat.categoryId?.toString() === selection || cat.categoryName === selection);
        return match ? match.categoryName : selection;
    };

    const toggleSubFilter = (category, value) => {
        let current = subFilters[category] ? [...subFilters[category]] : [];
        if (current.includes(value)) {
            current = current.filter(item => item !== value);
        } else {
            current.push(value);
        }
        setSubFilters({ ...subFilters, [category]: current });
    };

    const handleApply = () => {
        navigation.navigate('FindServiceScreen', {
            appliedFilters: {
                gender: selectedGender,
                city: selectedCity,
                categories: selectedSkills,
                subSkills: subFilters,
                habits: selectedHabitIds
            }
        });
    };

    const handleReset = () => {
        setSelectedGender('');
        setSelectedSkills([]);
        setSelectedCity('');
        setSelectedHabitIds([]);
        const resetSubFilters = {};
        allCategories.forEach(cat => {
            resetSubFilters[cat.categoryName] = [];
        });
        setSubFilters(resetSubFilters);

        // Also update parent immediately if needed, or by passing back on goBack
        navigation.navigate('FindServiceScreen', {
            appliedFilters: {
                gender: '',
                city: '',
                categories: [],
                subSkills: resetSubFilters,
                habits: []
            }
        });
    };

    if (isLoading) {
        return (
            <div className="v" style={sx([styles.container, { justifyContent: 'center', alignItems: 'center' }])}>
                <Spinner size="large" color="#1E64D3" />
            </div>
        );
    }

    return (
        <div className="v screen" style={sx(styles.container)}>
            

            {/* City Selection Modal */}
            <Dialog
                animationType="slide"
                transparent={true}
                visible={cityModalVisible}
                onRequestClose={() => setCityModalVisible(false)}
            >
                <div className="v" style={sx(styles.modalOverlay)}>
                    <div className="v" style={sx(styles.modalContent)}>
                        <div className="v" style={sx(styles.modalHeader)}>
                            <span className="t" style={sx(styles.modalTitle)}>Select City or Worker Address</span>
                            <button className="v btn" type="button" onClick={press(() => setCityModalVisible(false))}>
                                <Icon name="close" size={24} color="#333" />
                            </button>
                        </div>
                        <ListView
                            data={cityOptions}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <button className="v btn" type="button" 
                                    style={sx(styles.cityItem)} 
                                    onClick={press(() => {
                                        setSelectedCity(item);
                                        setCityModalVisible(false);
                                    })}
                                >
                                    <span className="t" style={sx([styles.cityText, selectedCity === item && styles.activeCityText])}>{item}</span>
                                    {selectedCity === item && <Icon name="check" size={20} color="#1E64D3" />}
                                </button>
                            )}
                        />
                    </div>
                </div>
            </Dialog>

            {/* Header */}
            <div className="v" style={sx(styles.header)}>
                <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backCircle)}>
                    <Icon name="arrow-left" size={20} color="#666" />
                </button>
                <span className="t" style={sx(styles.headerTitle)}>FILTERATION</span>
            </div>

            <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>

                {/* Active Filter Tags at Top */}
                <div className="v" style={sx(styles.activeTagsRow)}>
                    {selectedGender ? <FilterTag label={selectedGender} onRemove={() => setSelectedGender('')} /> : null}
                    {selectedCity ? <FilterTag label={selectedCity} onRemove={() => setSelectedCity('')} /> : null}
                    {selectedSkills.map(s => (
                        <FilterTag key={`tag-${s}`} label={getCategoryLabel(s)} onRemove={() => toggleSkillSelection(s)} />
                    ))}
                </div>

                {/* Gender Selection */}
                <div className="v" style={sx(styles.sectionCard)}>
                    <div className="v" style={sx(styles.sectionHeader)}>
                        <Icon name="account-outline" size={22} color="#000" />
                        <span className="t" style={sx(styles.sectionTitle)}>GENDER</span>
                    </div>
                    <div className="v" style={sx(styles.buttonGroup)}>
                        {['Male', 'Female', 'Both'].map(g => (
                            <button className="v btn" type="button"
                                key={g}
                                onClick={press(() => setSelectedGender(g))}
                                style={sx([styles.choiceBtn, selectedGender === g && styles.activeBtn])}
                            >
                                <span className="t" style={sx([styles.choiceText, selectedGender === g && styles.activeText])}>{g}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dynamic Skills Selection (Categories) */}
                <div className="v" style={sx(styles.sectionCard)}>
                    <div className="v" style={sx(styles.sectionHeader)}>
                        <Icon name="account-group-outline" size={22} color="#000" />
                        <span className="t" style={sx(styles.sectionTitle)}>SKILLS</span>
                    </div>
                    <div className="v" style={sx(styles.buttonGroup)}>
                        <ScrollView horizontal >
                            {/* {allCategories.map(cat => (
                                <TouchableOpacity
                                    key={cat.categoryId}
                                    onPress={() => toggleSkillSelection(cat.categoryName)}
                                    style={[styles.choiceBtn, { paddingHorizontal: 20, minWidth: 100 }, selectedSkills.includes(cat.categoryName) && styles.activeBtn]}
                                >
                                    <Text style={[styles.choiceText, selectedSkills.includes(cat.categoryName) && styles.activeText]}>{cat.categoryName}</Text>
                                </TouchableOpacity>
                            ))} */}
                            {allCategories.map(cat => (
                                <button className="v btn" type="button"
                                    key={cat.categoryId}
                                    onClick={press(() => toggleSkillSelection(cat.categoryId))}
                                    style={sx([
                                        styles.choiceBtn,
                                        { paddingHorizontal: 20, minWidth: 100 },
                                        isCategorySelected(cat) && styles.activeBtn
                                    ])}
                                >
                                    <span className="t" style={sx([styles.choiceText, isCategorySelected(cat) && styles.activeText])}>
                                        {cat.categoryName}
                                    </span>
                                </button>
                            ))}
                        </ScrollView>
                    </div>
                </div>

                {/* Location Selection */}
                <div className="v" style={sx(styles.sectionCard)}>
                    <div className="v" style={sx(styles.sectionHeader)}>
                        <Icon name="map-marker-outline" size={22} color="#000" />
                        <span className="t" style={sx(styles.sectionTitle)}>CITY</span>
                    </div>
                    <button className="v btn" type="button" 
                        style={sx(styles.dropdown)}
                        onClick={press(() => setCityModalVisible(true))}
                    >
                        <span className="t" style={sx([styles.dropdownText, !selectedCity && { color: '#999' }])}>
                            {selectedCity || 'Select City or Worker Address'}
                        </span>
                        <Icon name="chevron-down" size={24} color="#000" />
                    </button>
                </div>

                {/* Habits Section — the worker must hold every habit ticked here */}
                {habitsCatalog.length > 0 && (
                    <div className="v" style={sx(styles.sectionCard)}>
                        <div className="v" style={sx(styles.sectionHeader)}>
                            <Icon name="clipboard-check-outline" size={22} color="#000" />
                            <span className="t" style={sx(styles.sectionTitle)}>HABITS</span>
                        </div>

                        <div className="v" style={sx(styles.habitsWrap)}>
                            {habitsCatalog.map((habit) => {
                                const habitId = habit.habitId ?? habit.id;
                                const isActive = selectedHabitIds.includes(habitId);
                                return (
                                    <button className="v btn" type="button"
                                        key={habitId}
                                        style={sx([styles.habitChip, isActive && styles.habitChipActive])}
                                        onClick={press(() => toggleHabitFilter(habitId))}
                                        
                                    >
                                        <Icon
                                            name={isActive ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                            size={16}
                                            color={isActive ? '#FFF' : '#94A3B8'}
                                        />
                                        <span className="t" style={sx([styles.habitChipText, isActive && styles.habitChipTextActive])}>
                                            {habit.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedHabitIds.length > 0 && (
                            <span className="t" style={sx(styles.habitsNote)}>
                                Workers must match all {selectedHabitIds.length} selected habit
                                {selectedHabitIds.length > 1 ? 's' : ''}.
                            </span>
                        )}
                    </div>
                )}

                {/* Sub-Category Section (Dynamic) */}
                {selectedSkills.length > 0 && (
                    <div className="v" style={sx(styles.subCategoryCard)}>
                        <div className="v" style={sx(styles.sectionHeader)}>
                            <Icon name="reorder-horizontal" size={20} color="#000" />
                            <span className="t" style={sx(styles.sectionTitle)}>Sub-Category</span>
                        </div>

                        {allCategories
                            .filter(cat => isCategorySelected(cat))
                            .map(cat => (
                                <SubSection
                                    key={`sub-${cat.categoryId}`}
                                    title={cat.categoryName}
                                    options={cat.skills}
                                    selected={subFilters[cat.categoryName] || []}
                                    onToggle={(val) => toggleSubFilter(cat.categoryName, val)}
                                />
                            ))}
                    </div>
                )}
            </div></div>

            {/* Footer Buttons */}
            <div className="v" style={sx(styles.footer)}>
                <button className="v btn" type="button" style={sx(styles.resetBtn)} onClick={press(handleReset)}>
                    <span className="t" style={sx(styles.footerBtnText)}>Reset</span>
                </button>
                <button className="v btn" type="button" style={sx(styles.applyBtn)} onClick={press(handleApply)}>
                    <span className="t" style={sx(styles.footerBtnText)}>Apply</span>
                </button>
            </div>
        </div>
    );
};

// Helper Components
const FilterTag = ({ label, onRemove }) => (
    <div className="v" style={sx(styles.tag)}>
        <span className="t" style={sx(styles.tagText)}>{label}</span>
        <button className="v btn" type="button" onClick={press(onRemove)}>
            <Icon name="close" size={16} color="#000" style={{ marginLeft: 5 }} />
        </button>
    </div>
);

const SubSection = ({ title, options, selected, onToggle, disabled }) => (
    <div className="v" style={sx(styles.subSectionContainer)}>
        <span className="t" style={sx(styles.subTitle)}>{title}</span>
        <div className="v" style={sx(styles.chipRow)}>
            {options.map(opt => (
                <button className="v btn" type="button"
                    key={opt}
                    onClick={press(() => onToggle(opt))}
                    style={sx([
                        styles.chip,
                        selected.includes(opt) && styles.activeBtn,
                        disabled && { backgroundColor: '#E0E0E0' }
                    ])}
                >
                    <span className="t" style={sx([styles.chipText, selected.includes(opt) && styles.activeText])}>{opt}</span>
                </button>
            ))}
        </div>
    </div>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, marginTop: 20, zIndex: 10 },
    backCircle: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', zIndex: 10, elevation: 5 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginRight: 35 },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 100 },

    activeTagsRow: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D9D9D9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8, marginBottom: 5 },
    tagText: { fontSize: 13, fontWeight: '500' },

    sectionCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
    habitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    habitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    habitChipActive: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    habitChipText: { fontSize: 12.5, color: '#475569', marginLeft: 6, fontWeight: '600' },
    habitChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
    habitsNote: { fontSize: 12, color: '#64748B', marginTop: 10 },

    buttonGroup: { flexDirection: 'row', justifyContent: 'space-between' },
    choiceBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    activeBtn: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
    choiceText: { fontWeight: 'bold', color: '#333' },
    activeText: { color: '#FFF' },

    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 15, height: 50 },
    dropdownText: { flex: 1, color: '#333', fontSize: 16 },

    subCategoryCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
    subSectionContainer: { marginBottom: 20 },
    subTitle: { fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline', marginBottom: 10 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', marginRight: 8, marginBottom: 8 },
    chipText: { fontSize: 12, color: '#333' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, backgroundColor: '#FFF', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#EEE' },
    resetBtn: { backgroundColor: '#555', flex: 0.45, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    applyBtn: { backgroundColor: '#1E64D3', flex: 0.45, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    footerBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '70%', elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    cityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    cityText: { fontSize: 16, color: '#666' },
    activeCityText: { color: '#1E64D3', fontWeight: 'bold' }
});

export default FilterationScreen;