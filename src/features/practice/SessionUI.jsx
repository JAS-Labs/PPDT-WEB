import { ArrowLeft, Check, RotateCcw, X, Users, Lightbulb, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OlqScoreSection, { getScoreBand, OLQ_DEFINITIONS } from '../../components/OlqScoreSection'
import CommunityResponsesModal from '../../components/CommunityResponsesModal'

function formatTrait(item) {
  if (typeof item !== 'string') return item?.trait || JSON.stringify(item)
  const trimmed = item.trim()
  if (trimmed.length === 3 && trimmed === trimmed.toUpperCase()) {
    const def = OLQ_DEFINITIONS.find((d) => d.code === trimmed)
    if (def) return `${def.name} (${def.code}) — ${def.desc}`
  }
  return trimmed
}

function toList(val) {
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string' && val.trim()) return [val.trim()]
  return []
}

export function SessionHeader({ test, step, total, phase }) {
  return (
    <header className="session-header">
      <Link to="/practice" aria-label="Exit practice"><X /></Link>
      <div>
        <span>{phase || test.name}</span>
        <h1>{test.title}</h1>
      </div>
      {total ? <strong>{step}/{total}</strong> : <Link className="session-back" to="/practice"><ArrowLeft /> Library</Link>}
    </header>
  )
}

export function SessionResult({ test, score, detail, metrics = [], onAgain, feedback = null, imageId = null }) {
  const navigate = useNavigate()
  const [showCommunity, setShowCommunity] = useState(false)

  const numScore = Number(score) || 0
  const band = getScoreBand(numScore)

  const rawStrengths = (Array.isArray(feedback?.strengths) && feedback.strengths.length > 0)
    ? feedback.strengths
    : (Array.isArray(feedback?.positive_traits) && feedback.positive_traits.length > 0)
      ? feedback.positive_traits
      : (Array.isArray(feedback?.top_strengths) ? feedback.top_strengths : [])

  const rawAreas = (Array.isArray(feedback?.areas_of_improvement) && feedback.areas_of_improvement.length > 0)
    ? feedback.areas_of_improvement
    : (Array.isArray(feedback?.areas_of_concern) && feedback.areas_of_concern.length > 0)
      ? feedback.areas_of_concern
      : (Array.isArray(feedback?.improvement_areas) ? feedback.improvement_areas : [])

  const strengths = rawStrengths.map(formatTrait)
  const areas = rawAreas.map(formatTrait)

  // Red flags detection
  const redFlags = feedback?.red_flags || {}
  const activeFlags = []
  if (redFlags.aggression) activeFlags.push('Signs of aggression or violence')
  if (redFlags.hopelessness) activeFlags.push('Signs of hopelessness or fatalistic despair')
  if (redFlags.antisocial) activeFlags.push('Antisocial attitudes or behavior')
  if (redFlags.dishonesty) activeFlags.push('Signs of dishonesty or deceptive framing')
  if (redFlags.mental_health_concern) activeFlags.push('Emotional disturbance or psychological distress')
  const hasRedFlags = activeFlags.length > 0 || Boolean(redFlags.flag_details)

  return (
    <div className="session-page">
      <SessionHeader test={test} phase="Result" />
      <main className="result-panel">
        <span className="result-check"><Check /></span>
        <p className="eyebrow">Practice complete</p>
        <div className="result-score-block">
          <strong className="big-score">{score}</strong>
          <span className="out-of">/ 10</span>
          <span className="score-band-tag" style={{ color: band.color, backgroundColor: band.bg }}>
            {band.label}
          </span>
          {feedback?.composite_score && (
            <span className="composite-pill" title="Composite of 9 OLQ scores">
              OLQ: <b>{Number(feedback.composite_score).toFixed(1)}</b>
            </span>
          )}
          {feedback?.assessor_confidence && (
            <span className={`confidence-pill ${feedback.assessor_confidence}`}>
              {feedback.assessor_confidence} confidence
            </span>
          )}
        </div>
        <h2>Session saved</h2>
        <p className="result-detail-text">{detail}</p>

        {/* Red Flag Warning Alert */}
        {hasRedFlags && (
          <div className="red-flag-alert" role="alert">
            <div className="red-flag-head">
              <AlertOctagon size={18} />
              <strong>Assessor Flag Warning</strong>
            </div>
            <p className="red-flag-intro">
              This response contained traits that ISSB evaluators flag for psychological review:
            </p>
            {activeFlags.length > 0 && (
              <ul className="red-flag-list">
                {activeFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            )}
            {redFlags.flag_details && (
              <p className="red-flag-detail"><b>Assessor note:</b> {redFlags.flag_details}</p>
            )}
          </div>
        )}

        {metrics.length > 0 && (
          <div className="result-metrics">
            {metrics.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Section Breakdown for PPDT & TAT */}
        {(feedback?.spot_feedback || feedback?.action_feedback || feedback?.story_feedback) && (
          <div className="attempt-section-scores text-left">
            <h3>Section Scores & Rubrics</h3>
            <div className="section-cards-grid">
              {feedback.spot_feedback && (
                <div className="section-score-card">
                  <span>Spot Characters</span>
                  <strong>{Number(feedback.spot_feedback.score ?? 0).toFixed(1)}/10</strong>
                  <p>{feedback.spot_feedback.assessment || feedback.spot_feedback.feedback}</p>
                </div>
              )}
              {feedback.action_feedback && (
                <div className="section-score-card">
                  <span>Theme & Action</span>
                  <strong>{Number(feedback.action_feedback.score ?? 0).toFixed(1)}/10</strong>
                  <p>{feedback.action_feedback.theme_clarity || feedback.action_feedback.feedback}</p>
                </div>
              )}
              {feedback.story_feedback && (
                <div className="section-score-card">
                  <span>Story Structure</span>
                  <strong>{Number(feedback.story_feedback.score ?? 0).toFixed(1)}/10</strong>
                  <p>{feedback.story_feedback.structure || feedback.story_feedback.feedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test-Specific Deep Insights */}
        {(feedback?.emotional_stability || feedback?.leadership_potential || feedback?.social_adjustment || feedback?.response_patterns) && (
          <div className="specific-insights-grid text-left">
            {feedback.emotional_stability && (
              <div className="insight-chip-box">
                <b>Emotional Stability</b>
                <p>{feedback.emotional_stability}</p>
              </div>
            )}
            {feedback.leadership_potential && (
              <div className="insight-chip-box">
                <b>Leadership Potential</b>
                <p>{feedback.leadership_potential}</p>
              </div>
            )}
            {feedback.social_adjustment && (
              <div className="insight-chip-box">
                <b>Social Adjustment</b>
                <p>{feedback.social_adjustment}</p>
              </div>
            )}
            {feedback.response_patterns && (
              <div className="insight-chip-box">
                <b>Response Patterns</b>
                <p>{feedback.response_patterns}</p>
              </div>
            )}
          </div>
        )}

        {(feedback?.consistency_analysis || feedback?.social_perception || feedback?.self_insight || feedback?.aspiration_alignment) && (
          <div className="specific-insights-grid text-left">
            {feedback.consistency_analysis && (
              <div className="insight-chip-box highlight">
                <b>Consistency Analysis</b>
                <p>{feedback.consistency_analysis}</p>
              </div>
            )}
            {feedback.social_perception && (
              <div className="insight-chip-box">
                <b>Social Perception</b>
                <p>{feedback.social_perception}</p>
              </div>
            )}
            {feedback.self_insight && (
              <div className="insight-chip-box">
                <b>Self Insight</b>
                <p>{feedback.self_insight}</p>
              </div>
            )}
            {feedback.aspiration_alignment && (
              <div className="insight-chip-box">
                <b>Aspiration Alignment</b>
                <p>{feedback.aspiration_alignment}</p>
              </div>
            )}
          </div>
        )}

        {(feedback?.self_concept || feedback?.interpersonal_attitude || feedback?.aspiration_and_drive) && (
          <div className="specific-insights-grid text-left">
            {feedback.self_concept && (
              <div className="insight-chip-box">
                <b>Self Concept</b>
                <p>{feedback.self_concept}</p>
              </div>
            )}
            {feedback.interpersonal_attitude && (
              <div className="insight-chip-box">
                <b>Interpersonal Attitude</b>
                <p>{feedback.interpersonal_attitude}</p>
              </div>
            )}
            {feedback.aspiration_and_drive && (
              <div className="insight-chip-box">
                <b>Aspiration & Drive</b>
                <p>{feedback.aspiration_and_drive}</p>
              </div>
            )}
          </div>
        )}

        {(toList(feedback?.personality_indicators).length > 0 || toList(feedback?.emotional_traits).length > 0 || toList(feedback?.motivational_themes).length > 0 || feedback?.achievement_motivation) && (
          <div className="specific-insights-grid text-left">
            {toList(feedback.personality_indicators).length > 0 && (
              <div className="insight-chip-box">
                <b>Personality Indicators</b>
                <div className="tag-pills-wrap">
                  {toList(feedback.personality_indicators).map((t, idx) => (
                    <span key={idx} className="trait-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {toList(feedback.emotional_traits).length > 0 && (
              <div className="insight-chip-box">
                <b>Emotional Traits</b>
                <div className="tag-pills-wrap">
                  {toList(feedback.emotional_traits).map((t, idx) => (
                    <span key={idx} className="trait-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {toList(feedback.motivational_themes).length > 0 && (
              <div className="insight-chip-box">
                <b>Motivational Themes</b>
                <div className="tag-pills-wrap">
                  {toList(feedback.motivational_themes).map((t, idx) => (
                    <span key={idx} className="trait-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {feedback.achievement_motivation && (
              <div className="insight-chip-box">
                <b>Achievement Motivation</b>
                <p>{feedback.achievement_motivation}</p>
              </div>
            )}
          </div>
        )}

        {/* Rich Feedback when available */}
        {feedback?.olq_scores && (
          <div className="result-olq-wrap">
            <OlqScoreSection scores={feedback.olq_scores} compact />
          </div>
        )}

        {(strengths.length > 0 || areas.length > 0) && (
          <div className="result-feedback-cards">
            {strengths.length > 0 && (
              <div className="result-card positive">
                <h4><CheckCircle2 size={16} /> Key Strengths Identified</h4>
                <ul>
                  {strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {areas.length > 0 && (
              <div className="result-card warning">
                <h4><AlertTriangle size={16} /> Focus Areas for Next Session</h4>
                <ul>
                  {areas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {imageId && (test.id === 'ppdt' || test.id === 'tat') && (
          <div className="community-cta-box">
            <button
              className="secondary-button full"
              onClick={() => setShowCommunity(true)}
            >
              <Users size={18} /> View Other Candidates' Responses for this Picture
            </button>
          </div>
        )}

        <div className="result-actions">
          <button className="secondary-button" onClick={onAgain}>
            <RotateCcw /> Practice again
          </button>
          <button className="primary-button" onClick={() => navigate('/history')}>
            View history
          </button>
        </div>
      </main>

      {showCommunity && imageId && (
        <CommunityResponsesModal
          imageId={imageId}
          testType={test.id}
          onClose={() => setShowCommunity(false)}
        />
      )}
    </div>
  )
}

export function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
