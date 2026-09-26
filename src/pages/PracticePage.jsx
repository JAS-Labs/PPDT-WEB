import { ArrowRight, BookOpen, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TESTS } from '../data/tests'
import './practice.css'

export default function PracticePage() {
  return (
    <div className="page practice-page practice-clean">
      <section className="practice-heading">
        <h2>Choose your next test.</h2>
        <p>Practice at your pace, then review your feedback.</p>
        <span className="practice-note"><Clock3 size={15} aria-hidden="true" /> Set your pace before you begin · Drafts saved automatically</span>
      </section>
      <section className="practice-library" aria-labelledby="practice-library-title">
        <header><h2 id="practice-library-title">Test library</h2><span>5 practice formats</span></header>
        <div className="practice-choices">
          {TESTS.map((test, index) => {
            const Icon = test.icon
            return <Link key={test.id} to={`/practice/${test.id}`} className="practice-choice">
              <span className="practice-choice-number">0{index + 1}</span>
              <span className="practice-choice-icon"><Icon size={22} aria-hidden="true" /></span>
              <span className="practice-choice-title"><strong>{test.name}</strong><span>{test.title}</span></span>
              <span className="practice-choice-description">{test.description}</span>
              <span className="practice-choice-action">Start <ArrowRight size={18} aria-hidden="true" /></span>
            </Link>
          })}
        </div>
      </section>
      <aside className="practice-guidance">
        <BookOpen size={22} aria-hidden="true" />
        <div><h3>Make each session count.</h3><p>Keep responses specific and constructive. Review one improvement before starting again.</p></div>
        <Link to="/guide">Read the guide <ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </div>
  )
}
