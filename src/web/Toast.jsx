import React, { useEffect, useState } from 'react';

/**
 * Drop-in replacement for react-native-toast-message.
 * Same API: Toast.show({ type, text1, text2, visibilityTime, onHide, ... })
 * and a <Toast /> host mounted once at the app root.
 */
let setter = null;
let pending = [];

function Toast() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setter = setItems;
    if (pending.length) { setItems((p) => [...p, ...pending]); pending = []; }
    return () => { setter = null; };
  }, []);

  return (
    <div className="toast-stack" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || 'success'}`} role="status">
          <div className="toast-bar" />
          <div className="toast-body">
            {t.text1 ? <strong>{t.text1}</strong> : null}
            {t.text2 ? <span>{t.text2}</span> : null}
          </div>
          <button type="button" className="toast-x" aria-label="Dismiss" onClick={() => Toast.hide(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

Toast.show = (opts = {}) => {
  const t = { id: Date.now() + Math.random(), ...opts };
  if (setter) setter((p) => [...p.slice(-3), t]);
  else pending.push(t);
  if (opts.autoHide !== false) {
    setTimeout(() => Toast.hide(t.id), opts.visibilityTime ?? 4000);
  }
};

Toast.hide = (id) => {
  if (!setter) return;
  setter((p) => {
    const found = p.find((x) => id == null || x.id === id);
    if (found && found.onHide) setTimeout(found.onHide, 0);
    return id == null ? [] : p.filter((x) => x.id !== id);
  });
};

export default Toast;
