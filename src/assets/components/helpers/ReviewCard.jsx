import React from 'react';

import Ionicons from '@/web/Icon';
import CriteriaBreakdown from './CriteriaBreakdown';
import { StyleSheet, imgSrc, press, sx } from '@/web';


// Badge colors: the contract ended one of two ways, so the review can be tagged.
const END_BADGE = {
  terminated: { label: 'Terminated', bg: '#FEE2E2', fg: '#DC2626' },
  resigned: { label: 'Resigned', bg: '#EDE9FE', fg: '#6D28D9' },
};

function resolveEndBadge(endType) {
  const key = String(endType ?? '').toLowerCase();
  return END_BADGE[key] || null; // anything else (Completed, Hired, blank) => no badge
}

function Stars({ value, size }) {
  return (
    <div className="v" style={sx({ flexDirection: 'row' })}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.round(value) ? 'star' : 'star-outline'}
          size={size}
          color={s <= Math.round(value) ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
    </div>
  );
}

/**
 * Shared review card: reviewer + Terminated/Resigned badge, overall stars,
 * remarks, worked period, and a tap-to-expand criteria breakdown.
 *
 * Props:
 *  - name          reviewer name (left avatar initial)
 *  - onNamePress   optional press handler for the name
 *  - rating        overall rating (number)
 *  - date          formatted date string
 *  - workedPeriod  optional "Worked for X" string
 *  - endType       'Terminated' | 'Resigned' | anything (badge only for the first two)
 *  - text          the free-text remarks/comment
 *  - criteria      [{ name, score }] — per-criterion breakdown (hidden when empty)
 *  - accentColor   accent for the name/border (default brand blue)
 */
export default function ReviewCard({
  name = 'Anonymous',
  image = '',
  onNamePress,
  rating = 0,
  date = '',
  workedPeriod = '',
  endType = '',
  text = '',
  criteria = [],
  accentColor = '#3B82F6',
}) {
  const badge = resolveEndBadge(endType);

  const nameEl = (
    <span className="t" style={sx([styles.name, { color: accentColor }])}>{name}</span>
  );

  return (
    <div className="v" style={sx(styles.card)}>
      <div className="v" style={sx(styles.header)}>
        {image ? (
          <img className="img" alt="" src={imgSrc({ uri: image })} style={sx(styles.avatarImage)} />
        ) : (
          <div className="v" style={sx([styles.avatar, { borderColor: accentColor }])}>
            <span className="t" style={sx([styles.avatarText, { color: accentColor }])}>{name[0]}</span>
          </div>
        )}
        <div className="v" style={sx({ flex: 1 })}>
          <div className="v" style={sx(styles.nameRow)}>
            {onNamePress ? (
              <button className="v btn" type="button" onClick={press(onNamePress)} style={sx({ flexShrink: 1 })}>{nameEl}</button>
            ) : nameEl}
            {badge ? (
              <div className="v" style={sx([styles.badge, { backgroundColor: badge.bg }])}>
                <span className="t" style={sx([styles.badgeText, { color: badge.fg }])}>{badge.label}</span>
              </div>
            ) : null}
          </div>
          {date ? <span className="t" style={sx(styles.date)}>{date}</span> : null}
        </div>
      </div>

      {!!workedPeriod && <span className="t" style={sx(styles.worked)}>{workedPeriod}</span>}

      <div className="v" style={sx(styles.ratingRow)}>
        <Stars value={rating} size={16} />
        <span className="t" style={sx(styles.ratingNum)}>{rating}</span>
      </div>

      {!!text && <span className="t" style={sx(styles.text)}>{text}</span>}

      <CriteriaBreakdown criteria={criteria} accentColor={accentColor} />
    </div>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F8FAFC',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  avatarImage: { width: 38, height: 38, borderRadius: 19, marginRight: 12, backgroundColor: '#F1F5F9' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 14, fontWeight: '700', marginRight: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  date: { fontSize: 11, color: '#64748B', marginTop: 2 },
  worked: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratingNum: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
  text: { fontSize: 13, color: '#475569', lineHeight: 19 },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailsToggleText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  criteriaBox: { marginTop: 10 },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  criteriaName: { fontSize: 12, color: '#334155', flex: 1, marginRight: 8 },
  criteriaRight: { flexDirection: 'row', alignItems: 'center' },
  criteriaScore: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
});
