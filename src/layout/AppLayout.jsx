import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom';
import Icon from '@/web/Icon';
import { SERVER_BASE } from '@/assets/config';
import logo from '@/assets/images/logo.png';
import defaultUser from '@/assets/images/default-user.png';

/**
 * Web-first application chrome.
 *  • Auth screens (Login / Signup / AddSkills before login) → split layout
 *    with a brand panel on wide screens.
 *  • Signed-in screens → persistent sidebar (desktop), collapsible drawer +
 *    top bar (tablet / mobile).
 * The sidebar only links to screens the app already exposes from each
 * role's home screen, so navigation flows and business rules are unchanged.
 */
const NAV = {
  Client: [
    { to: 'FindServiceScreen', label: 'Find Service', icon: 'magnify' },
    { to: 'UserDashboardScreen', label: 'My Dashboard', icon: 'view-dashboard-outline' },
    { to: 'ActiveRequestScreen', label: 'Active Requests', icon: 'clipboard-text-clock-outline' },
    { to: 'WorkerDecisionScreen', label: 'Worker Decisions', icon: 'account-check-outline' },
    { to: 'ResignationsScreen', label: 'Resignations', icon: 'file-document-outline' },
  ],
  Worker: [
    { to: 'WorkerDashboardScreen', label: 'Dashboard', icon: 'view-dashboard-outline' },
    { to: 'ActiveRequestsScreen', label: 'Interview Requests', icon: 'clipboard-text-clock-outline' },
    { to: 'JobConfirmationScreen', label: 'Job Offers', icon: 'briefcase-check-outline' },
    { to: 'MyHabitsScreen', label: 'My Habits', icon: 'star-outline' },
    { to: 'LeaveJobScreen', label: 'Leave Job', icon: 'exit-run' },
    { to: 'WorkerTerminationScreen', label: 'Contract Notices', icon: 'file-document-outline' },
  ],
  Company: [{ to: 'WorkerDirectoryScreen', label: 'Worker Directory', icon: 'account-group-outline' }],
  Police: [{ to: 'PoliceVerificationPortal', label: 'Verification Portal', icon: 'shield-account-outline' }],
};
const ROLE_LABEL = { Client: 'Client', Worker: 'Worker', Company: 'Company', Police: 'Police Officer' };
const AUTH_SCREENS = ['/Login', '/Signup', '/AddSkills'];

const picUrl = (p) => (!p ? defaultUser : p.startsWith('http') || p.startsWith('blob:') ? p : `${SERVER_BASE}${p.startsWith('/') ? '' : '/'}${p}`);

function readSession() {
  const ls = window.localStorage;
  return { token: ls.getItem('userToken'), role: ls.getItem('userRole'), name: ls.getItem('userName'), picture: ls.getItem('userPicture') };
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(readSession);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setSession(readSession()); setDrawer(false); }, [location.key]);

  const isAuthScreen = AUTH_SCREENS.includes(location.pathname);
  const signedIn = !!session.token && !!session.role && location.pathname !== '/Login';
  const isEdit = !!location.state?.params?.isEdit;

  // Profile editing (Signup with isEdit / AddSkills while signed in) stays
  // inside the signed-in shell; every other auth screen uses the split layout.
  const editingInShell = signedIn && (isEdit || location.pathname === '/AddSkills');
  const useAuthLayout = isAuthScreen && !editingInShell;

  if (useAuthLayout || !signedIn) {
    if (useAuthLayout) {
      return (
        <div className="auth-layout">
          <aside className="auth-brand" aria-hidden="false">
            <div className="auth-brand-inner">
              <div className="auth-logo"><img src={logo} alt="Maid & Servant Online logo" /></div>
              <h1>Maid &amp; Servant Online</h1>
              <p className="auth-tag">Trusted domestic help, verified and hired in minutes.</p>
              <ul className="auth-points">
                <li><Icon name="shield-check" size={22} color="#fff" /> Police-verified worker profiles</li>
                <li><Icon name="certificate" size={22} color="#fff" /> Company-issued skill certificates</li>
                <li><Icon name="map-marker-radius" size={22} color="#fff" /> Workers near your location</li>
                <li><Icon name="star" size={22} color="#fff" /> Honest ratings &amp; reviews</li>
              </ul>
            </div>
          </aside>
          <main className="auth-main">
            <div className={`auth-card ${location.pathname === '/Login' ? 'narrow' : ''}`}>
              <Outlet />
            </div>
          </main>
        </div>
      );
    }
    return (
      <div className="bare-layout">
        <main className="bare-main"><Outlet /></main>
      </div>
    );
  }

  const items = NAV[session.role] || [];
  const logout = () => { window.localStorage.clear(); navigate('/Login', { replace: true }); };

  return (
    <div className={`shell ${drawer ? 'drawer-open' : ''}`}>
      <header className="topbar">
        <button type="button" className="icon-btn topbar-menu" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <Icon name="menu" size={26} color="#0F172A" />
        </button>
        <div className="topbar-brand"><img src={logo} alt="" /><span>Maid &amp; Servant Online</span></div>
        <img className="topbar-avatar" src={picUrl(session.picture)} alt="" onError={(e) => { e.currentTarget.src = defaultUser; }} />
      </header>

      <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-head">
          <img src={logo} alt="" className="sidebar-logo" />
          <div>
            <strong>Maid &amp; Servant</strong>
            <span>Online</span>
          </div>
          <button type="button" className="icon-btn sidebar-close" aria-label="Close menu" onClick={() => setDrawer(false)}>
            <Icon name="close" size={22} color="#64748B" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-caption">{ROLE_LABEL[session.role] || session.role} menu</span>
          {items.map((it) => (
            <NavLink key={it.to} to={`/${it.to}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon name={it.icon} size={20} color="currentColor" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <img src={picUrl(session.picture)} alt="" onError={(e) => { e.currentTarget.src = defaultUser; }} />
            <div>
              <strong title={session.name || ''}>{session.name || 'Signed in'}</strong>
              <span>{ROLE_LABEL[session.role] || session.role}</span>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>
            <Icon name="logout" size={18} color="currentColor" /> Log out
          </button>
        </div>
      </aside>

      <main className={`content ${location.pathname === '/MapScreen' ? 'content-full' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
