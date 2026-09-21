import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../services/liveApi'
import { useApp } from '../state/AppContext'
import OlqScoreSection, { getScoreBand } from '../components/OlqScoreSection'
import ReadinessRing from '../components/ReadinessRing'
import { synthesizePsychologicalReadiness, getReadinessTier } from '../utils/psychologicalSynthesis'

const TEST_TYPES = [
  { id: 'ppdt', name: 'PPDT', label: 'Picture Perception', color: 'var(--teal)' },
  { id: 'wat', name: 'WAT', label: 'Word Association', color: 'var(--blue)' },
  { id: 'tat', name: 'TAT', label: 'Thematic Apperception', color: 'var(--green)' },
  { id: 'sdt', name: 'SDT', label: 'Self Description', color: 'var(--violet)' },
  { id: 'sct', name: 'SCT', label: 'Sentence Completion', color: '#ec4899' },
]

export default function AnalyticsPage() {
  const { history, stats, refreshHistory, historyLoading } = useApp()
  const [judgeReport, setJudgeReport] = useState(null)
  const [judgeLoading, setJudgeLoading] = useState(false)
  const [judgeNotice, setJudgeNotice] = useState('')

  // Benchmark averages state
  const [averages, setAverages] = useState([])
  const [averagesLoading, setAveragesLoading] = useState(false)

  // Percentile checker tool state
  const [percentileForm, setPercentileForm] = useState({ score: '7.0', testType: 'ppdt' })
  const [percentileResult, setPercentileResult] = useState(null)
  const [percentileLoading, setPercentileLoading] = useState(false)
  const [percentileError, setPercentileError] = useState('')

  const historyRef = useRef(history)
  historyRef.current = history

  // Load overall judge report from remote AI with local psychometric fallback
  const loadJudge = useCallback(async (reEvaluate = false) => {
    setJudgeLoading(true)
    setJudgeNotice('')
    try {
      const data = await analyticsApi.getOverallJudge(reEvaluate)
      if (data && (data.overall_readiness_score > 0 || (data.key_strengths_across_tests && data.key_strengths_across_tests.length > 0))) {
        setJudgeReport({ ...data, source: 'cloud_ai' })
        setJudgeNotice('')
        return
      }
    } catch {
      // Remote call failed (offline, timeout, or server error) - fallback intelligently to client synthesis
      if (reEvaluate) {
        setJudgeNotice('Cloud AI re-evaluation request timed out or was unreachable. Displaying local psychometric synthesis.')
      } else {
        setJudgeNotice('Remote AI Judge is currently unreachable. Displaying local psychometric synthesis from your practice history.')
      }
    } finally {
      setJudgeLoading(false)
    }

    // Always fallback to client synthesis if candidate has practice history
    const currentHistory = historyRef.current
    if (currentHistory && currentHistory.length > 0) {
      setJudgeReport(synthesizePsychologicalReadiness(currentHistory))
    } else {
      setJudgeReport(null)
    }
  }, [])

  // Load benchmark averages
  const loadAverages = async () => {
    setAveragesLoading(true)
    try {
      const data = await analyticsApi.getAverages(1000)
      if (Array.isArray(data)) setAverages(data)
    } catch {
      // non-fatal fallback
    } finally {
      setAveragesLoading(false)
    }
  }

  useEffect(() => {
    loadJudge(false)
    loadAverages()
  }, [loadJudge])

  // Synchronize when history updates (e.g. after async initial fetch or new session completed)
  useEffect(() => {
    historyRef.current = history
    if (history.length > 0) {
      setJudgeReport((current) => {
        // Preserve active cloud AI assessment if present
        if (current?.source === 'cloud_ai') return current
        // Otherwise, synthesize immediately using the fresh history
        return synthesizePsychologicalReadiness(history)
      })
    } else if (!judgeLoading && judgeReport?.source === 'client_synthesis') {
      setJudgeReport(null)
    }
  }, [history, judgeLoading, judgeReport?.source])

  // Coordinated refresh of both history and psychological evaluation
  const handleRefreshAll = async () => {
    setJudgeLoading(true)
    try {
      await refreshHistory()
    } catch {}
    await loadJudge(false)
  }

  // Percentile check submit
  const checkPercentile = async (e) => {
    e.preventDefault()
    const num = parseFloat(percentileForm.score)
    if (isNaN(num) || num < 0 || num > 10) {
      setPercentileError('Score must be between 0 and 10.')
      return
    }
    setPercentileLoading(true)
    setPercentileError('')
    try {
      const res = await analyticsApi.getPercentile(num, percentileForm.testType)
      setPercentileResult(res)
    } catch (err) {
      setPercentileError(err.message || 'Could not calculate percentile ranking.')
    } finally {
      setPercentileLoading(false)
    }
  }

  // Per-test stats
  const perTestStats = useMemo(() => {
    return TEST_TYPES.map((t) => {
      const attempts = history.filter((item) => item.type?.toUpperCase() === t.name)
      const count = attempts.length
      const avg = count > 0
        ? (attempts.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / count).toFixed(1)
        : null
      const best = count > 0
        ? Math.max(...attempts.map((item) => Number(item.score) || 0)).toFixed(1)
        : null
      return { ...t, count, avg, best }
    })
  }, [history])

  // Score distribution bands
  const scoreBands = useMemo(() => {
    let excellent = 0, good = 0, fair = 0, needsWork = 0
    history.forEach((item) => {
      const s = Number(item.score)
      if (s >= 8) excellent++
      else if (s >= 6) good++
      else if (s >= 4) fair++
      else needsWork++
    })
    const total = history.length
    return { excellent, good, fair, needsWork, total }
  }, [history])

  // Trends calculation: recent vs older
  const testTrends = useMemo(() => {
    return TEST_TYPES.map((t) => {
      const items = history.filter((item) => item.type?.toUpperCase() === t.name)
      if (items.length < 2) return null
      const split = items.length < 6 ? Math.floor(items.length / 2) : 3
      const recent = items.slice(0, split)
      const older = items.slice(split, split + split)
      if (recent.length === 0 || older.length === 0) return null
      const recentAvg = recent.reduce((sum, i) => sum + (Number(i.score) || 0), 0) / recent.length
      const olderAvg = older.reduce((sum, i) => sum + (Number(i.score) || 0), 0) / older.length
      const diff = recentAvg - olderAvg
      return {
        name: t.name,
        diff: Number(diff.toFixed(1)),
        isPositive: diff >= 0,
      }
    }).filter(Boolean)
  }, [history])

  // Completed batteries count (out of 5)
  const completedBatteriesCount = useMemo(() => {
    return perTestStats.filter((t) => t.count > 0).length
  }, [perTestStats])

  // Display score for readiness ring
  const displayScore = useMemo(() => {
    const raw = judgeReport?.overall_readiness_score ?? stats.average
    const num = Number(raw)
    return isNaN(num) || num <= 0 ? 0 : Number(num.toFixed(1))
  }, [judgeReport, stats.average])

  // Tier info based on report readiness title or score and battery breadth
  const readinessTierInfo = useMemo(() => {
    if (judgeReport?.readiness_tier) return judgeReport.readiness_tier
    if (judgeReport?.estimated_issb_readiness) {
      return getReadinessTier(judgeReport.estimated_issb_readiness, completedBatteriesCount)
    }
    return getReadinessTier(displayScore, completedBatteriesCount)
  }, [judgeReport, displayScore, completedBatteriesCount])

  const readinessTitle = judgeReport?.estimated_issb_readiness || readinessTierInfo.title

  // OLQ scores: either from judge report or fallback computed from history
  const olqScores = useMemo(() => {
    if (judgeReport?.olq_averages && Object.keys(judgeReport.olq_averages).length > 0) {
      return judgeReport.olq_averages
    }
    if (history && history.length > 0) {
      const fallback = synthesizePsychologicalReadiness(history)
      return fallback?.olq_averages || null
    }
    return null
  }, [judgeReport, history])

  return (
    <div className="page analytics-page">
      {/* Header Banner */}
      <section className="analytics-header-banner">
        <div>
          <span className="eyebrow"><BarChart3 size={15} /> Psychological Analytics</span>
          <h2>Candidate Assessment & Progress</h2>
          <p>
            Comprehensive analytics combining your performance across all five ISSB psychological tests
            with AI psychometric evaluation.
          </p>
        </div>
        <div className="analytics-banner-actions">
          <button
            className="secondary-button"
            onClick={handleRefreshAll}
            disabled={judgeLoading}
            title="Refresh candidate practice history and psychometric report"
          >
            <RefreshCw size={16} className={judgeLoading ? 'spin' : ''} /> Refresh
          </button>
          <Link to="/practice" className="primary-button">
            New Session <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Progress Cards Row */}
      <section className="analytics-stat-row">
        <div className="stat-card">
          <span className="stat-label">Total Practice Sessions</span>
          <strong className="stat-value">{stats.sessions}</strong>
          <small className="stat-sub">Across 5 test formats</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Overall Average Score</span>
          <strong className="stat-value">{stats.average} / 10</strong>
          <small className="stat-sub">{stats.sessions > 0 ? getScoreBand(stats.average).label : 'No tests yet'}</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Personal Best Score</span>
          <strong className="stat-value">{stats.best} / 10</strong>
          <small className="stat-sub">Top evaluated performance</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Coverage Breadth</span>
          <strong className="stat-value">
            {completedBatteriesCount} / 5
          </strong>
          <small className="stat-sub">Tests completed at least once</small>
        </div>
      </section>

      {/* Overall Judge Psychological Report */}
      <section className="surface overall-judge-card">
        <div className="judge-card-header">
          <div className="judge-title-wrap">
            <div className="judge-badge-group">
              <span className="judge-badge"><Sparkles size={16} /> Comprehensive AI Assessment</span>
              {judgeReport?.source === 'client_synthesis' ? (
                <span className="judge-source-tag local" title="Evaluated locally using candidate psychometric synthesis engine">
                  <Cpu size={13} /> Local Psychometric Engine · Active
                </span>
              ) : (
                <span className="judge-source-tag cloud" title="Evaluated using central cloud psychometric model">
                  <ShieldCheck size={13} /> Cloud Psychometric Model
                </span>
              )}
            </div>
            <h2>Overall Psychological Readiness</h2>
            <p>Synthesis of candidate profile, personality traits, and readiness indicators</p>
          </div>
          <button
            className="secondary-button judge-reeval-btn"
            onClick={() => loadJudge(true)}
            disabled={judgeLoading}
            title="Re-run assessment across all completed tests"
          >
            <RefreshCw size={15} className={judgeLoading ? 'spin' : ''} />
            {judgeLoading ? 'Analyzing Battery…' : 'Re-evaluate with AI'}
          </button>
        </div>

        {/* Polite status notice banner when cloud AI is unreachable */}
        {(judgeNotice || judgeReport?.source === 'client_synthesis') && !judgeLoading && (
          <div className="judge-notice-banner" role="status">
            <Info size={16} className="notice-icon" />
            <span>{judgeNotice || 'Remote AI Judge is currently unreachable. Displaying local psychometric synthesis from your practice history.'}</span>
            <div className="notice-actions">
              <button
                type="button"
                className="notice-retry-btn"
                onClick={() => loadJudge(true)}
                disabled={judgeLoading}
              >
                Retry Cloud
              </button>
              <button
                type="button"
                className="notice-dismiss-btn"
                onClick={() => setJudgeNotice('')}
                title="Dismiss notice"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {judgeLoading && !judgeReport ? (
          <div className="judge-loading-state">
            <LoaderCircle className="spin" size={38} />
            <h3>Generating psychometric evaluation…</h3>
            <p>Synthesizing candidate performance across PPDT, WAT, TAT, SDT, and SCT into an integrated profile.</p>
          </div>
        ) : judgeReport ? (
          <div className="judge-content">
            {/* Tactical Command Hero Grid */}
            <div className="judge-hero-grid">
              <div className="judge-score-box">
                <ReadinessRing score={displayScore} dark />
                <div className="judge-score-details">
                  <span className="eyebrow">Estimated ISSB Readiness</span>
                  <div className="tier-heading-row">
                    <h3 className="readiness-tier-title">{readinessTitle}</h3>
                    {readinessTierInfo && (
                      <span
                        className="readiness-tier-badge"
                        style={{
                          color: readinessTierInfo.color,
                          backgroundColor: readinessTierInfo.bg,
                          borderColor: readinessTierInfo.border,
                        }}
                      >
                        {readinessTierInfo.badge}
                      </span>
                    )}
                  </div>
                  <div className="judge-meta-tags">
                    <span className="confidence-tag">
                      Confidence: <b>{judgeReport.confidence_level || 'standard'}</b>
                    </span>
                    <span className="battery-count-tag">
                      <Layers size={13} /> {completedBatteriesCount}/5 Batteries Active
                    </span>
                  </div>
                </div>
              </div>

              {judgeReport.personality_profile_summary && (
                <div className="judge-summary-box">
                  <div className="summary-box-header">
                    <h4><Award size={18} /> Personality & Leadership Profile</h4>
                    <span className="eval-status-pill">Board Calibrated</span>
                  </div>
                  <p>{judgeReport.personality_profile_summary}</p>
                  
                  {/* Battery Coverage Indicator Chips */}
                  <div className="battery-coverage-chips">
                    <span className="coverage-label">Battery Coverage:</span>
                    {TEST_TYPES.map((t) => {
                      const count = history.filter((item) => item.type?.toUpperCase() === t.name).length
                      const hasData = count > 0
                      return (
                        <Link
                          key={t.id}
                          to={`/practice/${t.id}`}
                          className={`battery-chip ${hasData ? 'active' : 'pending'}`}
                          title={`${t.name} (${t.label}): ${count} attempt${count !== 1 ? 's' : ''}. Click to practice.`}
                        >
                          <span
                            className="chip-dot"
                            style={{ backgroundColor: hasData ? t.color : '#94a3b8' }}
                          />
                          <strong className="chip-name">{t.name}</strong>
                          <span className="chip-count">{hasData ? count : '+'}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cross-Test Battery Alignment & Consistency */}
            {judgeReport.consistency_analysis && (
              <div className="judge-consistency-box">
                <div className="consistency-header">
                  <div className="consistency-title">
                    <Compass size={18} className="consistency-icon" />
                    <strong>Cross-Test Battery Alignment & Consistency</strong>
                  </div>
                  {judgeReport.consistency_badge && (
                    <span className="consistency-badge-pill">{judgeReport.consistency_badge}</span>
                  )}
                </div>
                <p>{judgeReport.consistency_analysis}</p>
              </div>
            )}

            {/* Strengths & Improvement Areas */}
            <div className="judge-traits-grid">
              {judgeReport.key_strengths_across_tests?.length > 0 && (
                <div className="feedback-list-panel positive">
                  <div className="panel-title-wrap">
                    <h4><CheckCircle2 size={17} /> Key Strengths Across All Tests</h4>
                    <span className="count-pill positive">{judgeReport.key_strengths_across_tests.length} Identified</span>
                  </div>
                  <ul>
                    {judgeReport.key_strengths_across_tests.map((s, idx) => (
                      <li key={idx}>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {judgeReport.areas_needing_improvement?.length > 0 && (
                <div className="feedback-list-panel focus">
                  <div className="panel-title-wrap">
                    <h4><Flame size={17} /> Areas Needing Development</h4>
                    <span className="count-pill focus">{judgeReport.areas_needing_improvement.length} Focus Points</span>
                  </div>
                  <ul>
                    {judgeReport.areas_needing_improvement.map((a, idx) => (
                      <li key={idx}>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Cumulative OLQ Radar Chart and Matrix */}
            {olqScores && (
              <div className="judge-olq-section">
                <OlqScoreSection
                  scores={olqScores}
                  title="Cumulative Officer Like Qualities (OLQ) Profile"
                  showRadar={true}
                />
              </div>
            )}

            {/* Assessor's Strategic Directive */}
            {judgeReport.final_recommendation && (
              <div className="judge-final-recommendation">
                <div className="rec-icon-wrap">
                  <Lightbulb size={22} />
                </div>
                <div className="rec-body">
                  <strong>Assessor's Strategic Directive & Action Plan</strong>
                  <p>{judgeReport.final_recommendation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="judge-empty-state">
            <div className="empty-shield-wrap">
              <Shield size={40} className="empty-shield-icon" />
            </div>
            <h3>Psychological Readiness Profile Locked</h3>
            <p>
              The ISSB psychometric engine evaluates your responses across 5 core testing batteries
              to construct your cumulative 9-dimensional Officer Like Qualities (OLQ) dossier.
            </p>
            <div className="empty-quicklaunch-grid">
              {TEST_TYPES.map((t) => (
                <Link key={t.id} to={`/practice/${t.id}`} className="empty-test-card">
                  <div className="empty-test-top">
                    <span className="empty-card-dot" style={{ backgroundColor: t.color }} />
                    <strong>{t.name}</strong>
                  </div>
                  <span className="empty-test-label">{t.label}</span>
                </Link>
              ))}
            </div>
            <Link to="/practice" className="primary-button empty-action-btn">
              Begin First Psychological Test <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Test Breakdown Grid */}
      <section className="analytics-lower-grid">
        {/* Left Column: Per-test breakdown & distribution */}
        <div className="surface breakdown-surface">
          <header className="surface-header">
            <h2>Test Performance Breakdown</h2>
            <p>Score averages and attempt volume per test format</p>
          </header>

          <div className="test-breakdown-list">
            {perTestStats.map((t) => (
              <div key={t.id} className="test-breakdown-item">
                <div className="breakdown-info">
                  <strong>{t.name}</strong>
                  <span>{t.label}</span>
                </div>
                <div className="breakdown-metrics">
                  <span>{t.count} attempts</span>
                  <b>{t.avg ? `${t.avg}/10 avg` : 'No data'}</b>
                  {t.best && <small>Best: {t.best}</small>}
                </div>
                <Link to={`/practice/${t.id}`} className="test-action-link" aria-label={`Practice ${t.name}`}>
                  Practice
                </Link>
              </div>
            ))}
          </div>

          {/* Test Distribution Bar */}
          {history.length > 0 && (
            <div className="distribution-bar-section">
              <h4>Test Practice Distribution</h4>
              <div className="stacked-bar">
                {perTestStats.filter((t) => t.count > 0).map((t) => {
                  const pct = Math.round((t.count / history.length) * 100)
                  return (
                    <div
                      key={t.id}
                      className="stacked-bar-segment"
                      style={{ width: `${pct}%`, backgroundColor: t.color }}
                      title={`${t.name}: ${pct}% (${t.count} tests)`}
                    >
                      {pct > 12 && <span>{t.name} {pct}%</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Score Distribution & Trends */}
        <div className="analytics-side-col">
          {/* Score distribution */}
          <div className="surface side-card">
            <header className="surface-header">
              <h2>Score Distribution</h2>
              <p>Breakdown across quality tiers</p>
            </header>

            <div className="score-band-bars">
              <div className="score-band-row">
                <span>Excellent (8–10)</span>
                <div className="band-track">
                  <div
                    className="band-fill"
                    style={{
                      width: `${scoreBands.total > 0 ? (scoreBands.excellent / scoreBands.total) * 100 : 0}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
                <strong>{scoreBands.excellent}</strong>
              </div>

              <div className="score-band-row">
                <span>Good (6–7.9)</span>
                <div className="band-track">
                  <div
                    className="band-fill"
                    style={{
                      width: `${scoreBands.total > 0 ? (scoreBands.good / scoreBands.total) * 100 : 0}%`,
                      backgroundColor: '#13b8a8',
                    }}
                  />
                </div>
                <strong>{scoreBands.good}</strong>
              </div>

              <div className="score-band-row">
                <span>Fair (4–5.9)</span>
                <div className="band-track">
                  <div
                    className="band-fill"
                    style={{
                      width: `${scoreBands.total > 0 ? (scoreBands.fair / scoreBands.total) * 100 : 0}%`,
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
                <strong>{scoreBands.fair}</strong>
              </div>

              <div className="score-band-row">
                <span>Needs Work (&lt;4)</span>
                <div className="band-track">
                  <div
                    className="band-fill"
                    style={{
                      width: `${scoreBands.total > 0 ? (scoreBands.needsWork / scoreBands.total) * 100 : 0}%`,
                      backgroundColor: '#ef4444',
                    }}
                  />
                </div>
                <strong>{scoreBands.needsWork}</strong>
              </div>
            </div>
          </div>

          {/* Recent Trends */}
          {testTrends.length > 0 && (
            <div className="surface side-card">
              <header className="surface-header">
                <h2>Recent Trends</h2>
                <p>Recent tests compared to prior sessions</p>
              </header>

              <div className="trends-list">
                {testTrends.map((trend) => (
                  <div key={trend.name} className="trend-item">
                    <span>{trend.name}</span>
                    <div className="trend-val" style={{ color: trend.isPositive ? '#10b981' : '#ef4444' }}>
                      {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      <span>{trend.diff >= 0 ? `+${trend.diff}` : trend.diff} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Percentile Ranking Tool & Benchmark Averages */}
      <section className="surface benchmark-section">
        <div className="benchmark-grid">
          {/* Live Percentile Ranking Tool */}
          <div className="percentile-checker-box">
            <header className="surface-header">
              <h2>Check Your Percentile Rank</h2>
              <p>Compare any score against the live candidate database</p>
            </header>

            <form className="percentile-form" onSubmit={checkPercentile}>
              <div className="percentile-form-row">
                <label>
                  <span>Test Type</span>
                  <select
                    value={percentileForm.testType}
                    onChange={(e) => setPercentileForm({ ...percentileForm, testType: e.target.value })}
                  >
                    {TEST_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} — {t.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Score (0–10)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={percentileForm.score}
                    onChange={(e) => setPercentileForm({ ...percentileForm, score: e.target.value })}
                    required
                  />
                </label>

                <button className="primary-button" disabled={percentileLoading}>
                  {percentileLoading ? <LoaderCircle className="spin" size={16} /> : 'Calculate'}
                </button>
              </div>

              {percentileError && <p className="form-error">{percentileError}</p>}
            </form>

            {percentileResult && (
              <div className="percentile-result-display">
                <div className="percentile-stat">
                  <strong className="percentile-num">
                    Top {(100 - percentileResult.percentile).toFixed(0)}%
                  </strong>
                  <span>({percentileResult.percentile.toFixed(1)}th percentile)</span>
                </div>
                <div className="percentile-desc">
                  <b>{percentileResult.rank_description}</b>
                  <p>Compared across {percentileResult.total_candidates} registered candidate evaluations.</p>
                </div>
              </div>
            )}
          </div>

          {/* Benchmark Averages Table */}
          <div className="benchmark-table-box">
            <header className="surface-header">
              <h2>Candidate Averages</h2>
              <p>Anonymous benchmarks across all users</p>
            </header>

            {averagesLoading ? (
              <div className="mini-loading"><LoaderCircle className="spin" size={24} /></div>
            ) : averages.length > 0 ? (
              <div className="benchmark-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Attempts</th>
                      <th>Average</th>
                      <th>Median</th>
                      <th>Top Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {averages.map((avg) => (
                      <tr key={avg.test_type}>
                        <td><strong>{avg.test_type.toUpperCase()}</strong></td>
                        <td>{avg.total_attempts}</td>
                        <td>{Number(avg.average_score).toFixed(1)}</td>
                        <td>{Number(avg.median_score).toFixed(1)}</td>
                        <td><b className="top-score-badge">{Number(avg.best_score).toFixed(1)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="subtle-note">No benchmark aggregate available right now.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
