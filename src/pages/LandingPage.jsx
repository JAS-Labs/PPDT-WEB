import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Dumbbell,
  Gauge,
  LogIn,
  Play,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'

const TEST_DETAILS = [
  {
    id: 'ppdt',
    name: 'PPDT',
    fullName: 'Picture Perception & Description Test',
    timing: '30s view · 1m spot · 3.5m write',
    description: 'Observe a hazy stimulus image, identify characters, mood, and age, then compose a structured story with problem resolution.',
    color: 'teal',
  },
  {
    id: 'wat',
    name: 'WAT',
    fullName: 'Word Association Test',
    timing: '15s per word prompt',
    description: 'Respond rapidly to stimulus words to project spontaneous subconscious associations, emotional composure, and positive action.',
    color: 'navy',
  },
  {
    id: 'tat',
    name: 'TAT',
    fullName: 'Thematic Apperception Test',
    timing: '30s stimulus · 3.5m story',
    description: 'Interpret dramatic or ambiguous life situations to demonstrate initiative, leadership traits, empathy, and resilience under pressure.',
    color: 'blue',
  },
  {
    id: 'sdt',
    name: 'SDT',
    fullName: 'Self Description Test',
    timing: '15 mins across 5 viewpoints',
    description: 'Self-evaluate honestly through the eyes of parents, teachers, friends, self-appraisal, and aspirations for self-improvement.',
    color: 'purple',
  },
  {
    id: 'sct',
    name: 'SCT',
    fullName: 'Sentence Completion Test',
    timing: '30 rapid sentence stems',
    description: 'Complete open sentence stems under strict time constraints to reveal core personal convictions, ethics, and attitude toward challenges.',
    color: 'coral',
  },
]

const OLQ_HIGHLIGHTS = [
  {
    title: 'Effective Intelligence & Planning',
    desc: 'Practical problem solving, resourcefulness, and sound judgment in complex scenarios.',
  },
  {
    title: 'Social Adaptability & Cooperation',
    desc: 'Ability to bond with team members, adapt to varying groups, and place group success first.',
  },
  {
    title: 'Initiative & Self Confidence',
    desc: 'Taking the lead in unexpected situations with composure, conviction, and decisive clarity.',
  },
  {
    title: 'Emotional Stability & Courage',
    desc: 'Calm under intense pressure, maintaining constructive narrative framing without panic.',
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useApp()

  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="brand landing-brand">
            <span className="brand-mark logo">
              <img src="/app-logo.png" alt="ISSB Prep logo" />
            </span>
            <span>ISSB Prep</span>
          </Link>

          <nav className="landing-nav-links" aria-label="Landing page links">
            <a href="#tests">Psychological Tests</a>
            <a href="#evaluation">AI Evaluation</a>
            <a href="#how-it-works">How It Works</a>
            <Link
              to={isAuthenticated ? '/guide' : '/login'}
              state={{ from: '/guide' }}
              className="landing-guide-link"
            >
              <BookOpen size={16} /> Evaluation Guide
            </Link>
          </nav>

          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <Link to="/" className="landing-cta-btn">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-login-btn">
                  <LogIn size={16} /> Sign in
                </Link>
                <Link to="/login" className="landing-cta-btn">
                  Get started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero" id="overview">
        <div className="landing-container">
          <div className="landing-hero-content">
            <span className="landing-badge">
              <Sparkles size={16} /> AI-Powered Defence Psychological Assessment
            </span>
            <h1>
              Master the ISSB <br />
              <span>Psychological Screening</span>
            </h1>
            <p className="landing-hero-sub">
              Authentic timed simulations for <strong>PPDT</strong>, <strong>WAT</strong>, <strong>TAT</strong>, <strong>SDT</strong>, and <strong>SCT</strong>. Receive instant psychometric scoring mapped to the 9 Officer Like Qualities (OLQs) and automated red flag detection.
            </p>

            <div className="landing-hero-actions">
              <Link
                to={isAuthenticated ? '/practice' : '/login'}
                state={{ from: '/practice' }}
                className="landing-primary-btn"
              >
                <Play size={18} /> {isAuthenticated ? 'Open Practice Workspace' : 'Start Free Practice'}
              </Link>
              <Link
                to={isAuthenticated ? '/guide' : '/login'}
                state={{ from: '/guide' }}
                className="landing-secondary-btn"
              >
                <BookOpen size={18} /> Read OLQ Guide
              </Link>
            </div>

            <div className="landing-stats-row">
              <div className="landing-stat">
                <strong>5</strong>
                <span>Psychological Tests</span>
              </div>
              <div className="landing-stat">
                <strong>9</strong>
                <span>Officer Like Qualities</span>
              </div>
              <div className="landing-stat">
                <strong>10-Point</strong>
                <span>Board Rubric Scale</span>
              </div>
              <div className="landing-stat">
                <strong>100%</strong>
                <span>Board-Accurate Timers</span>
              </div>
            </div>
          </div>

          {/* Hero Preview Card */}
          <div className="landing-hero-preview">
            <div className="preview-card">
              <div className="preview-card-header">
                <div>
                  <span className="preview-tag">Assessment Verdict</span>
                  <h3>Candidate Readiness Index</h3>
                </div>
                <div className="preview-score">
                  <strong>8.2</strong>
                  <small>/10</small>
                </div>
              </div>

              <div className="preview-badge-row">
                <span className="verdict-pill recommended">
                  <ShieldCheck size={16} /> Recommended Candidate
                </span>
                <span className="verdict-pill verified">
                  <CheckCircle2 size={16} /> High Consistency
                </span>
              </div>

              <div className="preview-bars">
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Leadership Potential (LDR)</span>
                    <b>8.5</b>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '85%' }} /></div>
                </div>
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Social Adaptability (SOC)</span>
                    <b>8.0</b>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '80%' }} /></div>
                </div>
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Emotional Stability (EMS)</span>
                    <b>8.2</b>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: '82%' }} /></div>
                </div>
              </div>

              <div className="preview-shield-note">
                <ShieldCheck size={18} className="shield-icon" />
                <div>
                  <b>Psychometric Red Flag Screening: Clean</b>
                  <p>0 indicators of aggression, depression, or antisocial framing detected.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Psychological Tests Showcase */}
      <section className="landing-section tests-section" id="tests">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Comprehensive Test Battery</span>
            <h2>The Five Core Psychological Tests</h2>
            <p>Every test simulates the authentic ISSB time windows, prompt rotations, and psychological evaluation criteria.</p>
          </div>

          <div className="landing-tests-grid">
            {TEST_DETAILS.map((test) => (
              <div key={test.id} className="landing-test-card">
                <div className="test-card-top">
                  <span className={`test-badge ${test.color}`}>{test.name}</span>
                  <span className="test-timing">
                    <Clock size={15} /> {test.timing}
                  </span>
                </div>
                <h3>{test.fullName}</h3>
                <p>{test.description}</p>
                <div className="test-card-action">
                  <Link
                    to={isAuthenticated ? `/practice/${test.id}` : '/login'}
                    state={{ from: `/practice/${test.id}` }}
                    className="test-link"
                  >
                    Practice {test.name} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Evaluation & OLQ Rubrics */}
      <section className="landing-section eval-section" id="evaluation">
        <div className="landing-container">
          <div className="eval-grid">
            <div className="eval-copy">
              <span className="eyebrow">Objective Psychologist Rubrics</span>
              <h2>AI Psychometric Analysis Calibrated for Defence Boards</h2>
              <p>
                Unlike generic writing assistants, our evaluation model assesses your projective narratives and prompt responses against the 9 core Officer Like Qualities (OLQs) recognized by military selection boards.
              </p>

              <div className="olq-list">
                {OLQ_HIGHLIGHTS.map((olq, i) => (
                  <div key={i} className="olq-item">
                    <CheckCircle2 size={18} className="olq-icon" />
                    <div>
                      <strong>{olq.title}</strong>
                      <p>{olq.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to={isAuthenticated ? '/guide' : '/login'}
                state={{ from: '/guide' }}
                className="eval-cta"
              >
                Read Full Evaluation Guide & OLQs <ArrowRight size={16} />
              </Link>
            </div>

            <div className="eval-cards">
              <div className="eval-feature-box red-flag-box">
                <div className="feature-box-icon alert-icon">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3>Psychometric Red Flag Detection</h3>
                  <p>
                    Identify inadvertent aggressive themes, defeatist phrasing, lack of ethical responsibility, or antisocial behavior patterns before you meet the board psychologist.
                  </p>
                </div>
              </div>

              <div className="eval-feature-box timing-box">
                <div className="feature-box-icon clock-icon">
                  <Clock size={24} />
                </div>
                <div>
                  <h3>Realistic Selection Board Pressure</h3>
                  <p>
                    Exact 15-second WAT intervals, 30-second PPDT picture observation periods, and 3.5-minute story writing sessions build automatic subconscious reflexes.
                  </p>
                </div>
              </div>

              <div className="eval-feature-box progress-box">
                <div className="feature-box-icon stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3>Cumulative Progress Tracking</h3>
                  <p>
                    Observe your readiness scores develop over repeated sessions. Review past attempts with detailed psychological breakdowns and actionable guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section steps-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Structured Process</span>
            <h2>How ISSB Prep Works</h2>
            <p>A proven preparation workflow designed to build mental discipline and narrative clarity.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Create Candidate Account</h3>
              <p>Register as a candidate with your default Bangladeshi profile to keep all your sessions synchronized across devices.</p>
            </div>

            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Practice Timed Tests</h3>
              <p>Select any of the 5 psychological tests and experience authentic stimulus presentation and strict board timing.</p>
            </div>

            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Review Instant AI Rubrics</h3>
              <p>Receive comprehensive ratings across character construction, theme action, red flags, and dimensional OLQ scores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="landing-cta-banner">
        <div className="landing-container">
          <div className="cta-box">
            <h2>Ready to Begin Your ISSB Psychological Preparation?</h2>
            <p>Join candidates training with timed simulations and objective psychometric assessment.</p>
            <div className="cta-actions">
              {isAuthenticated ? (
                <Link to="/practice" className="landing-primary-btn">
                  Open Practice Workspace <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/login" state={{ from: '/practice' }} className="landing-primary-btn">
                    Create Candidate Account <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" state={{ from: '/practice' }} className="landing-secondary-btn light">
                    Sign In to Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <span className="brand-mark logo">
              <img src="/app-logo.png" alt="ISSB Prep logo" />
            </span>
            <strong>ISSB Prep</strong>
            <p>AI-powered psychological test simulation and evaluation platform.</p>
          </div>

          <div className="footer-links">
            <div>
              <b>Tests</b>
              <Link to={isAuthenticated ? '/practice/ppdt' : '/login'} state={{ from: '/practice/ppdt' }}>PPDT</Link>
              <Link to={isAuthenticated ? '/practice/wat' : '/login'} state={{ from: '/practice/wat' }}>WAT</Link>
              <Link to={isAuthenticated ? '/practice/tat' : '/login'} state={{ from: '/practice/tat' }}>TAT</Link>
              <Link to={isAuthenticated ? '/practice/sdt' : '/login'} state={{ from: '/practice/sdt' }}>SDT</Link>
              <Link to={isAuthenticated ? '/practice/sct' : '/login'} state={{ from: '/practice/sct' }}>SCT</Link>
            </div>
            <div>
              <b>Resources</b>
              <Link to={isAuthenticated ? '/guide' : '/login'} state={{ from: '/guide' }}>OLQ Evaluation Guide</Link>
              <Link to={isAuthenticated ? '/' : '/login'} state={{ from: '/' }}>Candidate Portal</Link>
              {!isAuthenticated && <Link to="/login" state={{ from: '/' }}>Create Account</Link>}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ISSB Prep. Designed for defence psychological preparation and psychometric research.</p>
        </div>
      </footer>
    </div>
  )
}
