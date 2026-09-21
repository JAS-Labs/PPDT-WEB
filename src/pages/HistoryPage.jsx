import { useState, useMemo } from 'react'
import {
  AlertCircle,
  BarChart3,
  Download,
  Eye,
  Filter,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Users
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { historyApi } from '../services/liveApi'
import AttemptDetailModal from '../components/AttemptDetailModal'
import CommunityResponsesModal from '../components/CommunityResponsesModal'
import { getScoreBand } from '../components/OlqScoreSection'

const categories = ['PPDT', 'WAT', 'TAT', 'SDT', 'SCT']
const filterTabs = ['All', 'PPDT', 'WAT', 'TAT', 'SDT', 'SCT']

export default function HistoryPage() {
  const { history, refreshHistory, historyLoading, historyError, stats } = useApp()
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [communityImage, setCommunityImage] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const scoreFor = (type) => {
    const items = history.filter((item) => item.type?.toUpperCase() === type)
    return items.length
      ? (items.reduce((sum, item) => sum + Number(item.score), 0) / items.length).toFixed(1)
      : null
  }

  const filteredHistory = useMemo(() => {
    if (activeFilter === 'All') return history
    return history.filter((item) => item.type?.toUpperCase() === activeFilter)
  }, [history, activeFilter])

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const data = await historyApi.exportHistory()
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', jsonString)
      downloadAnchor.setAttribute('download', `issb-prep-history-${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      setExportError(err.message || 'Could not export history data.')
    } finally {
      setExporting(false)
    }
  }

  const handleOpenCommunity = (imageId, testType) => {
    setSelectedAttempt(null)
    setCommunityImage({ imageId, testType })
  }

  return (
    <div className="page history-page">
      {/* Overview Analytics Bar */}
      <section className="analytics-grid">
        <article className="surface">
          <header className="surface-header icon-title">
            <BarChart3 />
            <div>
              <h2>Readiness overview</h2>
              <p>Live average performance by practice type.</p>
            </div>
          </header>
          <div className="score-bars">
            {categories.map((type) => {
              const score = scoreFor(type)
              return (
                <div className="score-row" key={type}>
                  <strong>{type}</strong>
                  <span className="score-track">
                    <i style={{ width: `${(Number(score) || 0) * 10}%` }} />
                  </span>
                  <b>{score ?? '—'}</b>
                </div>
              )
            })}
          </div>
        </article>

        <article className="surface insight-panel">
          <p className="eyebrow">Current insight</p>
          <h2>{history.some((item) => item.type !== 'PPDT') ? 'Keep balancing your practice' : 'Build breadth next'}</h2>
          <p>Use your next session on the least-practiced category. A broader sample gives you a more useful readiness picture.</p>
          <div className="insight-number">
            <strong>{stats.sessions}</strong>
            <span>completed sessions</span>
          </div>
        </article>
      </section>

      {/* History Header & Toolbar */}
      <header className="section-header history-header-row">
        <div>
          <h2>Recent sessions</h2>
          <p>Fetched from your live account.</p>
        </div>

        <div className="history-actions-row">
          <button
            className="secondary-button export-btn"
            onClick={handleExport}
            disabled={exporting || history.length === 0}
            title="Download full practice records as JSON"
          >
            {exporting ? <LoaderCircle className="spin" size={16} /> : <Download size={16} />}
            <span>Export Data</span>
          </button>

          <button className="text-button" onClick={refreshHistory} disabled={historyLoading}>
            <RefreshCw className={historyLoading ? 'spin' : ''} size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {exportError && (
        <p className="form-error" role="alert"><AlertCircle size={16} /> {exportError}</p>
      )}

      {/* Filter Tabs */}
      <div className="history-filter-tabs">
        {filterTabs.map((tab) => {
          const count = tab === 'All'
            ? history.length
            : history.filter((i) => i.type?.toUpperCase() === tab).length
          return (
            <button
              key={tab}
              className={`filter-chip ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              <span>{tab}</span>
              <small>{count}</small>
            </button>
          )
        })}
      </div>

      {/* Content states */}
      {historyLoading && !history.length ? (
        <section className="surface history-state">
          <LoaderCircle className="spin" />
          <p>Loading your live practice history…</p>
        </section>
      ) : historyError && !history.length ? (
        <section className="surface history-state error">
          <AlertCircle />
          <p>{historyError}</p>
          <button className="secondary-button" onClick={refreshHistory}>Try again</button>
        </section>
      ) : !history.length ? (
        <section className="surface history-state">
          <p>No completed live sessions yet. Finish a practice test and it will appear here.</p>
        </section>
      ) : (
        <section className="surface table-wrap">
          <table className="interactive-history-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Score</th>
                <th>Status</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => {
                const numScore = Number(item.score) || 0
                const band = getScoreBand(numScore)
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedAttempt(item)}
                    className="clickable-attempt-row"
                    title="Click to view detailed psychological evaluation"
                  >
                    <td>
                      <span className={`table-type-pill ${item.type?.toLowerCase()}`}>
                        {item.type}
                      </span>
                    </td>
                    <td>{item.date}</td>
                    <td>{item.duration}</td>
                    <td className="table-score">
                      <span className="score-with-dot" style={{ color: band.color }}>
                        {numScore.toFixed(1)}
                      </span>
                    </td>
                    <td><span className="status-badge">{item.status}</span></td>
                    <td>
                      <button
                        className="table-view-btn"
                        onClick={(e) => { e.stopPropagation(); setSelectedAttempt(item); }}
                        aria-label="View evaluation details"
                      >
                        <Eye size={15} /> <span>Review</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {historyError && (
            <p className="history-warning">
              <AlertCircle /> Some live history could not be refreshed: {historyError}
            </p>
          )}
        </section>
      )}

      {/* Modals */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
          onOpenCommunity={handleOpenCommunity}
        />
      )}

      {communityImage && (
        <CommunityResponsesModal
          imageId={communityImage.imageId}
          testType={communityImage.testType}
          onClose={() => setCommunityImage(null)}
        />
      )}
    </div>
  )
}
