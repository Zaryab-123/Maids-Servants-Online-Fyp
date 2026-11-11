import React, { useEffect, useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD } from '../../config';
import { Spinner, StyleSheet, press, sx } from '@/web';


/**
 * Renders the common criteria and the skills selected for this interview.
 * The backend response is scoped to the authenticated client's interview and
 * reads skills from the immutable Interview_Skill snapshot.
 *
 * Controlled by the two parent closing-review forms:
 *   onScoreChange(criteriaId, score)
 *   onSkillScoreChange(skillsId, score)
 * The parent also receives both required counts for submit validation.
 */
const CriteriaReviewSection = ({
    interviewId,
    scores = {},
    onScoreChange = () => {},
    skillScores = {},
    onSkillScoreChange = () => {},
    onLoaded,
    onSkillsLoaded,
}) => {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setData(null);
        setFailed(false);
        (async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const res = await fetch(
                    `${API_DASHBOARD}/GetReviewCriteria?interviewId=${interviewId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (res.ok) {
                    const json = await res.json();
                    if (!cancelled) {
                        setData(json);
                        const commonTotal = Number(json.totalCriteria) || (Array.isArray(json.common) ? json.common.length : 0);
                        const selectedSkillTotal = Number(json.totalSkills)
                            || (Array.isArray(json.selectedSkills) ? json.selectedSkills.length : 0);
                        onLoaded && onLoaded(commonTotal);
                        onSkillsLoaded && onSkillsLoaded(selectedSkillTotal);
                    }
                } else if (!cancelled) {
                    setFailed(true);
                    onLoaded && onLoaded(-1);
                }
            } catch {
                if (!cancelled) {
                    setFailed(true);
                    onLoaded && onLoaded(-1);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [interviewId]);

    const starRow = (criterion) => {
        const current = scores[criterion.criteriaId] || 0;
        return (
            <div className="v" style={sx(styles.row)} key={criterion.criteriaId}>
                <span className="t" style={sx(styles.itemName, 2)} >{criterion.name}</span>
                <div className="v" style={sx(styles.stars)}>
                    {[1, 2, 3, 4, 5].map((score) => (
                        <button className="v btn" type="button"
                            key={score}
                            onClick={press(() => onScoreChange(criterion.criteriaId, score))}
                            
                            
                            aria-label={`Rate ${criterion.name} ${score} out of 5`}
                        >
                            <Icon
                                name={score <= current ? 'star' : 'star-outline'}
                                size={24}
                                color={score <= current ? '#FFC107' : '#D0D5DD'}
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const skillRow = (skill) => {
        const skillsId = skill.skillsId ?? skill.skillId;
        const current = skillScores[skillsId] || 0;
        return (
            <div className="v" style={sx(styles.skillRow)} key={skillsId}>
                <div className="v" style={sx(styles.skillInfo)}>
                    <span className="t" style={sx(styles.itemName, 2)} >{skill.name || skill.skillName || 'Skill'}</span>
                    {skill.categoryName ? (
                        <span className="t" style={sx(styles.categoryName, 1)} >{skill.categoryName}</span>
                    ) : null}
                </div>
                <div className="v" style={sx(styles.stars)}>
                    {[1, 2, 3, 4, 5].map((score) => (
                        <button className="v btn" type="button"
                            key={score}
                            onClick={press(() => onSkillScoreChange(skillsId, score))}
                            
                            
                            aria-label={`Rate ${skill.name || 'skill'} ${score} out of 5`}
                        >
                            <Icon
                                name={score <= current ? 'star' : 'star-outline'}
                                size={24}
                                color={score <= current ? '#FFC107' : '#D0D5DD'}
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (failed) {
        return <span className="t" style={sx(styles.error)}>Could not load the review criteria and selected skills. Please go back and retry.</span>;
    }
    if (!data) {
        return <Spinner color="#1E64D3" style={{ marginVertical: 18 }} />;
    }

    const common = Array.isArray(data.common) ? data.common : [];
    const selectedSkills = Array.isArray(data.selectedSkills) ? data.selectedSkills : [];

    return (
        <div className="v">
            <span className="t" style={sx(styles.heading)}>Rate the following</span>

            <span className="t" style={sx(styles.groupTitle)}>Common criteria</span>
            {common.map(starRow)}

            <span className="t" style={sx(styles.groupTitle)}>Skills selected for this job</span>
            {selectedSkills.length > 0 ? (
                selectedSkills.map(skillRow)
            ) : (
                <span className="t" style={sx(styles.legacyNote)}>
                    No selected skills were recorded for this older interview. Only the common criteria apply.
                </span>
            )}
        </div>
    );
};

const styles = StyleSheet.create({
    heading: { fontSize: 15, fontWeight: '800', color: '#17203A', marginBottom: 4 },
    groupTitle: {
        marginTop: 12, marginBottom: 6, fontSize: 11, fontWeight: '800',
        letterSpacing: 0.6, color: '#1E64D3', textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12,
        paddingVertical: 8, marginBottom: 6, borderWidth: 1, borderColor: '#EDF1F7',
    },
    skillRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12,
        paddingVertical: 8, marginBottom: 6, borderWidth: 1, borderColor: '#EDF1F7',
    },
    skillInfo: { flex: 1, marginRight: 8 },
    itemName: { flex: 1, fontSize: 13, color: '#333', marginRight: 8 },
    categoryName: { fontSize: 10, color: '#64748B', marginTop: 2 },
    stars: { flexDirection: 'row' },
    legacyNote: { color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, fontSize: 12, lineHeight: 17 },
    error: { color: '#C62828', fontSize: 13, marginVertical: 10 },
});

export default CriteriaReviewSection;
