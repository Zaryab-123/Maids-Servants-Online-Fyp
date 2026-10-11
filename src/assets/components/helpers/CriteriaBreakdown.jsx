import React, { useState } from 'react';

import Ionicons from '@/web/Icon';
import { StyleSheet, press, sx } from '@/web';


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
 * Tap-to-expand per-criterion breakdown: [{ name, score }].
 * Renders nothing when the list is empty (e.g. old reviews with no criteria).
 */
export default function CriteriaBreakdown({ criteria = [], accentColor = '#3B82F6', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const list = Array.isArray(criteria) ? criteria : [];
  if (list.length === 0) return null;

  return (
    <div className="v">
      <button className="v btn" type="button"
        onClick={press(() => setOpen((v) => !v))}
        style={sx(styles.toggle)}
        
      >
        <span className="t" style={sx([styles.toggleText, { color: accentColor }])}>Criteria breakdown</span>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={accentColor} />
      </button>

      {open ? (
        <div className="v" style={sx(styles.box)}>
          {list.map((c, i) => (
            <div className="v" key={`${c?.name ?? 'c'}-${i}`} style={sx(styles.row)}>
              <span className="t" style={sx(styles.name, 2)} >{c?.name}</span>
              <div className="v" style={sx(styles.right)}>
                <Stars value={c?.score ?? 0} size={12} />
                <span className="t" style={sx(styles.score)}>{c?.score ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  toggleText: { fontSize: 12, fontWeight: '700' },
  box: { marginTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  name: { fontSize: 12, color: '#334155', flex: 1, marginRight: 8 },
  right: { flexDirection: 'row', alignItems: 'center' },
  score: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginLeft: 6 },
});
