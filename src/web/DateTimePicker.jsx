import React, { useState } from 'react';

/**
 * @react-native-community/datetimepicker → native browser date/time input
 * presented in a small dialog (mirrors the Android picker dialog).
 * Calls onChange(event, date) with event.type 'set' | 'dismissed', exactly
 * like the RN component, so the calling screens need no changes.
 */
const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function DateTimePicker({ value, mode = 'date', onChange, minimumDate, maximumDate, is24Hour }) {
  const base = value instanceof Date && !isNaN(value) ? value : new Date();
  const [draft, setDraft] = useState(mode === 'time' ? toTimeStr(base) : toDateStr(base));

  const commit = () => {
    const d = new Date(base);
    if (mode === 'time') {
      const [h, m] = draft.split(':').map(Number);
      d.setHours(h || 0, m || 0, 0, 0);
    } else {
      const [y, mo, da] = draft.split('-').map(Number);
      if (!y) return cancel();
      d.setFullYear(y, mo - 1, da);
    }
    onChange && onChange({ type: 'set', nativeEvent: { timestamp: d.getTime() } }, d);
  };
  const cancel = () => onChange && onChange({ type: 'dismissed', nativeEvent: {} }, undefined);

  return (
    <div className="dlg-backdrop" onClick={cancel}>
      <div className="dlg picker" role="dialog" aria-modal="true" aria-label={mode === 'time' ? 'Select time' : 'Select date'} onClick={(e) => e.stopPropagation()}>
        <h2 className="dlg-title">{mode === 'time' ? 'Select time' : 'Select date'}</h2>
        <input
          autoFocus
          className="picker-input"
          type={mode === 'time' ? 'time' : 'date'}
          value={draft}
          min={mode !== 'time' && minimumDate ? toDateStr(minimumDate) : undefined}
          max={mode !== 'time' && maximumDate ? toDateStr(maximumDate) : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        />
        <div className="dlg-actions">
          <button type="button" className="dlg-btn ghost" onClick={cancel}>Cancel</button>
          <button type="button" className="dlg-btn" onClick={commit}>OK</button>
        </div>
      </div>
    </div>
  );
}
