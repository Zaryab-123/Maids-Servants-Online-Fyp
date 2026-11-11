import React, { useCallback, useState } from 'react';

import Icon from '@/web/Icon';
import { useFocusEffect } from '@/web/navigation';
import { AppState, StyleSheet, press, sx } from '@/web';
import { getWorkerUnreadCount } from './workerNotificationsApi';

/**
 * Unread-notification bell for the worker dashboard.
 *
 * Ported from the React Native app (helpers/WorkerNotificationBell.js).
 * `AppState` on the web comes from src/web/platform.js, which maps it to
 * document visibility: polling pauses while the tab is hidden and resumes on
 * return, exactly like the phone pauses in the background.
 */
export default function WorkerNotificationBell({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    let busy = false;
    let timer;
    let appState = AppState.currentState || 'active';
    const refresh = async () => {
      if (!active || busy || appState !== 'active') return;
      busy = true;
      try {
        const data = await getWorkerUnreadCount();
        if (active) {
          setUnreadCount(data.unreadCount);
          setRefreshFailed(false);
        }
      } catch (error) {
        if (!active) return;
        setRefreshFailed(true); // Keep a previously loaded count; never pretend an error is zero.
        if (error.status === 401) navigation.replace('Login');
      } finally {
        busy = false;
      }
    };
    const start = () => {
      clearInterval(timer);
      refresh();
      if (appState === 'active') timer = setInterval(refresh, 30000);
    };
    const subscription = AppState.addEventListener('change', nextState => {
      appState = nextState;
      start();
    });
    start();
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, [navigation]));

  const label = `Notifications${unreadCount === null ? '' : `, ${unreadCount} unread`}${refreshFailed ? '. Could not refresh' : ''}`;

  return (
    <button
      className="v btn"
      type="button"
      style={sx(styles.button)}
      onClick={press(() => navigation.navigate('WorkerNotificationsScreen'))}
      aria-label={label}
      title="Opens interview, job, and termination notifications"
      data-testid="worker-notification-bell"
    >
      <Icon name={refreshFailed ? 'bell-alert-outline' : 'bell-outline'} size={23} color={refreshFailed ? '#B45309' : '#1E64D3'} />
      {unreadCount > 0 ? (
        <span className="t" style={sx([styles.badge, { pointerEvents: 'none' }])}>
          <span className="t" style={sx(styles.badgeText)}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        </span>
      ) : null}
    </button>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -3, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});
