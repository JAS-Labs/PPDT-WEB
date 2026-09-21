import { ArrowRight, BarChart3, Dumbbell, History, Home, User } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../state/AppContext'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
]

const titles = { '/': 'Your readiness', '/practice': 'Practice', '/history': 'Practice history', '/profile': 'Profile' }

function Navigation({ mobile = false }) {
  return <nav className={mobile ? 'mobile-nav' : 'side-nav'} aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>{navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
}

export default function AppShell() {
  const { profile } = useApp()
  const location = useLocation()
  const isSession = location.pathname.startsWith('/practice/')
  const title = isSession ? 'Practice session' : titles[location.pathname] ?? 'ISSB Prep'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const initial = profile.name?.trim()?.[0]?.toUpperCase() || 'S'

  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark logo"><img src="/app-logo.png" alt="ISSB Prep logo" /></span><span>ISSB Prep</span></NavLink>
      <p className="nav-label">Workspace</p><Navigation />
      <div className="sidebar-card"><BarChart3 /><strong>Build your streak</strong><p>A focused 10-minute session today keeps your progress moving.</p><NavLink to="/practice/wat">Start quick WAT</NavLink></div>
    </aside>
    <main className="main-content">
      {!isSession && <header className="topbar"><div><p>{greeting} · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p><h1>{title}</h1></div><div className="topbar-actions"><NavLink to="/practice" className="header-practice">Start practice <ArrowRight/></NavLink><NavLink to="/profile" className="profile-chip"><span className="avatar">{initial}</span><span>{profile.name}</span></NavLink></div></header>}
      <Outlet />
    </main>
    <Navigation mobile />
  </div>
}
