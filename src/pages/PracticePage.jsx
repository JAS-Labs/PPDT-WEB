import { Clock3, Keyboard, Lightbulb, Target } from 'lucide-react'
import TestCard from '../components/TestCard'
import { TESTS } from '../data/tests'

export default function PracticePage() {
  return <div className="page practice-page"><section className="practice-intro"><div><span>Practice workspace</span><h2>Choose the skill you want to sharpen.</h2><p>Every session runs in a distraction-free workspace with timing, keyboard controls, and automatic local history.</p></div><div className="practice-meta"><span><Clock3/> 3–8 min</span><span><Keyboard/> Keyboard ready</span><span><Target/> Focused scoring</span></div></section><div className="practice-layout">
    <section className="surface"><header className="surface-header"><h2>Test library</h2><p>Five core psychological test formats.</p></header><div className="practice-list">{TESTS.map((test) => <TestCard key={test.id} test={test} compact/>)}</div></section>
    <aside className="surface tips-card"><Lightbulb /><h2>Practice deliberately</h2><p>Strong responses are specific, constructive, and action-oriented. Use each session to improve one habit.</p><ol><li>Keep stories positive and plausible.</li><li>Give the central character initiative.</li><li>Finish with a clear outcome.</li><li>Review patterns after every session.</li></ol></aside>
  </div></div>
}
