/**
 * AsyncStorage → localStorage, keeping the identical Promise-based API
 * so every session read/write in the app works unchanged.
 */
const ls = () => window.localStorage;

const AsyncStorage = {
  getItem: async (k) => ls().getItem(k),
  setItem: async (k, v) => { ls().setItem(k, String(v)); },
  removeItem: async (k) => { ls().removeItem(k); },
  mergeItem: async (k, v) => {
    const cur = JSON.parse(ls().getItem(k) || '{}');
    ls().setItem(k, JSON.stringify({ ...cur, ...JSON.parse(v) }));
  },
  clear: async () => { ls().clear(); },
  getAllKeys: async () => Object.keys(ls()),
  multiGet: async (keys) => keys.map((k) => [k, ls().getItem(k)]),
  multiSet: async (pairs) => { pairs.forEach(([k, v]) => ls().setItem(k, String(v))); },
  multiRemove: async (keys) => { keys.forEach((k) => ls().removeItem(k)); },
};

export default AsyncStorage;
