import React, { useEffect, useState } from 'react';
import { subscribe, closeDialog } from './dialogStore';

/** Renders Alert.alert() calls as accessible modal dialogs. */
export default function DialogHost() {
  const [queue, setQueue] = useState([]);
  useEffect(() => subscribe(setQueue), []);
  const d = queue[0];

  useEffect(() => {
    if (!d) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const cancel = (d.buttons || []).find((b) => b.style === 'cancel');
        closeDialog(d.id);
        cancel?.onPress?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [d]);

  if (!d) return null;
  const buttons = d.buttons && d.buttons.length ? d.buttons : [{ text: 'OK' }];

  return (
    <div className="dlg-backdrop" role="presentation">
      <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
        {d.title ? <h2 id="dlg-title" className="dlg-title">{d.title}</h2> : null}
        {d.message ? <p className="dlg-msg">{d.message}</p> : null}
        <div className="dlg-actions">
          {buttons.map((b, i) => (
            <button
              key={i}
              type="button"
              autoFocus={i === buttons.length - 1}
              className={`dlg-btn ${b.style === 'destructive' ? 'danger' : ''} ${b.style === 'cancel' ? 'ghost' : ''}`}
              onClick={() => {
                closeDialog(d.id);
                b.onPress && b.onPress();
              }}
            >
              {b.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
