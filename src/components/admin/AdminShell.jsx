import { Activity, ArrowLeft, ClipboardList, ExternalLink, LayoutDashboard, ShieldCheck, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../../state/AppContext'
import './adminShell.css'

const items = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/responses', label: 'Test responses', icon: ClipboardList },
  { to: '/admin/users', label: 'User profiles', icon: Users },
  { to: '/admin/activity', label: 'Admin activity', icon: Activity },
]

export default function AdminShell() {
  const { profile } = useApp()
  const initial = profile.name?.trim()?.[0]?.toUpperCase() || 'A'
  return <div className="admin-workspace">
    <a href="#admin-content" className="admin-skip">Skip to admin content</a>
    <aside className="admin-sidebar">
      <a href="/" target="_blank" rel="noopener noreferrer" className="admin-brand">
        <img src="/app-logo.png" alt="" />
        <span>ISSB Prep<small>ADMIN CONSOLE</small></span>
      </a>
      <p className="admin-nav-label">Workspace</p>
      <nav className="admin-nav" aria-label="Administrator navigation">
        {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
          <Icon size={18} aria-hidden="true" /><span>{label}</span>
        </NavLink>)}
      </nav>
      <div className="admin-sidebar-note"><ShieldCheck size={16} /><span>Admin access is verified by the live API for every request.</span></div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="admin-back-link"><ArrowLeft size={16} /> Open candidate workspace <ExternalLink size={14} /></a>
    </aside>
    <main className="admin-main" id="admin-content" tabIndex={-1}>
      <header className="admin-topbar">
        <div><span className="admin-topbar-kicker">ISSB PREP · ADMINISTRATION</span><strong>Platform operations</strong></div>
        <div className="admin-account"><span className="admin-account-avatar">{initial}</span><span>{profile.name || 'Administrator'}<small>Administrator</small></span></div>
      </header>
      <div className="admin-page-wrap"><Outlet /></div>
    </main>
  </div>
}
