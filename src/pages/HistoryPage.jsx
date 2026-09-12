import { BarChart3, RotateCcw } from 'lucide-react'
import { useApp } from '../state/AppContext'

const categories = ['PPDT', 'WAT', 'TAT', 'SDT', 'SCT']

export default function HistoryPage() {
  const { history, resetProgress, stats } = useApp()
  const scoreFor = (type) => { const items = history.filter((item) => item.type === type); return items.length ? (items.reduce((sum, item) => sum + Number(item.score), 0) / items.length).toFixed(1) : null }
  return <div className="page history-page">
    <section className="analytics-grid"><article className="surface"><header className="surface-header icon-title"><BarChart3/><div><h2>Readiness overview</h2><p>Average performance by practice type.</p></div></header><div className="score-bars">{categories.map((type) => { const score = scoreFor(type); return <div className="score-row" key={type}><strong>{type}</strong><span className="score-track"><i style={{ width: `${(score ?? 0) * 10}%` }}/></span><b>{score ?? '—'}</b></div> })}</div></article><article className="surface insight-panel"><p className="eyebrow">Current insight</p><h2>{history.some((item) => item.type !== 'PPDT') ? 'Keep balancing your practice' : 'Build breadth next'}</h2><p>Use your next session on the least-practiced category. A broader sample gives you a more useful readiness picture.</p><div className="insight-number"><strong>{stats.sessions}</strong><span>completed sessions</span></div></article></section>
    <header className="section-header"><div><h2>Recent sessions</h2><p>Practice saved on this device.</p></div><button className="text-button" onClick={resetProgress}><RotateCcw/> Reset demo</button></header>
    <section className="surface table-wrap"><table><thead><tr><th>Test</th><th>Date</th><th>Duration</th><th>Score</th><th>Status</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td><strong>{item.type}</strong></td><td>{item.date}</td><td>{item.duration}</td><td className="table-score">{item.score}</td><td><span className="status-badge">{item.status}</span></td></tr>)}</tbody></table></section>
  </div>
}
