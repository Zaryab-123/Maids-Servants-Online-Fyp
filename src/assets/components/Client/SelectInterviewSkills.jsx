import React, { useEffect, useMemo, useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import NotificationHelper from '../Notification/NotificationHelper';
import { API_DASHBOARD } from '../../config';
import { Spinner, StyleSheet, press, sx } from '@/web';


const API_BASE_URL = API_DASHBOARD;

const SelectInterviewSkills = ({ navigation, route }) => {
  const { workerId, workerName } = route.params || {};
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const fetchOfferedSkills = async () => {
      if (!workerId || Number(workerId) <= 0) {
        setLoadError('Worker information is missing. Please return to the worker profile.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(
          `${API_BASE_URL}/GetSkillsForInterview?workerId=${encodeURIComponent(workerId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data?.message || 'Could not load the skills offered by this worker.');
        }

        const normalized = (Array.isArray(data) ? data : [])
          .map(item => ({
            categoryId: Number(item.categoryId ?? item.CategoryId ?? 0),
            categoryName: item.categoryName ?? item.CategoryName ?? 'Other',
            skillsId: Number(item.skillsId ?? item.SkillsId ?? 0),
            skillName: item.skillName ?? item.SkillName ?? 'Skill',
          }))
          .filter(item => item.categoryId > 0 && item.skillsId > 0);
        const uniqueSkills = Array.from(
          new Map(normalized.map(item => [item.skillsId, item])).values()
        );

        if (!isCurrent) return;
        setOfferedSkills(uniqueSkills);

        const availableIds = new Set(uniqueSkills.map(item => item.skillsId));
        const initialIds = Array.isArray(route.params?.initialSelectedSkillIds)
          ? route.params.initialSelectedSkillIds.map(Number)
          : [];
        setSelectedSkillIds(Array.from(new Set(initialIds.filter(id => availableIds.has(id)))));
      } catch (error) {
        if (isCurrent) {
          console.error('Interview skill fetch error:', error);
          setLoadError(error.message || 'Could not connect to the server.');
          setOfferedSkills([]);
          setSelectedSkillIds([]);
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    fetchOfferedSkills();
    return () => { isCurrent = false; };
  }, [workerId, route.params?.initialSelectedSkillIds]);

  const skillGroups = useMemo(() => {
    const groups = new Map();
    offeredSkills.forEach(skill => {
      if (!groups.has(skill.categoryId)) {
        groups.set(skill.categoryId, {
          categoryId: skill.categoryId,
          categoryName: skill.categoryName,
          skills: [],
        });
      }
      groups.get(skill.categoryId).skills.push(skill);
    });
    return Array.from(groups.values());
  }, [offeredSkills]);

  const toggleSkill = (skillsId) => {
    setSelectedSkillIds(current => current.includes(skillsId)
      ? current.filter(id => id !== skillsId)
      : [...current, skillsId]);
  };

  const handleSave = () => {
    const selectedSkills = offeredSkills.filter(skill => selectedSkillIds.includes(skill.skillsId));
    if (selectedSkills.length === 0) {
      NotificationHelper.showError('Select at least one skill offered by this worker.');
      return;
    }

    navigation.navigate('InterviewSelectionScreen', {
      workerId,
      workerName,
      selectedSkills,
    });
  };

  return (
    <div className="v screen" style={sx(styles.container)}>
      <div className="v" style={sx(styles.header)}>
        <button className="v btn" type="button" onClick={press(() => navigation.goBack())} style={sx(styles.backButton)}>
          <Icon name="arrow-left" size={23} color="#172554" />
        </button>
        <div className="v" style={sx(styles.headerCopy)}>
          <span className="t" style={sx(styles.title)}>Select Skills</span>
          <span className="t" style={sx(styles.subtitle, 1)} >
            {workerName ? `Skills offered by ${workerName}` : 'Skills offered by this worker'}
          </span>
        </div>
      </div>

      <div className="v scroll"  ><div className="v scroll-content" style={sx(styles.content)}>
        <div className="v" style={sx(styles.introCard)}>
          <Icon name="information-outline" size={20} color="#1E64D3" />
          <span className="t" style={sx(styles.introText)}>
            Choose one or more of the sub-skills this worker has listed. Only selected skills will be attached to this interview request.
          </span>
        </div>

        {isLoading ? (
          <Spinner size="large" color="#1E64D3" style={styles.loader} />
        ) : loadError ? (
          <div className="v" style={sx(styles.emptyCard)}>
            <Icon name="alert-circle-outline" size={34} color="#B45309" />
            <span className="t" style={sx(styles.emptyText)}>{loadError}</span>
          </div>
        ) : offeredSkills.length === 0 ? (
          <div className="v" style={sx(styles.emptyCard)}>
            <Icon name="briefcase-outline" size={34} color="#94A3B8" />
            <span className="t" style={sx(styles.emptyText)}>
              This worker has not listed any sub-skills that can be selected for an interview yet.
            </span>
          </div>
        ) : (
          skillGroups.map(group => (
            <div className="v" key={group.categoryId} style={sx(styles.categoryCard)}>
              <div className="v" style={sx(styles.categoryHeader)}>
                <Icon name="shape-outline" size={18} color="#1E64D3" />
                <span className="t" style={sx(styles.categoryName)}>{group.categoryName}</span>
              </div>
              <div className="v" style={sx(styles.chipWrap)}>
                {group.skills.map(skill => {
                  const selected = selectedSkillIds.includes(skill.skillsId);
                  return (
                    <button className="v btn" type="button"
                      key={skill.skillsId}
                      
                      role="checkbox"
                      aria-checked={selected}
                      onClick={press(() => toggleSkill(skill.skillsId))}
                      style={sx([styles.skillChip, selected && styles.skillChipSelected])}
                      
                    >
                      <Icon
                        name={selected ? 'check-circle' : 'plus-circle-outline'}
                        size={16}
                        color={selected ? '#FFFFFF' : '#475569'}
                        style={styles.chipIcon}
                      />
                      <span className="t" style={sx([styles.skillText, selected && styles.skillTextSelected])}>
                        {skill.skillName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div></div>

      <div className="v" style={sx(styles.footer)}>
        <span className="t" style={sx(styles.selectionCount)}>
          {selectedSkillIds.length} skill{selectedSkillIds.length === 1 ? '' : 's'} selected · at least 1 required
        </span>
        <button className="v btn" type="button"
          style={sx([styles.saveButton, (isLoading || offeredSkills.length === 0) && styles.saveButtonDisabled])}
          onClick={press(handleSave)}
          disabled={isLoading || offeredSkills.length === 0}
          
        >
          <span className="t" style={sx(styles.saveButtonText)}>Save and Continue</span>
          <Icon name="arrow-right" size={19} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E6EDF9',
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#F1F5F9' },
  headerCopy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 19, fontWeight: '800', color: '#0E1B4D' },
  subtitle: { marginTop: 2, fontSize: 12, color: '#64748B' },
  content: { padding: 16, paddingBottom: 24 },
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EAF2FF', borderColor: '#D8E6FF',
    borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 16,
  },
  introText: { flex: 1, marginLeft: 9, fontSize: 13, lineHeight: 19, color: '#334155' },
  loader: { marginTop: 35 },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { marginTop: 10, textAlign: 'center', fontSize: 13, lineHeight: 19, color: '#64748B' },
  categoryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, marginBottom: 13, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryName: { marginLeft: 7, fontSize: 15, fontWeight: '800', color: '#0E1B4D' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  skillChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  skillChipSelected: { backgroundColor: '#1E64D3', borderColor: '#1E64D3' },
  chipIcon: { marginRight: 5 },
  skillText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  skillTextSelected: { color: '#FFFFFF' },
  footer: { padding: 16, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  selectionCount: { textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#64748B' },
  saveButton: { height: 50, borderRadius: 25, backgroundColor: '#1E64D3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { backgroundColor: '#AFC3E8' },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginRight: 8 },
});

export default SelectInterviewSkills;
