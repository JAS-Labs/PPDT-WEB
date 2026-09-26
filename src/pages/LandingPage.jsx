import { ArrowRight, BookOpen, Check, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'
import './landing.css'

const summaries = {
  ppdt: 'Observe a picture. Turn what you see into a clear story.',
  wat: 'Build fluency with quick responses to individual words.',
  tat: 'Explore a situation through a complete, purposeful narrative.',
  sdt: 'Reflect on your strengths, habits, and areas for growth.',
  sct: 'Complete unfinished sentences in your own words.',
}

export default function LandingPage() {
  const { isAuthenticated } = useApp()
  const practicePath = isAuthenticated ? '/practice' : '/signup'

  return (
    <div className="lp">
      <a className="lp-skip" href="#main">Skip to content</a>
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand"><img src="/app-logo.png" alt="" width="40" height="40" />ISSB Prep</Link>
          <nav aria-label="Landing page links">
            <a href="#tests">Practice tests</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <Link className="lp-nav-login" to={isAuthenticated ? '/' : '/login'}>
            {isAuthenticated ? 'Go to Dashboard' : 'Sign in'} <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main id="main">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div>
              <p className="lp-eyebrow">A little practice. A clearer perspective.</p>
              <h1>Prepare with focus.<br /><span>Progress with clarity.</span></h1>
              <p className="lp-intro">Your space for ISSB psychological test practice. Work through timed sessions, understand your responses, and build on what you learn.</p>
              <div className="lp-actions">
                <Link to={practicePath} state={{ from: '/practice' }} className="lp-button">
                  {isAuthenticated ? 'Open Practice Workspace' : 'Start practicing'} <ArrowRight size={18} />
                </Link>
                <a href="#tests" className="lp-text-link">Explore the tests</a>
              </div>
              <p className="lp-hero-note">Five test formats. Timed practice. Personal feedback.</p>
            </div>
            <aside className="lp-preview" aria-label="Example practice feedback">
              <div className="lp-preview-top"><span>YOUR PRACTICE, IN PERSPECTIVE</span><span className="lp-example">Example</span></div>
              <div className="lp-preview-title"><div><p>After a session</p><h2>A clearer next step.</h2></div><BookOpen size={28} /></div>
              <div className="lp-feedback-item"><span className="lp-check"><Check size={18} /></span><div><h3>What worked</h3><p>Your story gives the central character a clear goal and a purposeful action.</p></div></div>
              <div className="lp-feedback-item"><span className="lp-step">↗</span><div><h3>What to try next</h3><p>Connect the ending to the action. Show how the character helped resolve the situation.</p></div></div>
              <div className="lp-preview-footer"><Clock3 size={16} /><span>Practice → reflect → try again</span></div>
            </aside>
          </div>
        </section>

        <section id="tests" className="lp-section lp-container">
          <div className="lp-section-heading"><div><p className="lp-eyebrow">THE PRACTICE LIBRARY</p><h2>Five ways to sharpen your thinking.</h2></div><p>Choose a format and work at your own pace.</p></div>
          <div className="lp-test-list">
            {TESTS.map(({ id, name, title, icon: Icon }, index) => (
              <Link key={id} to={isAuthenticated ? `/practice/${id}` : '/login'} state={{ from: `/practice/${id}` }} className="lp-test-row" aria-label={`Practice ${name}`}>
                <span className="lp-test-number">0{index + 1}</span>
                <span className="lp-test-icon"><Icon size={22} /></span>
                <div className="lp-test-title"><h3>{name}</h3><span>{title}</span></div>
                <p>{summaries[id]}</p>
                <ArrowRight size={20} className="lp-row-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="lp-process">
          <div className="lp-container">
            <p className="lp-eyebrow">MAKE EACH SESSION COUNT</p>
            <h2>A simple rhythm for better practice.</h2>
            <div className="lp-steps">
              {[['01', 'Choose your test', 'Pick a format and read the briefing before the timer starts.'], ['02', 'Give it your attention', 'Respond to the pictures, words, or prompts in your own way.'], ['03', 'Learn from the feedback', 'Review your strengths and choose one thing to improve next time.']].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
            <div className="lp-guide"><p>Want to understand the scoring? Explore the feedback criteria and Officer Like Qualities in the guide.</p><Link to={isAuthenticated ? '/guide' : '/login'} state={{ from: '/guide' }}>Evaluation Guide <ArrowRight size={17} /></Link></div>
          </div>
        </section>

        <section className="lp-container lp-closing">
          <div><p className="lp-eyebrow">YOUR NEXT STEP</p><h2>Make time for one focused session.</h2></div>
          <Link to={practicePath} state={{ from: '/practice' }} className="lp-button">{isAuthenticated ? 'Continue practicing' : 'Create an account'}<ArrowRight size={18} /></Link>
        </section>
      </main>
      <footer className="lp-footer lp-container"><span>© {new Date().getFullYear()} ISSB Prep</span><p>AI feedback supports practice and reflection; it is not an official selection result.</p></footer>
    </div>
  )
}
