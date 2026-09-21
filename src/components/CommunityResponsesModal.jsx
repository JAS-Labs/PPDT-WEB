import { useEffect, useState } from 'react'
import { AlertCircle, LoaderCircle, Users, X, Award } from 'lucide-react'
import { practiceApi } from '../services/liveApi'
import { getScoreBand } from './OlqScoreSection'

export default function CommunityResponsesModal({ imageId, testType = 'ppdt', onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [responses, setResponses] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function loadResponses() {
      if (!imageId) return
      setLoading(true)
      setError('')
      try {
        const data = testType === 'tat'
          ? await practiceApi.getTatImageResponses(imageId, 20)
          : await practiceApi.getImageResponses(imageId, 20)
        if (!cancelled) {
          setResponses(data.responses || [])
          setTotal(data.total_responses || 0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load community responses.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadResponses()
    return () => { cancelled = true }
  }, [imageId, testType])

  const averageScore = responses.length > 0
    ? (responses.reduce((sum, r) => sum + (Number(r.overall_score) || 0), 0) / responses.length).toFixed(1)
    : null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container community-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon"><Users /></span>
            <div>
              <h2>Community Responses</h2>
              <p>Learn how other candidates interpreted this exact picture</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal"><X /></button>
        </div>

        {loading ? (
          <div className="modal-body modal-loading">
            <LoaderCircle className="spin" />
            <p>Loading candidate responses from live service…</p>
          </div>
        ) : error ? (
          <div className="modal-body modal-error">
            <AlertCircle />
            <p>{error}</p>
          </div>
        ) : responses.length === 0 ? (
          <div className="modal-body modal-empty">
            <Users />
            <p>No community responses recorded yet for this image.</p>
            <small>Be among the first candidates to have your submission evaluated!</small>
          </div>
        ) : (
          <div className="modal-body">
            <div className="community-summary-bar">
              <div>
                <strong>{total}</strong>
                <span>Peer submissions</span>
              </div>
              {averageScore && (
                <div>
                  <strong>{averageScore} / 10</strong>
                  <span>Community average score</span>
                </div>
              )}
            </div>

            <div className="community-responses-list">
              {responses.map((resp, idx) => {
                const score = Number(resp.overall_score ?? 0)
                const band = getScoreBand(score)
                return (
                  <article key={resp.response_id || idx} className="community-card">
                    <div className="community-card-head">
                      <span className="peer-badge">
                        <Award /> Candidate #{resp.response_id || idx + 1}
                      </span>
                      <strong className="community-score" style={{ color: band.color, backgroundColor: band.bg }}>
                        Score: {score.toFixed(1)}/10 · {band.label}
                      </strong>
                    </div>

                    {resp.spot_text && (
                      <div className="community-field">
                        <b>Spot / Characters:</b>
                        <p>{resp.spot_text}</p>
                      </div>
                    )}

                    {resp.action_text && (
                      <div className="community-field">
                        <b>Action / Theme:</b>
                        <p>{resp.action_text}</p>
                      </div>
                    )}

                    <div className="community-field">
                      <b>Story:</b>
                      <p className="community-story-text">{resp.story_text}</p>
                    </div>

                    {resp.logic_text && (
                      <div className="community-field">
                        <b>Reasoning:</b>
                        <p>{resp.logic_text}</p>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
