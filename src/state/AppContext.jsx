import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAllHistory } from '../services/liveApi'

const AppContext = createContext(null)

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => read('issb-profile', { name: 'Guest', email: '', verified: false, mode: 'guest' }))
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [settings, setSettings] = useState(() => read('issb-settings', { reminders: true, sounds: true, compact: false }))

  const saveProfile = (next) => { setProfile(next); localStorage.setItem('issb-profile', JSON.stringify(next)) }
  const addAttempt = (attempt) => setHistory((current) => [{ id: attempt.id || crypto.randomUUID(), date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Completed', ...attempt }, ...current.filter((item) => item.id !== attempt.id)])
  const refreshHistory = useCallback(async () => {
    if (!localStorage.getItem('issb-token')) { setHistory([]); return }
    setHistoryLoading(true); setHistoryError('')
    try { setHistory(await getAllHistory()) } catch (error) { setHistoryError(error.message) } finally { setHistoryLoading(false) }
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

  return <AppContext.Provider value={{ profile, saveProfile, history, addAttempt, refreshHistory, historyLoading, historyError, settings, updateSettings, stats }}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
