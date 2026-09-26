import {
  AlertOctagon,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Users,
  X,
} from 'lucide-react'
import OlqScoreSection, { getScoreBand } from './OlqScoreSection'
import useDialogFocus from './useDialogFocus'

function toList(val) {
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string' && val.trim()) return [val.trim()]
  return []
}

export default function AttemptDetailModal({ attempt, onClose, onOpenCommunity }) {
  const dialogRef = useDialogFocus(onClose, Boolean(attempt))
  if (!attempt) return null

  const feedback = attempt.feedback || attempt.raw?.feedback || {}
  const score = Number(attempt.score ?? feedback.overall_score ?? 0)
  const band = getScoreBand(score)

  // Extract strengths and improvements safely
  const strengths = toList(feedback.strengths).length
    ? toList(feedback.strengths)
    : toList(feedback.positive_traits).length
      ? toList(feedback.positive_traits)
      : toList(feedback.top_strengths)

  const areas = toList(feedback.areas_of_improvement).length
    ? toList(feedback.areas_of_improvement)
    : toList(feedback.areas_of_concern).length
      ? toList(feedback.areas_of_concern)
      : toList(feedback.improvement_areas)

  // Extract submitted text responses
  const storyText = attempt.storyText || attempt.raw?.story_text
  const spotText = attempt.spotText || attempt.raw?.spot_text
  const actionText = attempt.actionText || attempt.raw?.action_text
  const logicText = attempt.logicText || attempt.raw?.logic_text
  const responses = attempt.responses || attempt.raw?.responses || []
  const imageId = attempt.imageId || attempt.raw?.image_id

  // Red flags inspection
  const redFlags = feedback.red_flags || {}
  const activeFlags = []
  if (redFlags.aggression) activeFlags.push('Signs of aggression or violence')
  if (redFlags.hopelessness) activeFlags.push('Signs of hopelessness or fatalistic despair')
  if (redFlags.antisocial) activeFlags.push('Antisocial attitudes or behavior')
  if (redFlags.dishonesty) activeFlags.push('Signs of dishonesty or deceptive framing')
  if (redFlags.mental_health_concern) activeFlags.push('Emotional disturbance or psychological distress')
  const hasRedFlags = activeFlags.length > 0 || Boolean(redFlags.flag_details)

  // Test type
  const type = (attempt.type || '').toUpperCase()

  return (
    <div className="modal-overlay" ref={dialogRef} tabIndex={-1} onClick={onClose} role="dialog" aria-modal="true" aria-label="Practice attempt details">
      <div className="modal-container attempt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className={`modal-type-badge ${type.toLowerCase()}`}>
              {type}
            </span>
            <div>
              <h2>Attempt Review</h2>
              <div className="modal-meta-row">
                <span><Calendar size={14} /> {attempt.date}</span>
                <span><Clock3 size={14} /> {attempt.duration}</span>
                {attempt.id && <small className="session-tag">ID: {String(attempt.id).slice(0, 12)}…</small>}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal"><X /></button>
        </div>

        <div className="modal-body">
          {/* Score & Evaluation Header Banner */}
          <div className="attempt-score-banner" style={{ borderLeftColor: band.color }}>
            <div>
              <span className="eyebrow">Assessor Verdict</span>
              <div className="score-lead">
                <strong className="score-num" style={{ color: band.color }}>{score.toFixed(1)}</strong>
                <span className="score-denom">/ 10</span>
                <span className="attempt-band-badge" style={{ backgroundColor: band.bg, color: band.color }}>
                  {band.label}
                </span>
                {feedback.composite_score && (
                  <span className="composite-pill" title="Average across all 9 standardized OLQ dimensions">
                    OLQ Composite: <b>{Number(feedback.composite_score).toFixed(1)}</b>
                  </span>
                )}
                {feedback.assessor_confidence && (
                  <span className={`confidence-pill ${feedback.assessor_confidence}`}>
                    {feedback.assessor_confidence} confidence
                  </span>
                )}
              </div>
            </div>

            {imageId && (type === 'PPDT' || type === 'TAT') && onOpenCommunity && (
              <button
                className="secondary-button community-btn"
                onClick={() => onOpenCommunity(imageId, type.toLowerCase())}
              >
                <Users size={16} /> Compare with Community
              </button>
            )}
          </div>

          {/* Red Flag Warning Notice if triggered */}
          {hasRedFlags && (
            <div className="red-flag-alert" role="alert">
              <div className="red-flag-head">
                <AlertOctagon size={18} />
                <strong>Psychometric Red Flag Warning</strong>
              </div>
              <p className="red-flag-intro">
                The assessor identified potential warning indicators in this attempt. In official ISSB selection, these indicators trigger closer scrutiny by the psychologist.
              </p>
              {activeFlags.length > 0 && (
                <ul className="red-flag-list">
                  {activeFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              )}
              {redFlags.flag_details && (
                <p className="red-flag-detail"><b>Assessor Note:</b> {redFlags.flag_details}</p>
              )}
            </div>
          )}

          {/* Section Breakdown for PPDT & TAT */}
          {(feedback.spot_feedback || feedback.action_feedback || feedback.story_feedback) && (
            <div className="attempt-section-scores">
              <h3>Section Scores & Rubrics</h3>
              <div className="section-cards-grid">
                {feedback.spot_feedback && (
                  <div className="section-score-card">
                    <span>Spot Characters</span>
                    <strong>{Number(feedback.spot_feedback.score ?? 0).toFixed(1)}/10</strong>
                    <p>{feedback.spot_feedback.assessment || feedback.spot_feedback.feedback}</p>
                    {feedback.spot_feedback.characters_identified > 0 && (
                      <small className="section-stat">Identified: {feedback.spot_feedback.characters_identified} characters</small>
                    )}
                  </div>
                )}
                {feedback.action_feedback && (
                  <div className="section-score-card">
                    <span>Theme & Action</span>
                    <strong>{Number(feedback.action_feedback.score ?? 0).toFixed(1)}/10</strong>
                    <p>{feedback.action_feedback.theme_clarity || feedback.action_feedback.feedback}</p>
                    {feedback.action_feedback.relevance && (
                      <small className="section-stat">Relevance: {feedback.action_feedback.relevance}</small>
                    )}
                  </div>
                )}
                {feedback.story_feedback && (
                  <div className="section-score-card">
                    <span>Story Structure</span>
                    <strong>{Number(feedback.story_feedback.score ?? 0).toFixed(1)}/10</strong>
                    <p>{feedback.story_feedback.structure || feedback.story_feedback.feedback}</p>
                    {(feedback.story_feedback.hero_development || feedback.story_feedback.hero_identification) && (
                      <small className="section-stat">Hero: {feedback.story_feedback.hero_development || feedback.story_feedback.hero_identification}</small>
                    )}
                    {(feedback.story_feedback.positive_outcome || feedback.story_feedback.outcome_assessment) && (
                      <small className="section-stat">Outcome: {feedback.story_feedback.positive_outcome || feedback.story_feedback.outcome_assessment}</small>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OLQ Scores breakdown */}
          {feedback.olq_scores && (
            <OlqScoreSection scores={feedback.olq_scores} title="Assessed Officer Like Qualities" />
          )}

          {/* Core Psychological Assessment & Personality Profile */}
          {(feedback.psychological_analysis || feedback.personality_assessment || feedback.self_perception_summary || feedback.detailed_feedback) && (
            <div className="attempt-analysis-box">
              <h3><Award size={18} /> Psychological Assessment</h3>
              {feedback.psychological_analysis && <p>{feedback.psychological_analysis}</p>}
              {feedback.personality_assessment && <p>{feedback.personality_assessment}</p>}
              {feedback.self_perception_summary && <p>{feedback.self_perception_summary}</p>}
              {feedback.detailed_feedback && <p className="detailed-fb">{feedback.detailed_feedback}</p>}
            </div>
          )}

          {/* Test-Specific Deep Insights */}
          {/* WAT Insights */}
          {(feedback.emotional_stability || feedback.leadership_potential || feedback.social_adjustment || feedback.response_patterns) && (
            <div className="specific-insights-grid">
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

          {/* SDT Insights */}
          {(feedback.consistency_analysis || feedback.social_perception || feedback.self_insight || feedback.aspiration_alignment) && (
            <div className="specific-insights-grid">
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

          {/* SCT Insights */}
          {(feedback.self_concept || feedback.interpersonal_attitude || feedback.aspiration_and_drive) && (
            <div className="specific-insights-grid">
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

          {/* TAT Insights */}
          {(toList(feedback.personality_indicators).length > 0 || toList(feedback.emotional_traits).length > 0 || toList(feedback.motivational_themes).length > 0 || feedback.social_orientation || feedback.achievement_motivation) && (
            <div className="specific-insights-grid">
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

          {/* PPDT Narrative Indicators */}
          {(feedback.leadership_indicators || feedback.narrative_coherence || feedback.character_development) && (
            <div className="specific-insights-grid">
              {feedback.leadership_indicators && (
                <div className="insight-chip-box">
                  <b>Leadership Indicators</b>
                  <p>{feedback.leadership_indicators}</p>
                </div>
              )}
              {feedback.narrative_coherence && (
                <div className="insight-chip-box">
                  <b>Narrative Coherence</b>
                  <p>{feedback.narrative_coherence}</p>
                </div>
              )}
              {feedback.character_development && (
                <div className="insight-chip-box">
                  <b>Character Development</b>
                  <p>{feedback.character_development}</p>
                </div>
              )}
            </div>
          )}

          {/* Strengths & Improvements */}
          {(strengths.length > 0 || areas.length > 0) && (
            <div className="strengths-improvements-grid">
              {strengths.length > 0 && (
                <div className="feedback-list-panel positive">
                  <h4><CheckCircle2 size={16} /> Key Strengths</h4>
                  <ul>
                    {strengths.map((item, idx) => (
                      <li key={idx}>{typeof item === 'string' ? item : item.trait || JSON.stringify(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {areas.length > 0 && (
                <div className="feedback-list-panel focus">
                  <h4><AlertTriangle size={16} /> Areas for Growth</h4>
                  <ul>
                    {areas.map((item, idx) => (
                      <li key={idx}>{typeof item === 'string' ? item : item.trait || JSON.stringify(item)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Assessor Recommendation */}
          {feedback.recommendation && (
            <div className="attempt-recommendation">
              <Lightbulb size={20} />
              <div>
                <b>Assessor Recommendation</b>
                <p>{feedback.recommendation}</p>
              </div>
            </div>
          )}

          {/* Candidate's submitted response */}
          <div className="attempt-response-view">
            <h3><FileText size={18} /> Submitted Response</h3>

            {spotText && (
              <div className="response-part">
                <span className="response-part-title">1. Spot Characters</span>
                <p>{spotText}</p>
              </div>
            )}

            {actionText && (
              <div className="response-part">
                <span className="response-part-title">2. Action / Theme</span>
                <p>{actionText}</p>
              </div>
            )}

            {storyText && (
              <div className="response-part">
                <span className="response-part-title">{spotText ? '3. Narrative Story' : 'Story Narrative'}</span>
                <p className="story-prose">{storyText}</p>
              </div>
            )}

            {logicText && (
              <div className="response-part">
                <span className="response-part-title">4. Reasoning & Details</span>
                <p>{logicText}</p>
              </div>
            )}

            {Array.isArray(responses) && responses.length > 0 && (
              <div className="prompt-responses-table">
                <div className="prompt-responses-header">
                  <span>Prompt</span>
                  <span>Your Response</span>
                  {responses[0]?.response_time_ms && <span>Time</span>}
                </div>
                {responses.map((item, idx) => (
                  <div key={idx} className="prompt-response-row">
                    <b>{item.word || item.stem || item.prompt || `Item #${idx + 1}`}</b>
                    <span>{item.response || '—'}</span>
                    {item.response_time_ms && (
                      <small>{(item.response_time_ms / 1000).toFixed(1)}s</small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
