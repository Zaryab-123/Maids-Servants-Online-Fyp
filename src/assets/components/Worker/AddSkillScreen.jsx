import React, { useState, useEffect } from 'react';

import Icon from '@/web/Icon';
import DateTimePicker from '@/web/DateTimePicker';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_ACCOUNT } from '../../config';
import { Platform, Spinner, StyleSheet, changeText, press, sx } from '@/web';


// Direct routing targeting AccountCreationController endpoints
const API_BASE_URL = API_ACCOUNT;

// Maps standard string names to recognizable vector icons dynamically
const getIconName = (name) => {
  const norm = name?.toLowerCase().trim() || ''; // Added .trim() to wipe out accidental whitespace
  if (norm.includes('clean')) return 'broom';
  if (norm.includes('driv')) return 'car';       // Shortened to match "drive", "driving", "driver"
  if (norm.includes('cook')) return 'chef-hat';
  
  return 'briefcase-outline';                    // A cleaner fallback than a hammer for generic items
};

const ExpertiseSection = ({ title, icon, isActive, categoryId, onExperiencesAdded }) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [dateText, setDateText] = useState('Select Date');
  const [workAt, setWorkAt] = useState('');
  const [description, setDescription] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubSkillIds, setSelectedSubSkillIds] = useState([]); 
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isActive && categoryId) {
      setIsFetching(true);
      fetch(`${API_BASE_URL}/GetSkillsByCategory?categoryId=${categoryId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            const formattedData = data.map((item, index) => ({
              id: item.id ?? item.SkillsId ?? item.skillsId ?? item.skills_ID ?? `skill-${index}`,
              name: item.name ?? item.SkillName ?? item.skillName ?? item.skill_Name ?? "Missing Name"
            }));
            setSubCategories(formattedData);
          } else {
            setSubCategories([]);
          }
          setIsFetching(false);
        })
        .catch(err => {
          console.error("Error fetching skills:", err);
          setIsFetching(false);
        });
    }
  }, [isActive, categoryId]);

  const calculateDuration = (startDate) => {
    const start = new Date(startDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }

    if (years > 0 && months > 0) return `${years} Years, ${months} Months`;
    if (years > 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
  };

  const toggleSkillSelection = (id) => {
    if (selectedSubSkillIds.includes(id)) {
      setSelectedSubSkillIds(selectedSubSkillIds.filter(item => item !== id));
    } else {
      setSelectedSubSkillIds([...selectedSubSkillIds, id]);
    }
  };

  const handleLocalAdd = () => {
    if (!workAt || !description || dateText === 'Select Date' || selectedSubSkillIds.length === 0) {
      NotificationHelper.showError("Please select at least one sub-category and fill all fields.");
      return;
    }

    const newExperiencesBatch = selectedSubSkillIds.map(skillId => ({
      WorkAt: workAt,
      ExpDetail: description,
      Duration: calculateDuration(date),
      CategoryId: categoryId,
      SkillsId: skillId
    }));

    onExperiencesAdded(newExperiencesBatch);

    // Reset components back to defaults
    setWorkAt('');
    setDescription('');
    setDateText('Select Date');
    setSelectedSubSkillIds([]);
    NotificationHelper.showSuccess(`1 Experience(s) added to your submission list.`);
  };

  return (
    <div className="v" style={sx(styles.expertiseCard)}>
      <div className="v" style={sx(styles.expertiseHeader)}>
        <div className="v" style={sx([styles.headerIconCircle, styles.activeBlueCircle])}>
          <Icon name={icon} size={24} color="#1E64D3" />
        </div>
        <span className="t" style={sx(styles.expertiseTitle)}>{title} Expertise</span>
      </div>

      <span className="t" style={sx(styles.subLabel)}>SUB CATEGORIES (Tap to select)</span>
      <div className="v" style={sx(styles.chipContainer)}>
        {isFetching ? (
          <Spinner size="small" color="#1E64D3" />
        ) : (
          subCategories.map((skill) => (
            <button className="v btn" type="button"
              key={skill.id.toString()}
              style={sx([
                styles.chip,
                selectedSubSkillIds.includes(skill.id) && { backgroundColor: '#1E64D3' }
              ])}
              onClick={press(() => toggleSkillSelection(skill.id))}
            >
              <span className="t" style={sx([
                styles.chipText,
                selectedSubSkillIds.includes(skill.id) && { color: '#FFF', fontWeight: 'bold' }
              ])}>
                {skill.name}
              </span>
            </button>
          ))
        )}
      </div>

      <span className="t" style={sx(styles.subLabel)}>WORKING SINCE</span>
      <button className="v btn" type="button" style={sx(styles.inputRow)} onClick={press(() => setShow(true))}>
        <span className="t" style={sx([styles.flexInput, { color: dateText === 'Select Date' ? '#999' : '#333', paddingTop: 12 }])}>
          {dateText}
        </span>
        <Icon name="calendar-month-outline" size={24} color="#333" />
      </button>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              setDate(selectedDate);
              setDateText(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <div className="v" style={sx(styles.inputRow)}>
        <Icon name="office-building-marker-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <input className="input" style={sx(styles.flexInput)} placeholder="Where did you work?" value={(workAt) ?? ''} onChange={changeText(setWorkAt)} />
      </div>
      <div className="v" style={sx(styles.inputRow)}>
        <Icon name="text-box-outline" size={20} color="#333" style={{ marginRight: 10 }} />
        <input className="input" style={sx(styles.flexInput)} placeholder="Describe your role" value={(description) ?? ''} onChange={changeText(setDescription)} />
      </div>

      <button className="v btn" type="button" style={sx(styles.submitExpBtn)} onClick={press(handleLocalAdd)}>
        <span className="t" style={sx(styles.submitExpText)}>+ Add Experience</span>
      </button>
    </div>
  );
};

const AddSkillsScreen = ({ navigation, route }) => {
  const [dbCategories, setDbCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [experienceList, setExperienceList] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/GetCategories`) 
      .then(res => {
        if (!res.ok) throw new Error("Failed to load schema categories.");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(c => ({
            id: c.categoryId ?? c.id ?? c.category_ID,
            name: c.categoryName ?? c.name ?? c.category_Name
          }));
          setDbCategories(formatted);
        }
        setCategoriesLoading(false);
      })
      .catch(err => {
        console.error("Categories fetch error:", err);
        setCategoriesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (route.params?.existingExperiences && experienceList.length === 0 && dbCategories.length > 0) {
      const exps = route.params.existingExperiences;
      setExperienceList(exps);

      if (exps.length > 0) {
        const catId = exps[0].CategoryId || exps[0].categoryId;
        const matchedCat = dbCategories.find(c => c.id === catId);
        if (matchedCat) setPrimary(matchedCat);
      }
    }
  }, [route.params, dbCategories]);

  const handleFinalSave = () => {
  if (experienceList.length === 0) {
    NotificationHelper.showError("Please add at least one experience before saving.");
    return;
  }

  // FORCE conversion of IDs to integers so the C# backend can deserialize them safely
  const sanitizedExperiences = experienceList.map(exp => ({
    ...exp,
    CategoryId: exp.CategoryId ? parseInt(exp.CategoryId, 10) : null,
    SkillsId: exp.SkillsId ? parseInt(exp.SkillsId, 10) : null
  }));

  navigation.navigate('Signup', {
    ...route.params, 
    // Carry the signup form state (including any pinned location) back with us,
    // so leaving for AddSkills and returning never drops what was already typed.
    ...(route.params?.signupDraft || {}),
    skillsCompleted: true,
    categoryId: primary?.id ? parseInt(primary.id, 10) : null, 
    experiencesJson: JSON.stringify(sanitizedExperiences) // Sent cleanly as true numbers!
  });
};

  const handleAddBatchExperiences = (newBatch) => {
    setExperienceList(prevList => [...prevList, ...newBatch]);
  };

  return (
    <div className="v screen" style={sx(styles.container)}>
      <div className="v" style={sx(styles.headerNav)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backBtn)}>
          <Icon name="arrow-left" size={24} color="#333" />
        </button>
        <span className="t" style={sx(styles.navTitle)}>Add Skills</span>
        <div className="v" style={sx({ width: 40 })} />
      </div>

      <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.scrollContent)}>
        {categoriesLoading ? (
          <Spinner size="large" color="#1E64D3" style={{ marginVertical: 30 }} />
        ) : (
          <>
            <span className="t" style={sx(styles.mainHeading)}>Select Your Primary Skills</span>
            <div className="v" style={sx(styles.skillRow)}>
              {dbCategories.map(cat => (
                <SkillBox
                  key={`primary-${cat.id}`}
                  icon={getIconName(cat.name)}
                  label={cat.name}
                  selected={primary?.id === cat.id}
                  onPress={() => setPrimary(cat)}
                />
              ))}
            </div>

            <span className="t" style={sx(styles.mainHeading)}>Select Your Secondary Skills <span className="t" style={sx(styles.optional)}>(Optional)</span></span>
            <div className="v" style={sx(styles.skillRow)}>
              {dbCategories.map(cat => (
                <SkillBox
                  key={`secondary-${cat.id}`}
                  icon={getIconName(cat.name)}
                  label={cat.name}
                  selected={secondary?.id === cat.id}
                  disabled={primary?.id === cat.id}
                  onPress={() => setSecondary(cat)}
                />
              ))}
            </div>
          </>
        )}

        {primary && (
          <ExpertiseSection
            title={primary.name}
            icon={getIconName(primary.name)}
            isActive={true}
            categoryId={primary.id}
            onExperiencesAdded={handleAddBatchExperiences}
          />
        )}

        {secondary && (
          <ExpertiseSection
            title={secondary.name}
            icon={getIconName(secondary.name)}
            isActive={true}
            categoryId={secondary.id}
            onExperiencesAdded={handleAddBatchExperiences}
          />
        )}

        <button className="v btn" type="button" style={sx(styles.saveBtn)} onClick={press(handleFinalSave)}>
          <span className="t" style={sx(styles.saveBtnText)}>Save and Continue</span>
        </button>
      </div></div>
    </div>
  );
};

const SkillBox = ({ icon, label, selected, disabled, onPress }) => (
  <button className="v btn" type="button"
    disabled={disabled}
    style={sx([styles.skillBox, selected && styles.selectedSkillBox, disabled && { opacity: 0.3 }])}
    onClick={press(onPress)}
  >
    <div className="v" style={sx([styles.skillIconCircle, selected && styles.selectedIconCircle])}>
      <Icon name={icon} size={30} color={selected ? "#FFF" : "#333"} />
    </div>
    <span className="t" style={sx([styles.skillLabel, selected && styles.selectedSkillLabel])}>{label}</span>
  </button>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#EEE', zIndex: 10 },
  navTitle: { fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5, backgroundColor: '#F0F0F0', borderRadius: 20, zIndex: 10, elevation: 5 },
  scrollContent: { padding: 20 },
  mainHeading: { fontSize: 16, fontWeight: 'bold', marginVertical: 15, color: '#000' },
  optional: { fontWeight: 'normal', color: '#999', fontSize: 12 },
  skillRow: { flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: 20 },
  skillBox: { width: '30%', height: 100, backgroundColor: '#FFF', borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 5, marginRight: '3%', marginBottom: 10 },
  selectedSkillBox: { backgroundColor: '#008000' },
  skillIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0EAF8', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  selectedIconCircle: { backgroundColor: 'rgba(255,255,255,0.2)' },
  skillLabel: { fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  selectedSkillLabel: { color: '#FFF' },
  expertiseCard: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#EEE', elevation: 3 },
  expertiseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerIconCircle: { width: 45, height: 45, borderRadius: 22.5, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  activeBlueCircle: { backgroundColor: '#D7E6FF' },
  expertiseTitle: { fontSize: 16, fontWeight: 'bold' },
  subLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 45, marginBottom: 10, borderWidth: 1, borderColor: '#DDD' },
  flexInput: { flex: 1, fontSize: 14 },
  submitExpBtn: { alignSelf: 'flex-end', backgroundColor: '#1E64D3', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 15, marginTop: 10 },
  submitExpText: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#1E64D3', height: 55, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 5, marginBottom: 30 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AddSkillsScreen;