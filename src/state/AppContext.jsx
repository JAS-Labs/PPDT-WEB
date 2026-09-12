import { createContext, useContext, useMemo, useState } from 'react'
import { INITIAL_HISTORY } from '../data/tests'

const AppContext = createContext(null)

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => read('issb-profile', { name: 'Saifur', email: '', verified: true, mode: 'guest' }))
  const [history, setHistory] = useState(() => read('issb-history', INITIAL_HISTORY))
  const [settings, setSettings] = useState(() => read('issb-settings', { reminders: true, sounds: true, compact: false }))

  const saveProfile = (next) => { setProfile(next); localStorage.setItem('issb-profile', JSON.stringify(next)) }
  const addAttempt = (attempt) => {
    const next = [{ id: crypto.randomUUID(), date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), status: 'Completed', ...attempt }, ...history]
    setHistory(next); localStorage.setItem('issb-history', JSON.stringify(next))
  }
  const updateSettings = (key) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next); localStorage.setItem('issb-settings', JSON.stringify(next))
  }
  const resetProgress = () => { setHistory(INITIAL_HISTORY); localStorage.setItem('issb-history', JSON.stringify(INITIAL_HISTORY)) }

  const stats = useMemo(() => {
    const scored = history.filter((item) => Number.isFinite(Number(item.score)))
    const average = scored.length ? scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length : 0
    const best = scored.length ? Math.max(...scored.map((item) => Number(item.score))) : 0
    return { sessions: history.length, average: average.toFixed(1), best: best.toFixed(1) }
  }, [history])

  return <AppContext.Provider value={{ profile, saveProfile, history, addAttempt, resetProgress, settings, updateSettings, stats }}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}
