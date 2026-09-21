import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAllHistory } from '../services/liveApi'

const AppContext = createContext(null)

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function isValidToken(raw) {
  if (!raw || typeof raw !== 'string') return false
  const trimmed = raw.trim()
  return Boolean(trimmed && trimmed !== 'null' && trimmed !== 'undefined')
}

export function readStoredToken() {
  const raw = localStorage.getItem('issb-token')
  if (!isValidToken(raw)) {
    if (raw !== null) {
      try { localStorage.removeItem('issb-token') } catch {}
    }
    return null
  }
  return raw.trim()
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken())
  const [profile, setProfile] = useState(() => {
    const raw = read('issb-profile', { name: 'Candidate', email: '', nationality: 'Bangladeshi', verified: false, mode: 'candidate' })
    if (!raw || raw.mode === 'guest' || raw.name === 'Guest' || !raw.nationality) {
      return {
        ...raw,
        name: (!raw?.name || raw.name === 'Guest') ? 'Candidate' : raw.name,
        mode: (!raw?.mode || raw.mode === 'guest') ? 'candidate' : raw.mode,
        nationality: raw?.nationality || 'Bangladeshi',
      }
    }
    return raw
  })
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [settings, setSettings] = useState(() => read('issb-settings', { reminders: true, sounds: true, compact: false }))

  const saveProfile = (next) => {
    const sanitized = {
      ...next,
      name: (!next?.name || next.name === 'Guest') ? 'Candidate' : next.name,
      mode: (!next?.mode || next.mode === 'guest') ? 'candidate' : next.mode,
      nationality: next?.nationality || 'Bangladeshi',
    }
    setProfile(sanitized)
    localStorage.setItem('issb-profile', JSON.stringify(sanitized))
  }
  const addAttempt = (attempt) => setHistory((current) => [{ id: attempt.id || crypto.randomUUID(), date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Completed', ...attempt }, ...current.filter((item) => item.id !== attempt.id)])
  const refreshHistory = useCallback(async () => {
    if (!readStoredToken()) { setHistory([]); return }
    setHistoryLoading(true); setHistoryError('')
    try {
      setHistory(await getAllHistory())
    } catch (error) {
      if (error.status === 401) {
        try { localStorage.removeItem('issb-token') } catch {}
        setToken(null)
        saveProfile({ name: 'Candidate', email: '', nationality: 'Bangladeshi', verified: false, mode: 'candidate' })
        setHistory([])
      }
      setHistoryError(error.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    const onAuthExpired = () => {
      try { localStorage.removeItem('issb-token') } catch {}
      setToken(null)
      saveProfile({ name: 'Candidate', email: '', nationality: 'Bangladeshi', verified: false, mode: 'candidate' })
      setHistory([])
      setHistoryError('Your session has expired. Please sign in again.')
    }
    window.addEventListener('issb-auth-expired', onAuthExpired)
    return () => window.removeEventListener('issb-auth-expired', onAuthExpired)
  }, [])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'issb-token') {
        const nextToken = readStoredToken()
        setToken(nextToken)
        if (!nextToken) {
          saveProfile({ name: 'Candidate', email: '', nationality: 'Bangladeshi', verified: false, mode: 'candidate' })
          setHistory([])
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => { refreshHistory() }, [refreshHistory])
  const updateSettings = (key) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next); localStorage.setItem('issb-settings', JSON.stringify(next))
  }
  const stats = useMemo(() => {
    const scored = history.filter((item) => Number.isFinite(Number(item.score)))
    const average = scored.length ? scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length : 0
    const best = scored.length ? Math.max(...scored.map((item) => Number(item.score))) : 0
    return { sessions: history.length, average: average.toFixed(1), best: best.toFixed(1) }
  }, [history])

  const isAuthenticated = Boolean(isValidToken(token) || readStoredToken())

  return <AppContext.Provider value={{ token, setToken, isAuthenticated, profile, saveProfile, history, addAttempt, refreshHistory, historyLoading, historyError, settings, updateSettings, stats }}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
