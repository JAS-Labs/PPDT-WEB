import { AlertCircle, ArrowLeft, ArrowRight, Clock3, Eye, Lightbulb, LoaderCircle, Play, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import useSessionDraft from './useSessionDraft'
import { practiceApi } from '../../services/liveApi'
import { useApp } from '../../state/AppContext'
import { SessionHeader, SessionResult, formatClock } from './SessionUI'

const empty = { spot: '', action: '', story: '', logic: '' }
const fields = [
  { key: 'spot', label: 'Spot', title: 'Who and what do you notice?', hint: 'People, approximate age, mood, setting, and relevant details.' },
  { key: 'action', label: 'Action', title: 'What is the central action or theme?', hint: 'Give your story a clear, concise direction.' },
  { key: 'story', label: 'Story', title: 'Write the complete narrative', hint: 'Include the situation, central character, purposeful action, and outcome.' },
  { key: 'logic', label: 'Reasoning', title: 'Why did you interpret it this way?', hint: 'Connect visible details to the story choices you made.' },
]

export default function PpdtSession({ test }) {
  const { addAttempt } = useApp()
  const [phase, setPhase] = useState('setup')
  const [difficulty, setDifficulty] = useState('all')
  const [observeLeft, setObserveLeft] = useState(30)
  const [writeLeft, setWriteLeft] = useState(240)
  const [activeField, setActiveField] = useState(0)
  const [answers, setAnswers] = useState(empty)
  const [image, setImage] = useState(null)
  const [showRefImage, setShowRefImage] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const filled = useMemo(() => fields.filter((field) => answers[field.key].trim()).length, [answers])
  const canFinish = Boolean(answers.spot.trim() && answers.action.trim() && answers.story.trim())


  const clearDraft = useSessionDraft(test.id, phase,
    { phase, image, observeLeft, writeLeft, answers, activeField },
    (saved) => {
      if (!saved.image?.id || !saved.answers) return
      setImage(saved.image); setObserveLeft(saved.observeLeft); setWriteLeft(saved.writeLeft)
      setAnswers(saved.answers); setActiveField(saved.activeField || 0)
      setPhase(['submitting', 'error'].includes(saved.phase) ? 'error' : saved.phase)
      if (['submitting', 'error'].includes(saved.phase)) setError('Your answers were recovered. Check history before retrying if the previous submission may have completed.')
    })

  useEffect(() => { if (phase !== 'observe') return; const timer = setInterval(() => setObserveLeft((value) => { if (value <= 1) { setTimeout(() => setPhase('write'), 0); return 0 } return value - 1 }), 1000); return () => clearInterval(timer) }, [phase])
  useEffect(() => { if (phase !== 'write') return; const timer = setInterval(() => setWriteLeft((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer) }, [phase])

  const begin = async () => {
    setPhase('loading')
    setError('')
    try {
      const diffParam = difficulty === 'all' ? null : difficulty
      const nextImage = await practiceApi.getPpdtImage(diffParam)
      if (!nextImage?.id || !nextImage?.url) throw new Error('The live API returned no PPDT image.')
      setImage(nextImage)
      setPhase('observe')
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const finish = async () => {
    if (!canFinish) return
    setPhase('submitting')
    setError('')
    try {
      const data = await practiceApi.submitPpdt({
        image_id: image.id,
        spot_text: answers.spot,
        action_text: answers.action,
        story_text: answers.story,
        logic_text: answers.logic
      })
      const score = Number(data.feedback?.overall_score ?? 0)
      setResult(data)
      addAttempt({
        id: data.session_id,
        type: 'PPDT',
        duration: '5 min',
        score,
        feedback: data.feedback,
        imageId: image.id,
        spotText: answers.spot,
        actionText: answers.action,
        storyText: answers.story,
        logicText: answers.logic
      })
      setPhase('result')
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const restart = () => {
    clearDraft()
    setPhase('setup')
    setObserveLeft(30)
    setWriteLeft(240)
    setActiveField(0)
    setAnswers(empty)
    setImage(null)
    setShowRefImage(false)
    setResult(null)
    setError('')
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="session-page">
        <SessionHeader test={test} phase={phase === 'loading' ? 'Loading live image' : 'AI evaluation'} />
        <main className="loading-panel">
          <LoaderCircle className="spin" />
          <h2>{phase === 'loading' ? 'Loading the active PPDT image…' : 'Evaluating your response…'}</h2>
          <p>This request is being processed by the live API.</p>
        </main>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="session-page">
        <SessionHeader test={test} phase="Live API error" />
        <main className="error-panel" role="alert">
          <AlertCircle />
          <h2>Could not complete the live request</h2>
          <p>{error}</p>
          {image && <><p>Your answers are preserved. If the request timed out, check history before retrying to avoid a duplicate attempt.</p><button className="primary-button" onClick={finish}>Retry submission</button><button className="secondary-button" onClick={() => setPhase('write')}>Review answers</button></>}<button className="secondary-button" onClick={restart}>Discard and return to setup</button>
        </main>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <SessionResult
        test={test}
        score={Number(result.feedback?.overall_score ?? 0)}
        detail={result.feedback?.recommendation || result.feedback?.psychological_analysis || 'Your response was evaluated by the live assessment service.'}
        metrics={[
          { label: 'Sections', value: `${filled}/4` },
          { label: 'Story words', value: answers.story.trim().split(/\s+/).length },
          { label: 'Observation', value: '30s' }
        ]}
        onAgain={restart}
        feedback={result.feedback}
        imageId={image?.id}
      />
    )
  }

  if (phase === 'setup') {
    return (
      <div className="session-page">
        <SessionHeader test={test} phase="Briefing" />
        <main className="setup-panel ppdt-setup">
          <div className="setup-banner navy">
            <Eye />
            <div>
              <p>Picture perception</p>
              <h2>30s observation · 4m writing</h2>
            </div>
          </div>

          <section className="setup-section">
            <h3>Four-part response</h3>
            <p>First identify the people and situation, then state the action, build the story, and briefly explain your reasoning.</p>

            <div className="setup-difficulty-box">
              <span className="setup-difficulty-label">Image difficulty:</span>
              <div className="difficulty-pills">
                {['all', 'easy', 'medium', 'hard'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`difficulty-pill ${difficulty === lvl ? 'active' : ''}`}
                    onClick={() => setDifficulty(lvl)}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="instruction-box">
            <Lightbulb />
            <div>
              <strong>Observe before you decide</strong>
              <p>Use the visual evidence, but leave room for a plausible and constructive interpretation.</p>
            </div>
          </section>

          <button className="primary-button full" onClick={begin}>
            <Play /> Load live test
          </button>
        </main>
      </div>
    )
  }

  if (phase === 'observe') {
    return (
      <div className="session-page">
        <SessionHeader test={test} phase="Observe" />
        <main className="observation-workspace">
          <div className="observation-toolbar">
            <span><Eye /> Observe only</span>
            <strong className={observeLeft <= 5 ? 'urgent-text' : ''}>
              <Clock3 /> {observeLeft}s
            </strong>
          </div>
          <img src={image.url} alt="Live PPDT assessment scene" />
          <button className="secondary-button" onClick={() => setPhase('write')}>
            Skip to writing <ArrowRight />
          </button>
        </main>
      </div>
    )
  }

  const field = fields[activeField]
  return (
    <div className="session-page">
      <SessionHeader test={test} phase="Write" step={activeField + 1} total={fields.length} />
      <main className="ppdt-writing">
        <aside className="response-outline">
          <div className="writing-clock"><Clock3 /> {formatClock(writeLeft)}</div>
          {fields.map((item, index) => (
            <button
              key={item.key}
              className={index === activeField ? 'active' : ''}
              onClick={() => setActiveField(index)}
            >
              <span>{index + 1}</span>
              <div>
                <b>{item.label}</b>
                <small>{answers[item.key].trim() ? 'Drafted' : 'Not started'}</small>
              </div>
            </button>
          ))}
          {image?.url && (
            <div className="sidebar-ref-box">
              <button
                type="button"
                className={`ref-toggle-btn ${showRefImage ? 'active' : ''}`}
                onClick={() => setShowRefImage((prev) => !prev)}
                title="Toggle reference image"
              >
                <Eye size={14} /> {showRefImage ? 'Hide picture' : 'View picture'}
              </button>
              {showRefImage && (
                <div className="ref-image-popover">
                  <img src={image.url} alt="Reference assessment scene" />
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="response-editor">
          <p className="eyebrow">{field.label}</p>
          <h2>{field.title}</h2>
          <p>{field.hint}</p>
          <textarea aria-label="Written response"
            autoFocus
            value={answers[field.key]}
            onChange={(event) => setAnswers({ ...answers, [field.key]: event.target.value })}
            placeholder={`Write your ${field.label.toLowerCase()} response…`}
          />
          <div className="editor-footer">
            {activeField > 0 && (
              <button
                className="secondary-button"
                onClick={() => setActiveField(activeField - 1)}
              >
                <ArrowLeft size={16} /> Previous
              </button>
            )}
            <span>{answers[field.key].trim() ? answers[field.key].trim().split(/\s+/).length : 0} words</span>
            {activeField < fields.length - 1 ? (
              <button className="primary-button" onClick={() => setActiveField(activeField + 1)}>
                Next section <ArrowRight size={16} />
              </button>
            ) : null}
            {canFinish && (
              <button className="primary-button finish-btn" onClick={finish}>
                Finish PPDT
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
