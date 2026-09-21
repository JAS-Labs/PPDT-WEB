import { useState, useMemo } from 'react'
import {
  Compass,
  BarChart3,
  Layers,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { OLQ_DEFINITIONS, getScoreBand } from './OlqScoreSection'

const BENCHMARK_THRESHOLD = 7.0
const RINGS = [2, 4, 6, 8, 10]
const CX = 250
const CY = 210
const RADIUS = 135
const TOTAL_DIMS = 9

/**
 * Calculates vertex coordinates on the 9-dimensional psychometric radar
 */
function getVertexCoords(index, score, radius = RADIUS, cx = CX, cy = CY) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / TOTAL_DIMS
  const clampedScore = Math.max(0, Math.min(10, score))
  const r = (clampedScore / 10) * radius
  const x = cx + r * Math.cos(angle)
  const y = cy + r * Math.sin(angle)
  return { x, y, angle }
}

export default function OlqRadarChart({
  scores,
  title = 'Cumulative Officer Like Qualities (OLQ) Profile',
  defaultView = 'radar',
  showControls = true,
  compact = false,
}) {
  const [viewMode, setViewMode] = useState(compact ? 'matrix' : defaultView) // 'radar' | 'matrix' | 'dual'
  const [activeCode, setActiveCode] = useState(null)

  // Normalize scores across all 9 dimensions
  const normalized = useMemo(() => {
    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) return []

    const hasAnyScore = OLQ_DEFINITIONS.some((def) => scores[def.code] !== undefined && scores[def.code] !== null)
    if (!hasAnyScore) return []

    return OLQ_DEFINITIONS.map((def, index) => {
      const raw = scores[def.code]
      let scoreVal = 0
      let evidence = null
      let confidence = null

      if (raw !== undefined && raw !== null) {
        if (typeof raw === 'object') {
          scoreVal = Number(raw.score ?? 0)
          evidence = raw.evidence || null
          confidence = raw.confidence || null
        } else {
          scoreVal = Number(raw)
        }
      }

      if (isNaN(scoreVal)) scoreVal = 0
      scoreVal = Math.max(0, Math.min(10, scoreVal))

      return {
        ...def,
        index,
        score: scoreVal,
        evidence,
        confidence,
        band: getScoreBand(scoreVal),
      }
    })
  }, [scores])

  // Summary statistics
  const stats = useMemo(() => {
    if (normalized.length === 0) return null
    const sorted = [...normalized].sort((a, b) => b.score - a.score)
    const sum = normalized.reduce((acc, curr) => acc + curr.score, 0)
    const mean = sum / normalized.length
    const top = sorted[0]
    const bottom = sorted[sorted.length - 1]
    const spread = top.score - bottom.score

    let balanceRating = 'High Stability'
    let balanceColor = '#10b981'
    if (spread > 2.5) {
      balanceRating = 'Format Variance'
      balanceColor = '#f59e0b'
    } else if (spread > 1.5) {
      balanceRating = 'Moderate Spread'
      balanceColor = '#0d9488'
    }

    return {
      top,
      bottom,
      mean: Number(mean.toFixed(1)),
      spread: Number(spread.toFixed(1)),
      balanceRating,
      balanceColor,
    }
  }, [normalized])

  // Active dimension for inspector card (defaults to top strength)
  const activeItem = useMemo(() => {
    if (!normalized.length) return null
    if (activeCode) {
      return normalized.find((item) => item.code === activeCode) || normalized[0]
    }
    return stats?.top || normalized[0]
  }, [normalized, activeCode, stats])

  if (normalized.length === 0) return null

  // Polygon coordinate paths
  const polygonPoints = normalized
    .map((item, idx) => {
      const { x, y } = getVertexCoords(idx, item.score)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const benchmarkPoints = normalized
    .map((_, idx) => {
      const { x, y } = getVertexCoords(idx, BENCHMARK_THRESHOLD)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className={`olq-radar-wrapper ${compact ? 'compact' : ''}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="olq-radar-header">
        <div className="olq-title-group">
          <div className="olq-eyebrow">
            <Compass size={14} className="olq-eyebrow-icon" />
            <span>Psychometric Assessment · 9-Dimensional Matrix</span>
          </div>
          <h3>{title}</h3>
          <p className="olq-subtitle">
            Evaluated against the official ISSB Board Qualifying Standard ({BENCHMARK_THRESHOLD}/10).
          </p>
        </div>

        {showControls && !compact && (
          <div className="radar-view-toggles" role="tablist" aria-label="OLQ View Modes">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'radar'}
              className={`radar-toggle-btn ${viewMode === 'radar' ? 'active' : ''}`}
              onClick={() => setViewMode('radar')}
            >
              <Compass size={14} /> Radar Chart
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'matrix'}
              className={`radar-toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
            >
              <BarChart3 size={14} /> Dimension Cards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'dual'}
              className={`radar-toggle-btn ${viewMode === 'dual' ? 'active' : ''}`}
              onClick={() => setViewMode('dual')}
            >
              <Layers size={14} /> Dual View
            </button>
          </div>
        )}
      </div>

      {/* Tactical Metric Strip */}
      {stats && !compact && (
        <div className="olq-tactical-strip">
          <div className="olq-strip-item top-strength">
            <span className="strip-label">
              <Sparkles size={13} className="strip-icon" /> Top Quality
            </span>
            <div className="strip-val-wrap">
              <strong>{stats.top.code} · {stats.top.name}</strong>
              <span className="strip-score" style={{ color: stats.top.band.color }}>
                {stats.top.score.toFixed(1)}/10
              </span>
            </div>
          </div>

          <div className="olq-strip-item focus-area">
            <span className="strip-label">
              <Target size={13} className="strip-icon" /> Developmental Focus
            </span>
            <div className="strip-val-wrap">
              <strong>{stats.bottom.code} · {stats.bottom.name}</strong>
              <span className="strip-score" style={{ color: stats.bottom.band.color }}>
                {stats.bottom.score.toFixed(1)}/10
              </span>
            </div>
          </div>

          <div className="olq-strip-item olq-mean">
            <span className="strip-label">
              <TrendingUp size={13} className="strip-icon" /> Composite OLQ Index
            </span>
            <div className="strip-val-wrap">
              <strong>{stats.mean} / 10</strong>
              <span className="strip-score-band">
                {getScoreBand(stats.mean).label}
              </span>
            </div>
          </div>

          <div className="olq-strip-item balance-rating">
            <span className="strip-label">
              <ShieldCheck size={13} className="strip-icon" /> Psychometric Balance
            </span>
            <div className="strip-val-wrap">
              <strong style={{ color: stats.balanceColor }}>{stats.balanceRating}</strong>
              <span className="strip-delta">Δ {stats.spread} pts spread</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`olq-display-layout view-${viewMode}`}>
        {/* Radar Chart Visual Section */}
        {(viewMode === 'radar' || viewMode === 'dual') && (
          <div className="radar-visual-panel">
            <div className="radar-chart-container">
              <svg
                viewBox="0 0 500 420"
                className="radar-svg"
                role="img"
                aria-label="9-dimensional OLQ radar psychometric chart"
              >
                <defs>
                  {/* Subtle teal radar fill gradient */}
                  <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#0d9488" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0.12" />
                  </radialGradient>

                  {/* Highlight active spoke gradient */}
                  <linearGradient id="activeSpokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Drop shadow for polygon */}
                  <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0d9488" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* 1. Concentric Polygon Guide Rings */}
                {RINGS.map((ringScore) => {
                  const ringPoints = normalized
                    .map((_, idx) => {
                      const { x, y } = getVertexCoords(idx, ringScore)
                      return `${x.toFixed(1)},${y.toFixed(1)}`
                    })
                    .join(' ')

                  return (
                    <g key={ringScore} className="radar-grid-group">
                      <polygon
                        points={ringPoints}
                        className="radar-grid-ring"
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.22)"
                        strokeWidth="1"
                        strokeDasharray={ringScore === 10 ? 'none' : '2,3'}
                      />
                      {/* Ring score label on vertical top axis */}
                      <text
                        x={CX + 4}
                        y={CY - (ringScore / 10) * RADIUS + 4}
                        className="radar-grid-score-label"
                        fontSize="9"
                        fill="#94a3b8"
                      >
                        {ringScore}
                      </text>
                    </g>
                  )
                })}

                {/* 2. 9 Radial Spokes */}
                {normalized.map((item, idx) => {
                  const { x, y } = getVertexCoords(idx, 10)
                  const isActive = activeItem?.code === item.code

                  return (
                    <line
                      key={item.code}
                      x1={CX}
                      y1={CY}
                      x2={x}
                      y2={y}
                      stroke={isActive ? '#0d9488' : 'rgba(148, 163, 184, 0.25)'}
                      strokeWidth={isActive ? '1.8' : '1'}
                      strokeDasharray={isActive ? 'none' : '3,3'}
                      className="radar-spoke"
                    />
                  )
                })}

                {/* 3. ISSB Benchmark Ring (Threshold: 7.0) */}
                <polygon
                  points={benchmarkPoints}
                  className="radar-benchmark-ring"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.8"
                />

                {/* 4. Candidate Evaluated Data Polygon */}
                <polygon
                  points={polygonPoints}
                  className="radar-polygon"
                  fill="url(#radarAreaGradient)"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  filter="url(#radarGlow)"
                />

                {/* 5. Interactive Vertex Data Points */}
                {normalized.map((item, idx) => {
                  const { x, y } = getVertexCoords(idx, item.score)
                  const isActive = activeItem?.code === item.code

                  return (
                    <g
                      key={item.code}
                      className="radar-vertex-group"
                      onClick={() => setActiveCode(item.code)}
                      onMouseEnter={() => setActiveCode(item.code)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Active glow halo */}
                      {isActive && (
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill="#0d9488"
                          fillOpacity="0.25"
                          className="radar-vertex-halo"
                        />
                      )}

                      {/* Outer boundary circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isActive ? '6' : '4.5'}
                        fill="#fff"
                        stroke={item.band.color}
                        strokeWidth={isActive ? '2.5' : '2'}
                        className="radar-vertex-outer"
                      />

                      {/* Inner score core dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill={item.band.color}
                        className="radar-vertex-inner"
                      />
                    </g>
                  )
                })}

                {/* 6. Outer Axis Labels with interactive selection */}
                {normalized.map((item, idx) => {
                  const { x, y, angle } = getVertexCoords(idx, 10, RADIUS + 26)
                  const isActive = activeItem?.code === item.code

                  // Smart text alignment based on quadrant
                  const cos = Math.cos(angle)
                  const sin = Math.sin(angle)
                  let textAnchor = 'middle'
                  if (cos > 0.28) textAnchor = 'start'
                  else if (cos < -0.28) textAnchor = 'end'

                  let dy = '4'
                  if (sin < -0.35) dy = '-4'
                  else if (sin > 0.35) dy = '13'

                  return (
                    <g
                      key={item.code}
                      className={`radar-axis-label-group ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveCode(item.code)}
                      onMouseEnter={() => setActiveCode(item.code)}
                      style={{ cursor: 'pointer' }}
                    >
                      <text
                        x={x}
                        y={y}
                        dy={dy}
                        textAnchor={textAnchor}
                        className="radar-axis-label-code"
                        fontSize={isActive ? '12' : '11'}
                        fontWeight={isActive ? '800' : '700'}
                        fill={isActive ? '#0f766e' : '#1e293b'}
                      >
                        {item.code}
                        <tspan
                          dx="4"
                          fontSize="10"
                          fontWeight="700"
                          fill={item.band.color}
                        >
                          {item.score.toFixed(1)}
                        </tspan>
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* Benchmark Legend Pin */}
              <div className="radar-legend-bar">
                <span className="legend-item candidate">
                  <span className="legend-line candidate" /> Candidate Score Polygon
                </span>
                <span className="legend-item benchmark">
                  <span className="legend-line benchmark" /> ISSB Board Standard (7.0)
                </span>
              </div>
            </div>

            {/* Tactical Dimension Inspector Card */}
            {activeItem && (
              <div className="radar-inspector-card">
                <div className="inspector-top-row">
                  <div className="inspector-title-wrap">
                    <span className="inspector-badge">{activeItem.code}</span>
                    <div>
                      <h4>{activeItem.name}</h4>
                      <small className="inspector-category">Core Officer Dimension</small>
                    </div>
                  </div>

                  <div className="inspector-score-pill" style={{ color: activeItem.band.color, backgroundColor: activeItem.band.bg }}>
                    <strong>{activeItem.score.toFixed(1)}</strong>
                    <span>/ 10 · {activeItem.band.label}</span>
                  </div>
                </div>

                <p className="inspector-desc">{activeItem.desc}</p>

                {/* Benchmark Comparison Tag */}
                <div className="inspector-benchmark-row">
                  {activeItem.score >= BENCHMARK_THRESHOLD ? (
                    <span className="radar-delta-tag positive">
                      <CheckCircle2 size={14} /> Exceeds ISSB Qualifying Threshold (+{(activeItem.score - BENCHMARK_THRESHOLD).toFixed(1)} pts)
                    </span>
                  ) : (
                    <span className="radar-delta-tag focus">
                      <AlertTriangle size={14} /> Below ISSB Benchmark (-{(BENCHMARK_THRESHOLD - activeItem.score).toFixed(1)} pts) · Recommended Development Area
                    </span>
                  )}

                  {activeItem.confidence && (
                    <span className="inspector-confidence-pill">
                      Confidence: <b>{activeItem.confidence}</b>
                    </span>
                  )}
                </div>

                {activeItem.evidence && (
                  <div className="inspector-evidence-box">
                    <span className="evidence-label">Observed Candidate Evidence:</span>
                    <p>“{activeItem.evidence}”</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dimension Cards Matrix View Section */}
        {(viewMode === 'matrix' || viewMode === 'dual') && (
          <div className="radar-matrix-panel">
            <div className="olq-grid">
              {normalized.map((item) => {
                const isActive = activeItem?.code === item.code
                const delta = Number((item.score - BENCHMARK_THRESHOLD).toFixed(1))
                const exceedsBenchmark = delta >= 0

                return (
                  <div
                    key={item.code}
                    className={`olq-card ${isActive ? 'highlighted' : ''}`}
                    onClick={() => setActiveCode(item.code)}
                    onMouseEnter={() => setActiveCode(item.code)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="olq-card-top">
                      <div className="olq-card-identity">
                        <span className="olq-code">{item.code}</span>
                        <strong className="olq-name">{item.name}</strong>
                      </div>
                      <strong className="olq-score" style={{ color: item.band.color }}>
                        {item.score.toFixed(1)}
                      </strong>
                    </div>

                    {/* Progress Track with 7.0 Benchmark Target Marker */}
                    <div className="olq-bar-track-wrapper">
                      <div className="olq-bar-track">
                        <div
                          className="olq-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, (item.score / 10) * 100))}%`,
                            backgroundColor: item.band.color,
                          }}
                        />
                        {/* 7.0 Benchmark Indicator Notch */}
                        <div
                          className="olq-benchmark-notch"
                          title="ISSB Board Benchmark: 7.0"
                          style={{ left: '70%' }}
                        />
                      </div>
                    </div>

                    <div className="olq-card-meta">
                      <span className="olq-band-pill" style={{ color: item.band.color, backgroundColor: item.band.bg }}>
                        {item.band.label}
                      </span>
                      <span className={`olq-delta-pill ${exceedsBenchmark ? 'above' : 'below'}`}>
                        {exceedsBenchmark ? `+${delta}` : delta} vs Board
                      </span>
                      {item.confidence && (
                        <small className="olq-confidence">{item.confidence}</small>
                      )}
                    </div>

                    <p className="olq-dimension-desc">{item.desc}</p>

                    {item.evidence && (
                      <p className="olq-evidence">“{item.evidence}”</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
