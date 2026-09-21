import { useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileCheck,
  Flame,
  Gavel,
  HeartHandshake,
  Lightbulb,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { OLQ_DEFINITIONS } from '../components/OlqScoreSection'

const SCORING_SCALE = [
  { range: '1–2', label: 'Poor', color: '#ef4444', bg: '#fee2e2', desc: 'Passive, evasive, or destructive framing.' },
  { range: '3–4', label: 'Below Avg', color: '#f59e0b', bg: '#fef3c7', desc: 'Incomplete narrative or weak initiative.' },
  { range: '5–6', label: 'Average', color: '#3b82f6', bg: '#dbeafe', desc: 'Acceptable resolution, standard response.' },
  { range: '7–8', label: 'Above Avg', color: '#10b981', bg: '#d1fae5', desc: 'Clear hero autonomy, team spirit, and grit.' },
  { range: '9–10', label: 'Exceptional', color: '#8b5cf6', bg: '#ede9fe', desc: 'Exemplary leadership, realism, and inspiration.' },
]

const FORMATS = [
  {
    id: 'ppdt',
    name: 'Picture Perception & Description Test (PPDT)',
    subtitle: 'Screening Day 1 · 30s observation · 4m writing',
    overview: 'You observe an ambiguous, blurred scene for 30 seconds, then have 4 minutes to write a structured three-part response: who is in the scene, what the central action is, and a full narrative.',
    scoringBreakdown: [
      { part: 'Spot (20%)', detail: 'Accurate observation of characters (approximate age, gender, mood, relation).' },
      { part: 'Action (10%)', detail: 'Succinct, purposeful theme or headline that sets clear narrative direction.' },
      { part: 'Story (70%)', detail: 'Complete narrative explaining what led up to the event, what the protagonist does, and the final positive outcome.' },
    ],
    tips: [
      'Give the main character immediate initiative — they should act rather than wait for help.',
      'Always conclude with a realistic, constructive resolution.',
      'Explain reasoning in the logic section to ground your interpretation in visual evidence.',
    ],
    route: '/practice/ppdt',
  },
  {
    id: 'wat',
    name: 'Word Association Test (WAT)',
    subtitle: 'Psychologist Day 2 · 15s per word · 100+ words',
    overview: 'Stimulus words appear one by one on the screen for 15 seconds each. Candidates write the very first sentence that enters their mind.',
    scoringBreakdown: [
      { part: 'Constructive Reframing', detail: 'Turning negative or obstacle words (e.g. “Failure”, “Danger”) into positive, active thoughts.' },
      { part: 'Complete Grammar', detail: 'Writing full grammatically sound sentences rather than single-word associations or proverbs.' },
      { part: 'Social Frequency', detail: 'Demonstrating teamwork, social responsibility, and proactive service in everyday life.' },
    ],
    tips: [
      'Avoid rote clichés or textbook quotes — write original, personal, action-oriented responses.',
      'Keep responses concise so you never run out of time.',
      'Do not skip words; omissions suggest mental block or evasion.',
    ],
    route: '/practice/wat',
  },
  {
    id: 'tat',
    name: 'Thematic Apperception Test (TAT)',
    subtitle: 'Psychologist Day 2 · 30s observation · 4m writing · 10–12 pictures',
    overview: 'Candidates view evocative, ambiguous scene drawings and construct full psychological stories detailing the protagonist’s thoughts, challenges, actions, and results.',
    scoringBreakdown: [
      { part: 'Need-Press Balance', detail: 'How inner ambitions (needs) interact with external environmental pressures (press).' },
      { part: 'Hero Autonomy', detail: 'Whether the central character displays self-drive, emotional stability, and resourceful problem solving.' },
      { part: 'Authority Tone', detail: 'Constructive attitude toward institutional rules, seniors, and duty.' },
    ],
    tips: [
      'Structure every story in three parts: Past (setup) → Present (action) → Future (outcome).',
      'Focus on the protagonist’s actions and leadership rather than passive contemplation.',
      'Ensure the protagonist overcomes realistic obstacles with effort and integrity.',
    ],
    route: '/practice/tat',
  },
  {
    id: 'sdt',
    name: 'Self Description Test (SDT)',
    subtitle: 'Psychologist Day 2 · 15 minutes · 5 perspectives',
    overview: 'Candidates write descriptions of themselves from five standard viewpoints: Parents, Teachers/Employers, Friends, Self, and Future Goals in one continuous 15-minute period.',
    scoringBreakdown: [
      { part: 'Consistency', detail: 'Whether strengths, habits, and personality traits match across all five perspectives.' },
      { part: 'Self-Insight', detail: 'Genuine self-awareness that balances recognized virtues with authentic, addressable areas for growth.' },
      { part: 'Aspiration Realism', detail: 'Whether career goals and future ambitions are grounded in observable effort and realistic paths.' },
    ],
    tips: [
      'Support character traits with observable daily habits rather than broad adjectives.',
      'Acknowledge genuine areas of improvement along with what concrete steps you take to improve.',
      'Ensure that how your friends describe you aligns with how you describe yourself.',
    ],
    route: '/practice/sdt',
  },
  {
    id: 'sct',
    name: 'Sentence Completion Test (SCT)',
    subtitle: 'Psychologist Day 2 · 30s per sentence · Incomplete stems',
    overview: 'Incomplete sentence stems must be completed swiftly to reveal unconscious attitudes toward authority, danger, duty, family, and ambition.',
    scoringBreakdown: [
      { part: 'Personal Expression', detail: 'Finishing the thought in the first person with concrete personal commitment.' },
      { part: 'Avoid Stagnation', detail: 'Never simply echoing the stem or writing defensive, generic truisms.' },
      { part: 'Duty & Composure', detail: 'Revealing readiness to handle stress, responsibility, and setbacks.' },
    ],
    tips: [
      'Write your genuine immediate reaction — authentic confidence shows through simplicity.',
      'Do not repeat the stem words in your completion.',
      'Show positive coping mechanisms when faced with stems touching on adversity.',
    ],
    route: '/practice/sct',
  },
]

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState('olq')

  return (
    <div className="page guide-page">
      {/* Header Banner */}
      <section className="guide-hero-banner">
        <div>
          <span className="eyebrow"><BookOpen size={15} /> ISSB Evaluation Manual</span>
          <h2>AI Psychological Evaluation Guide</h2>
          <p>
            Learn the exact criteria, scoring scales, and Officer Like Qualities (OLQ) used by the AI
            and human ISSB psychologists to assess candidate responses.
          </p>
        </div>

        <div className="guide-tab-pills">
          <button
            className={`guide-tab-btn ${activeTab === 'olq' ? 'active' : ''}`}
            onClick={() => setActiveTab('olq')}
          >
            <Shield size={16} /> Officer Qualities (OLQs)
          </button>
          <button
            className={`guide-tab-btn ${activeTab === 'formats' ? 'active' : ''}`}
            onClick={() => setActiveTab('formats')}
          >
            <Compass size={16} /> Test Formats & Criteria
          </button>
        </div>
      </section>

      {/* Tab 1: OLQ Details */}
      {activeTab === 'olq' && (
        <section className="guide-olq-tab">
          {/* Scoring Scale Explainer */}
          <div className="surface scale-card">
            <header className="surface-header">
              <h2>Official 10-Point Scoring Scale</h2>
              <p>How psychologist scores translate to officer selection tiers</p>
            </header>

            <div className="scale-grid">
              {SCORING_SCALE.map((s) => (
                <div key={s.range} className="scale-item" style={{ borderColor: s.color }}>
                  <span className="scale-pill" style={{ color: s.color, backgroundColor: s.bg }}>
                    {s.range}
                  </span>
                  <strong>{s.label}</strong>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 9 OLQs List */}
          <div className="olq-guide-list">
            <header className="section-header">
              <div>
                <h2>The 9 Officer Like Qualities</h2>
                <p>Each story, sentence, and self-description is evaluated across these dimensions</p>
              </div>
            </header>

            <div className="olq-guide-cards-grid">
              {OLQ_DEFINITIONS.map((olq, index) => (
                <article key={olq.code} className="surface olq-guide-card">
                  <div className="olq-guide-card-head">
                    <span className="olq-guide-number">0{index + 1}</span>
                    <span className="olq-guide-code">{olq.code}</span>
                  </div>
                  <h3>{olq.name}</h3>
                  <p className="olq-guide-desc">{olq.desc}</p>

                  <div className="olq-guide-focus">
                    <b>What assessors look for:</b>
                    <ul>
                      {olq.code === 'LDR' && (
                        <>
                          <li>Protagonist takes proactive initiative rather than following.</li>
                          <li>Ability to delegate, inspire colleagues, and resolve crisis.</li>
                        </>
                      )}
                      {olq.code === 'EMS' && (
                        <>
                          <li>Calmness and constructive action when sudden accidents occur.</li>
                          <li>Absence of hysteria, panic, or violent aggression in narratives.</li>
                        </>
                      )}
                      {olq.code === 'SOI' && (
                        <>
                          <li>Cooperation with family, team members, and community.</li>
                          <li>Empathy toward colleagues under distress.</li>
                        </>
                      )}
                      {olq.code === 'DEM' && (
                        <>
                          <li>Timely, rational decisions when options are constrained.</li>
                          <li>Logical sequence between cause, action, and effect.</li>
                        </>
                      )}
                      {olq.code === 'POO' && (
                        <>
                          <li>Constructive reframing of negative circumstances.</li>
                          <li>Optimistic, realistic resolutions without fatalism.</li>
                        </>
                      )}
                      {olq.code === 'MNT' && (
                        <>
                          <li>Resilience in overcoming repeated failure or fatigue.</li>
                          <li>Perseverance until the assigned mission is complete.</li>
                        </>
                      )}
                      {olq.code === 'COM' && (
                        <>
                          <li>Clarity, narrative coherence, and concise expression.</li>
                          <li>Logical organization: Situation → Action → Result.</li>
                        </>
                      )}
                      {olq.code === 'MOI' && (
                        <>
                          <li>Ethical choices, honesty, and principled behavior.</li>
                          <li>Standing up for duty over personal convenience.</li>
                        </>
                      )}
                      {olq.code === 'SOR' && (
                        <>
                          <li>Taking personal ownership of tasks without blaming others.</li>
                          <li>Readiness to accept accountability for outcomes.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Test Formats & Criteria */}
      {activeTab === 'formats' && (
        <section className="guide-formats-tab">
          <div className="formats-list">
            {FORMATS.map((fmt) => (
              <article key={fmt.id} className="surface format-guide-card">
                <div className="format-card-head">
                  <div>
                    <span className="format-subtitle">{fmt.subtitle}</span>
                    <h2>{fmt.name}</h2>
                  </div>
                  <Link to={fmt.route} className="primary-button">
                    Practice Now <ChevronRight size={16} />
                  </Link>
                </div>

                <p className="format-overview">{fmt.overview}</p>

                <div className="format-breakdown-grid">
                  <div className="format-criteria-box">
                    <h4><Target size={16} /> Evaluation Criteria</h4>
                    <div className="criteria-items">
                      {fmt.scoringBreakdown.map((b) => (
                        <div key={b.part} className="criteria-item">
                          <strong>{b.part}</strong>
                          <p>{b.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="format-tips-box">
                    <h4><Lightbulb size={16} /> Strategy & Best Practices</h4>
                    <ul>
                      {fmt.tips.map((tip, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={16} />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
