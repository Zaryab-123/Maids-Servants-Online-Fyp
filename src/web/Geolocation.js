/** @react-native-community/geolocation → navigator.geolocation (same API). */
const unsupported = (error) =>
  error && error({ code: 2, message: 'Geolocation is not supported by this browser.' });

const Geolocation = {
  getCurrentPosition: (success, error, options) => {
    if (!navigator.geolocation) return unsupported(error);
    navigator.geolocation.getCurrentPosition(success, error, options);
  },
  watchPosition: (success, error, options) =>
    navigator.geolocation ? navigator.geolocation.watchPosition(success, error, options) : unsupported(error),
  clearWatch: (id) => navigator.geolocation && navigator.geolocation.clearWatch(id),
  stopObserving: () => {},
  requestAuthorization: (ok) => ok && ok(),
  setRNConfiguration: () => {},
};

export default Geolocation;
