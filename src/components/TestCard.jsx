import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TestCard({ test, compact = false }) {
  const Icon = test.icon
  return <Link to={`/practice/${test.id}`} className={`test-card ${compact ? 'compact' : ''}`}>
    <span className={`test-icon ${test.color}`}><Icon /></span>
    <span className="test-copy"><strong>{test.name}</strong><em>{test.title}</em>{compact && <small>{test.description}</small>}</span>
    <span className="test-action">{compact ? <ArrowRight /> : <>Start <ArrowRight /></>}</span>
  </Link>
}
