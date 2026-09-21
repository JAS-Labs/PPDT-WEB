import OlqRadarChart from './OlqRadarChart'

export const OLQ_DEFINITIONS = [
  { code: 'LDR', name: 'Leadership', desc: 'Ability to lead, inspire, and take initiative.' },
  { code: 'EMS', name: 'Emotional Stability', desc: 'Composure and psychological balance under pressure.' },
  { code: 'SOI', name: 'Social Intelligence', desc: 'Empathy, cooperation, teamwork, and social awareness.' },
  { code: 'DEM', name: 'Decision Making', desc: 'Rational, decisive, and timely action at key points.' },
  { code: 'POO', name: 'Positive Outlook', desc: 'Optimism, constructive framing, and hopeful endings.' },
  { code: 'MNT', name: 'Mental Toughness', desc: 'Perseverance, resilience, and grit in overcoming obstacles.' },
  { code: 'COM', name: 'Communication', desc: 'Clarity, structure, and effectiveness of narrative expression.' },
  { code: 'MOI', name: 'Moral Integrity', desc: 'Honesty, ethical responsibility, and dedication to duty.' },
  { code: 'SOR', name: 'Sense of Responsibility', desc: 'Accountability, duty consciousness, and ownership.' },
]

export function getScoreBand(score) {
  const num = Number(score)
  if (num >= 8) return { label: 'Excellent', color: '#10b981', bg: '#e8f8f2' }
  if (num >= 6) return { label: 'Good', color: '#13b8a8', bg: '#e0f8f5' }
  if (num >= 4) return { label: 'Fair', color: '#f59e0b', bg: '#fef3c7' }
  return { label: 'Needs Work', color: '#ef4444', bg: '#fee2e2' }
}

export default function OlqScoreSection({
  scores,
  title = 'Officer Like Qualities (OLQ)',
  compact = false,
  showRadar = false,
  defaultView = 'radar',
}) {
  if (!scores || typeof scores !== 'object') return null

  // If radar visualization is requested and not in compact mode, delegate to OlqRadarChart
  if (showRadar && !compact) {
    return <OlqRadarChart scores={scores} title={title} defaultView={defaultView} compact={compact} />
  }

  // Normalize: scores could be { LDR: { score: 7.5, evidence: '...' } } or { LDR: 7.5 }
  const normalized = OLQ_DEFINITIONS.map((def) => {
    const raw = scores[def.code]
    if (raw === undefined || raw === null) return null
    const scoreVal = typeof raw === 'object' ? Number(raw.score ?? 0) : Number(raw)
    const evidence = typeof raw === 'object' ? raw.evidence : null
    const confidence = typeof raw === 'object' ? raw.confidence : null
    return {
      ...def,
      score: scoreVal,
      evidence,
      confidence,
      band: getScoreBand(scoreVal),
    }
  }).filter(Boolean)

  if (normalized.length === 0) return null

  return (
    <div className={`olq-section ${compact ? 'compact' : ''}`}>
      <div className="olq-header">
        <h3>{title}</h3>
        <span className="olq-scale-hint">Assessed across 9 core leadership dimensions</span>
      </div>

      <div className="olq-grid">
        {normalized.map((item) => (
          <div key={item.code} className="olq-card">
            <div className="olq-card-top">
              <span className="olq-code">{item.code}</span>
              <span className="olq-name">{item.name}</span>
              <strong className="olq-score" style={{ color: item.band.color }}>
                {item.score.toFixed(1)}
              </strong>
            </div>

            <div className="olq-bar-track">
              <div
                className="olq-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, (item.score / 10) * 100))}%`,
                  backgroundColor: item.band.color,
                }}
              />
            </div>

            <div className="olq-card-meta">
              <span className="olq-band-pill" style={{ color: item.band.color, backgroundColor: item.band.bg }}>
                {item.band.label}
              </span>
              {item.confidence && (
                <small className="olq-confidence">{item.confidence} confidence</small>
              )}
            </div>

            {item.evidence && (
              <p className="olq-evidence">“{item.evidence}”</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
