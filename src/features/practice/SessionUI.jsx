import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function SessionHeader({ test, step, total, phase }) {
  return <header className="session-header"><Link to="/practice" aria-label="Exit practice"><X/></Link><div><span>{phase || test.name}</span><h1>{test.title}</h1></div>{total ? <strong>{step}/{total}</strong> : <Link className="session-back" to="/practice"><ArrowLeft/> Library</Link>}</header>
}

export function SessionResult({ test, score, detail, metrics = [], onAgain }) {
  const navigate = useNavigate()
  return <div className="session-page"><SessionHeader test={test} phase="Result"/><main className="result-panel"><span className="result-check"><Check/></span><p className="eyebrow">Practice complete</p><strong className="big-score">{score}</strong><span className="out-of">/ 10</span><h2>Session saved</h2><p>{detail}</p>{metrics.length > 0 && <div className="result-metrics">{metrics.map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>}<div className="result-actions"><button className="secondary-button" onClick={onAgain}><RotateCcw/> Practice again</button><button className="primary-button" onClick={() => navigate('/history')}>View history</button></div></main></div>
}

export function formatClock(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
