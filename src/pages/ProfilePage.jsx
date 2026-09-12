import { BellRing, LogIn, ShieldCheck, Volume2, Rows3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'

const options = [
  { key: 'reminders', title: 'Daily practice reminder', detail: 'Stay consistent with one short session.', icon: BellRing },
  { key: 'sounds', title: 'Timer sounds', detail: 'Play a soft cue when each prompt changes.', icon: Volume2 },
  { key: 'compact', title: 'Compact mode', detail: 'Fit more information on larger screens.', icon: Rows3 },
]

export default function ProfilePage() {
  const { profile, settings, updateSettings, stats } = useApp()
  const initial = profile.name?.[0]?.toUpperCase() || 'S'
  return <div className="page profile-page"><section className="surface profile-surface"><div className="profile-hero"><span className="large-avatar">{initial}</span><div><h2>{profile.name}</h2><span><ShieldCheck/> {profile.verified ? 'Verified learner' : 'Guest learner'}</span></div><Link to="/login" className="secondary-button"><LogIn/> {profile.mode === 'account' ? 'Switch account' : 'Connect account'}</Link></div><div className="profile-stats"><div><strong>{stats.sessions}</strong><span>Sessions</span></div><div><strong>{stats.average}</strong><span>Average</span></div><div><strong>{stats.best}</strong><span>Best</span></div></div><div className="settings-list">{options.map(({ key, title, detail, icon: Icon }) => <div className="setting-row" key={key}><span className="setting-icon"><Icon/></span><div><strong>{title}</strong><small>{detail}</small></div><button className={`switch ${settings[key] ? 'on' : ''}`} onClick={() => updateSettings(key)} aria-label={`Toggle ${title}`} aria-pressed={settings[key]}><span/></button></div>)}</div></section></div>
}
