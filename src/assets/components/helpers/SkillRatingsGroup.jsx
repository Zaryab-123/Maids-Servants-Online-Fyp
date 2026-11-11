import React from 'react';

import Icon from '@/web/Icon';
import { StyleSheet, sx } from '@/web';


function RatingValue({ averageRating, ratingCount, compact = false }) {
    const count = Number(ratingCount) || 0;
    const average = Number(averageRating);
    const isRated = count > 0 && averageRating !== null && averageRating !== undefined && Number.isFinite(average);

    if (!isRated) {
        return <span className="t" style={sx([styles.notRated, compact && styles.notRatedCompact])}>Not rated</span>;
    }

    return (
        <div className="v" style={sx([styles.ratingValue, compact && styles.ratingValueCompact])}>
            <Icon name="star" size={compact ? 13 : 15} color="#F59E0B" />
            <span className="t" style={sx([styles.ratingNumber, compact && styles.ratingNumberCompact])}>{average.toFixed(1)}</span>
            <span className="t" style={sx([styles.ratingOutOf, compact && styles.ratingOutOfCompact])}>/5</span>
            <span className="t" style={sx([styles.ratingCount, compact && styles.ratingCountCompact])}>{count} ratings</span>
        </div>
    );
}

function normalizeSkills(skills) {
    if (!Array.isArray(skills)) return [];
    return skills.map((skill, index) => (
        typeof skill === 'string'
            ? { name: skill, averageRating: null, ratingCount: 0, _key: `${skill}-${index}` }
            : skill
    ));
}

/** Shared, read-only category + subskill rating presentation for both profiles. */
export default function SkillRatingsGroup({
    categoryLabel,
    categoryName,
    averageRating,
    ratingCount,
    skills = [],
}) {
    const items = normalizeSkills(skills);

    return (
        <div className="v" style={sx(styles.group)}>
            <div className="v" style={sx(styles.categoryHeader)}>
                <div className="v" style={sx(styles.categoryText)}>
                    {!!categoryLabel && <span className="t" style={sx(styles.categoryLabel)}>{categoryLabel}</span>}
                    <span className="t" style={sx(styles.categoryName)}>{categoryName || 'Service category'}</span>
                </div>
                <RatingValue averageRating={averageRating} ratingCount={ratingCount} />
            </div>

            {items.length > 0 ? items.map((skill, index) => (
                <div className="v" key={skill.skillsId ?? skill._key ?? `${skill.name || 'skill'}-${index}`} style={sx(styles.skillRow)}>
                    <RatingValue
                        averageRating={skill.averageRating}
                        ratingCount={skill.ratingCount}
                        compact
                    />
                    <span className="t" style={sx(styles.skillName)}>{skill.name || skill.skillName || 'Skill'}</span>
                </div>
            )) : (
                <span className="t" style={sx(styles.emptySkills)}>No subskills listed.</span>
            )}
        </div>
    );
}

const styles = StyleSheet.create({
    group: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 13,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 9,
        marginBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    categoryText: { flex: 1, marginRight: 8 },
    categoryLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    categoryName: { color: '#172033', fontSize: 14, fontWeight: '800', marginTop: 2 },
    ratingValue: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7E6',
        borderRadius: 15,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    ratingValueCompact: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 9 },
    ratingNumber: { color: '#172033', fontSize: 12, fontWeight: '800', marginLeft: 3 },
    ratingNumberCompact: { fontSize: 11 },
    ratingOutOf: { color: '#64748B', fontSize: 10, marginLeft: 2 },
    ratingOutOfCompact: { fontSize: 9 },
    ratingCount: { color: '#64748B', fontSize: 9, marginLeft: 5 },
    ratingCountCompact: { fontSize: 8, marginLeft: 4 },
    notRated: { color: '#64748B', fontSize: 10, fontWeight: '700', backgroundColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
    notRatedCompact: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 4, marginRight: 9 },
    skillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E9EEF5',
    },
    skillName: { color: '#334155', fontSize: 12, fontWeight: '600', flex: 1 },
    emptySkills: { color: '#64748B', fontSize: 12, paddingVertical: 8 },
});
