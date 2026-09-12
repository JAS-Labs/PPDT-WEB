import { ArrowRight, Flame, Gauge, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReadinessRing from '../components/ReadinessRing'
import TestCard from '../components/TestCard'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'

export default function DashboardPage() {
  const { profile, stats } = useApp()
  return <div className="page dashboard-page">
    <section className="dashboard-grid">
      <article className="readiness-hero"><div className="orb one"/><div className="orb two"/><p>Overall readiness</p><h2>Keep building your foundation, {profile.name.split(' ')[0]}</h2><div className="readiness-row"><ReadinessRing score={Number(stats.average)} dark/><div><h3>{Number(stats.average) >= 7 ? 'Strong progress' : 'Developing'}</h3><p>Your practice is creating a useful baseline. Add variety across test types for a clearer profile.</p><div className="hero-pills"><span><Gauge/> {stats.sessions} tests</span><span><Trophy/> Avg {stats.average}</span></div></div></div></article>
      <article className="streak-card"><span className="streak-icon"><Flame /></span><div><strong>3 days</strong><p>Current practice streak</p></div><small>Your best streak is 5 days</small></article>
    </section>

    <header className="section-header"><div><h2>Practice tests</h2><p>Choose a format and start a focused session.</p></div><Link to="/practice">View all <ArrowRight /></Link></header>
    <section className="test-grid">{TESTS.slice(0, 3).map((test) => <TestCard key={test.id} test={test}/>)}</section>

    <header className="section-header"><div><h2>At a glance</h2><p>Your recent training activity.</p></div></header>
    <section className="stat-grid"><article><span>Sessions</span><strong>{stats.sessions}</strong></article><article><span>Average score</span><strong>{stats.average}</strong></article><article><span>Best score</span><strong>{stats.best}</strong></article></section>
  </div>
}
