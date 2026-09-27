/**
 * @react-navigation → react-router-dom v6 adapter.
 *
 * Every screen still receives the same `navigation` and `route` props it had
 * on React Native (navigate / replace / goBack / setParams / addListener and
 * route.params), so navigation calls inside screens are unchanged.
 * Each stack screen name maps to the URL path `/<ScreenName>`; params travel
 * in history state (they survive page refresh and back/forward).
 */
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const pathFor = (name) => `/${name}`;

// Params that cannot be structured-cloned into history.state (functions,
// DOM objects…) are kept in memory and referenced by id instead.
const memory = new Map();
function packParams(params) {
  if (params == null) return undefined;
  try {
    structuredClone(params);
    return { params };
  } catch {
    const ref = `p${Date.now()}${Math.random().toString(36).slice(2)}`;
    memory.set(ref, params);
    return { paramsRef: ref };
  }
}
function unpackParams(state) {
  if (!state) return undefined;
  if (state.paramsRef) return memory.get(state.paramsRef);
  return state.params;
}

const homeForRole = () => {
  const role = window.localStorage.getItem('userRole');
  return (
    { Client: 'FindServiceScreen', Worker: 'WorkerDashboardScreen', Company: 'WorkerDirectoryScreen', Police: 'PoliceVerificationPortal' }[role] ||
    'Login'
  );
};

const FocusContext = createContext({ focusKey: 'init', navigation: null, route: null });

export function useNavigationObject(name) {
  const navigate = useNavigate();
  const location = useLocation();
  const listeners = useRef({ focus: new Set(), blur: new Set() });
  const params = unpackParams(location.state);

  const navigation = useMemo(() => {
    const go = (screen, p, replace = false) =>
      navigate(pathFor(screen), { replace, state: packParams(p) });
    return {
      navigate: (screen, p) => {
        if (typeof screen === 'object' && screen) return go(screen.name, screen.params);
        return go(screen, p);
      },
      push: (screen, p) => go(screen, p),
      replace: (screen, p) => go(screen, p, true),
      goBack: () => {
        if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
        else navigate(pathFor(homeForRole()), { replace: true });
      },
      pop: () => navigate(-1),
      popToTop: () => navigate(pathFor(homeForRole())),
      canGoBack: () => (window.history.state?.idx ?? 0) > 0,
      reset: ({ routes = [], index } = {}) => {
        const r = routes[index ?? routes.length - 1];
        if (r) go(r.name, r.params, true);
      },
      setParams: (p) =>
        navigate(location.pathname + location.search, {
          replace: true,
          // __sp marks a param update (not a new focus), like RN setParams
          state: { ...packParams({ ...(unpackParams(window.history.state?.usr) || {}), ...p }), __sp: true },
        }),
      addListener: (type, cb) => {
        const set = listeners.current[type] || (listeners.current[type] = new Set());
        set.add(cb);
        return () => set.delete(cb);
      },
      isFocused: () => true,
      getParent: () => undefined,
      dispatch: () => {},
      _listeners: listeners,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname, location.search]);

  const route = useMemo(() => ({ key: location.key, name, params }), [location.key, name, params]);
  return { navigation, route };
}

/** Wraps a screen component so it receives { navigation, route } props. */
export function Screen({ component: Component, name }) {
  const location = useLocation();
  const { navigation, route } = useNavigationObject(name);
  // setParams() replaces history state but must not count as re-focusing.
  const focusRef = useRef(location.key);
  if (!location.state?.__sp) focusRef.current = location.key;
  const focusKey = focusRef.current;

  // Emit "focus" after the screen (child) has registered its listeners,
  // i.e. on first mount and whenever this route is re-entered.
  useEffect(() => {
    navigation._listeners.current.focus?.forEach((cb) => cb());
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return (
    <FocusContext.Provider value={{ focusKey, navigation, route }}>
      <Component navigation={navigation} route={route} />
    </FocusContext.Provider>
  );
}

/** Same contract as @react-navigation/native useFocusEffect. */
export function useFocusEffect(effect) {
  const { focusKey } = useContext(FocusContext);
  useEffect(() => {
    const cleanup = effect();
    return typeof cleanup === 'function' ? cleanup : undefined;
  }, [effect, focusKey]);
}

export const useNavigation = () => useContext(FocusContext).navigation;
export const useRoute = () => useContext(FocusContext).route;
export const useIsFocused = () => true;
