import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Play,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ReadinessRing from '../components/ReadinessRing'
import TestCard from '../components/TestCard'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'
import './dashboard.css'

function pickRecommendedTest(history) {
  for (const test of TESTS) {
    const count = history.filter((i) => i.type?.toUpperCase() === test.name).length
    if (count === 0) {
      return {
        test,
        reason: history.length === 0
          ? 'Start here to build your baseline profile'
          : `You haven't tried ${test.name} yet`,
      }
    }
  }

  // All tested: pick the lowest average
  let lowestTest = TESTS[0]
  let lowestAvg = 10
  for (const test of TESTS) {
    const items = history.filter((i) => i.type?.toUpperCase() === test.name)
    const avg = items.reduce((sum, i) => sum + (Number(i.score) || 0), 0) / items.length
    if (avg < lowestAvg) {
      lowestAvg = avg
      lowestTest = test
    }
  }

  return {
    test: lowestTest,
    reason: `Your lowest average — ${lowestAvg.toFixed(1)}/10`,
  }
}

export default function DashboardPage() {
  const { stats, history } = useApp()

  const completedPpdt = history.some((item) => item.type?.toUpperCase() === 'PPDT')
  const completedWat = history.some((item) => item.type?.toUpperCase() === 'WAT')
  const recommendation = pickRecommendedTest(history)

  return (
    <div className="page dashboard-page">
      {/* Hero Command Center */}
      <section className="web-dashboard-grid">
        <article className="readiness-hero web-hero">
          <div className="orb one" />
          <div className="orb two" />
          <div className="hero-label">
            <Gauge size={17} /> Your next session
          </div>
          <h2>Keep your practice moving.</h2>
          <p className="hero-intro">
            {recommendation.reason}. Build your skills one response at a time.
          </p>

          <div className="web-hero-bottom">
            <div className="readiness-row">
              <ReadinessRing score={Number(stats.average)} dark />
              <div>
                <h3>{Number(stats.average) >= 7 ? 'Strong progress' : 'Foundation stage'}</h3>
                <p>
                  {stats.sessions} recorded sessions · Average practice score
                </p>
              </div>
            </div>

            <Link className="hero-cta" to={`/practice/${recommendation.test.id}`}>
              <Play size={16} /> Continue with {recommendation.test.name}
            </Link>
          </div>
        </article>

        {/* Today's Suggested Plan */}
        <aside className="today-panel">
          <div className="today-head">
            <span><CalendarDays size={21} /></span>
            <div>
              <p>Suggested plan</p>
              <h3>Practice & review</h3>
            </div>
          </div>

          <div className="plan-list">
            <div>
              {completedPpdt ? <CheckCircle2 /> : <span className="plan-number">1</span>}
              <span>
                <b>PPDT observation</b>
                <small>{completedPpdt ? 'Previously practiced' : 'Start with one image'}</small>
              </span>
            </div>

            <div>
              {completedWat ? <CheckCircle2 /> : <span className="plan-number">2</span>}
              <span>
                <b>WAT sprint</b>
                <small>{completedWat ? 'Previously practiced' : 'Build clear, focused responses'}</small>
              </span>
            </div>

            <div>
              <span className="plan-number">3</span>
              <span>
                <b>Review patterns</b>
                <small>Use your live feedback</small>
              </span>
            </div>
          </div>

          <Link to="/practice">
            Open practice plan <ArrowRight size={17} />
          </Link>
        </aside>
      </section>

      {/* Quick Launchpad to Analytics & Guide */}
      <section className="dashboard-feature-banners">
        <Link to="/analytics" className="feature-banner-card judge-banner">
          <div className="banner-icon-badge"><Sparkles size={22} /></div>
          <div>
            <h3>Cumulative Psychological Assessment</h3>
            <p>View your AI readiness verdict, personality profile, and percentile benchmarks.</p>
          </div>
          <span className="banner-link">View Analytics <ArrowRight size={16} /></span>
        </Link>

        <Link to="/guide" className="feature-banner-card guide-banner">
          <div className="banner-icon-badge"><BookOpen size={22} /></div>
          <div>
            <h3>Officer Like Qualities (OLQ) Guide</h3>
            <p>Explore the 9 core dimensions, 10-point scoring scale, and psychologist assessment rubrics.</p>
          </div>
          <span className="banner-link">Read Guide <ArrowRight size={16} /></span>
        </Link>
      </section>

      {/* Lower Dashboard */}
      <section className="dashboard-lower">
        <div>
          <header className="section-header">
            <div>
              <h2>Practice library</h2>
              <p>Start with the format that needs attention.</p>
            </div>
            <Link to="/practice">Explore all <ArrowRight size={16} /></Link>
          </header>

          <section className="test-grid web-test-grid">
            {TESTS.slice(0, 3).map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </section>
        </div>

        <aside>
          <header className="section-header">
            <div>
              <h2>Performance</h2>
              <p>Across your live sessions.</p>
            </div>
          </header>

          <section className="performance-stack">
            <div>
              <span>Sessions</span>
              <strong>{stats.sessions}</strong>
            </div>
            <div>
              <span>Average</span>
              <strong>{stats.average}</strong>
            </div>
            <div>
              <span>Personal best</span>
              <strong>{stats.best}</strong>
            </div>
          </section>
        </aside>
      </section>
    </div>
  )
}
