import { Lightbulb } from 'lucide-react'
import TestCard from '../components/TestCard'
import { TESTS } from '../data/tests'

export default function PracticePage() {
  return <div className="page practice-page"><div className="practice-layout">
    <section className="surface"><header className="surface-header"><h2>Choose a test</h2><p>Build a focused practice session for today.</p></header><div className="practice-list">{TESTS.map((test) => <TestCard key={test.id} test={test} compact/>)}</div></section>
    <aside className="surface tips-card"><Lightbulb /><h2>Practice deliberately</h2><p>Strong responses are specific, constructive, and action-oriented. Use each session to improve one habit.</p><ol><li>Keep stories positive and plausible.</li><li>Give the central character initiative.</li><li>Finish with a clear outcome.</li><li>Review patterns after every session.</li></ol></aside>
  </div></div>
}
