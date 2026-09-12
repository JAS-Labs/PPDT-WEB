export default function ReadinessRing({ score = 4.7, dark = false }) {
  return <div className={`readiness-ring ${dark ? 'dark' : ''}`} style={{ '--progress': `${Math.max(0, Math.min(10, score)) * 10}%` }}><div><strong>{score}</strong><span>/ 10</span></div></div>
}
