import { ArrowRight, CalendarDays, CheckCircle2, Flame, Gauge, Play, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import ReadinessRing from '../components/ReadinessRing'
import TestCard from '../components/TestCard'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'

export default function DashboardPage() {
  const { profile, stats } = useApp()
  return <div className="page dashboard-page">
    <section className="web-dashboard-grid">
      <article className="readiness-hero web-hero"><div className="orb one"/><div className="orb two"/><div className="hero-label"><Gauge/> Readiness command center</div><h2>Train the judgment behind every response.</h2><p className="hero-intro">Build a balanced profile across the five psychological tests with focused, timed practice.</p><div className="web-hero-bottom"><div className="readiness-row"><ReadinessRing score={Number(stats.average)} dark/><div><h3>{Number(stats.average) >= 7 ? 'Strong progress' : 'Foundation stage'}</h3><p>{stats.sessions} recorded sessions · best score {stats.best}</p></div></div><Link className="hero-cta" to="/practice/wat"><Play/> Continue with WAT</Link></div></article>
      <aside className="today-panel"><div className="today-head"><span><CalendarDays/></span><div><p>Today’s plan</p><h3>12 minutes</h3></div></div><div className="plan-list"><div><CheckCircle2/><span><b>PPDT observation</b><small>Completed</small></span></div><div><span className="plan-number">2</span><span><b>WAT sprint</b><small>10 quick prompts</small></span></div><div><span className="plan-number">3</span><span><b>Review patterns</b><small>2 minute reflection</small></span></div></div><Link to="/practice">Open practice plan <ArrowRight/></Link></aside>
    </section>

    <section className="dashboard-lower"><div><header className="section-header"><div><h2>Practice library</h2><p>Start with the format that needs attention.</p></div><Link to="/practice">Explore all <ArrowRight /></Link></header><section className="test-grid web-test-grid">{TESTS.slice(0, 3).map((test) => <TestCard key={test.id} test={test}/>)}</section></div><aside><header className="section-header"><div><h2>Performance</h2><p>Across all saved sessions.</p></div></header><section className="performance-stack"><div><span>Sessions</span><strong>{stats.sessions}</strong></div><div><span>Average</span><strong>{stats.average}</strong></div><div><span>Personal best</span><strong>{stats.best}</strong></div><div className="streak-inline"><Flame/><span><b>3 day streak</b><small>Best: 5 days</small></span></div></section></aside></section>
  </div>
}
