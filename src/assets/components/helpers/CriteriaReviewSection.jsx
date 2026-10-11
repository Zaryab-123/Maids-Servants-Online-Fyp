import React, { useEffect, useState } from 'react';

import Icon from '@/web/Icon';
import AsyncStorage from '@/web/AsyncStorage';
import { API_DASHBOARD } from '../../config';
import { Spinner, StyleSheet, press, sx } from '@/web';


/**
 * Renders the per-criterion star rows for a closing review.
 *
 * The list of criteria is fetched from the backend (GetReviewCriteria), which
 * resolves the worker's profession from Interview -> Worker -> Worker_Category
 * and returns the common set plus one group per category the worker holds.
 *
 * It is CONTROLLED: the parent owns the scores object and is told about every
 * change via onScoreChange(criteriaId, score) and about the total required
 * count via onLoaded(totalRequired), so the parent can validate before submit.
 */
const CriteriaReviewSection = ({ interviewId, scores, onScoreChange, onLoaded }) => {
    const [data, setData] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
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
                        onLoaded && onLoaded(json.totalCriteria || 0);
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

    const starRow = (c) => {
        const current = scores[c.criteriaId] || 0;
        return (
            <div className="v" style={sx(styles.row)} key={c.criteriaId}>
                <span className="t" style={sx(styles.critName, 2)} >{c.name}</span>
                <div className="v" style={sx(styles.stars)}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button className="v btn" type="button" key={s} onClick={press(() => onScoreChange(c.criteriaId, s))} >
                            <Icon
                                name={s <= current ? 'star' : 'star-outline'}
                                size={24}
                                color={s <= current ? '#FFC107' : '#D0D5DD'}
                            />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    if (failed) {
        return <span className="t" style={sx(styles.error)}>Could not load the review criteria. Please go back and retry.</span>;
    }
    if (!data) {
        return <Spinner color="#1E64D3" style={{ marginVertical: 18 }} />;
    }

    return (
        <div className="v">
            <span className="t" style={sx(styles.heading)}>Rate the following</span>

            <span className="t" style={sx(styles.groupTitle)}>Basics</span>
            {data.common.map(starRow)}

            {data.professions.map((p) => (
                <div className="v" key={p.categoryId}>
                    <span className="t" style={sx(styles.groupTitle)}>{p.categoryName}</span>
                    {p.criteria.map(starRow)}
                </div>
            ))}
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
    critName: { flex: 1, fontSize: 13, color: '#333', marginRight: 8 },
    stars: { flexDirection: 'row' },
    error: { color: '#C62828', fontSize: 13, marginVertical: 10 },
});

export default CriteriaReviewSection;
