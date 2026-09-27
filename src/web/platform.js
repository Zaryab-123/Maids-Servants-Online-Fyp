/**
 * Browser equivalents of React Native platform APIs.
 */
import { showDialog } from './dialogStore';

export const Platform = {
  OS: 'web',
  Version: 0,
  select: (obj) => (obj && ('web' in obj ? obj.web : obj.default)),
};

// A single snapshot is used for the whole session so that screens which
// compute paging offsets from it (x = index * width) stay self-consistent;
// the paging ScrollView rescales these logical offsets to its real width.
const WINDOW = {
  width: typeof window !== 'undefined' ? window.innerWidth : 390,
  height: typeof window !== 'undefined' ? window.innerHeight : 844,
  scale: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  fontScale: 1,
};
export const Dimensions = {
  get: () => WINDOW,
  addEventListener: () => ({ remove() {} }),
};

/** Alert.alert(title, message, buttons, options) → accessible modal dialog. */
export const Alert = {
  alert: (title, message, buttons, options) => showDialog({ title, message, buttons, options }),
};

/** Android-only permission API: on the web, the browser prompts itself. */
export const PermissionsAndroid = {
  PERMISSIONS: { ACCESS_FINE_LOCATION: 'geolocation', ACCESS_COARSE_LOCATION: 'geolocation', CAMERA: 'camera' },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
  request: async () => 'granted',
  check: async () => true,
};

export const Keyboard = { dismiss: () => document.activeElement?.blur?.(), addListener: () => ({ remove() {} }) };
