import { useEffect, useRef } from 'react'

// Tab-scoped storage supports recovery without keeping permanent practice drafts.
// Account identity prevents another signed-in user from restoring these responses.
export function draftKey(testId) {
  let email = ''
  try { email = JSON.parse(localStorage.getItem('issb-profile') || '{}').email || '' } catch {}
  const identity = email || localStorage.getItem('issb-token') || 'anonymous'
  let hash = 2166136261
  for (const char of identity) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `issb-draft-v1:${hash >>> 0}:${testId}`
}

export default function useSessionDraft(testId, phase, snapshot, restore) {
  const key = draftKey(testId)
  const initialized = useRef(false)
  const active = !['setup', 'loading', 'result'].includes(phase)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null')
      if (saved?.version === 1 && Date.now() - saved.savedAt < 86400000) restore(saved.snapshot)
      else sessionStorage.removeItem(key)
    } catch { try { sessionStorage.removeItem(key) } catch {} }
  }, [key])

  useEffect(() => {
    try {
      if (phase === 'result') sessionStorage.removeItem(key)
      else if (active) sessionStorage.setItem(key, JSON.stringify({ version: 1, savedAt: Date.now(), snapshot }))
    } catch { /* Navigation warning remains available when storage is full or disabled. */ }
  }, [key, phase, active, snapshot])

  useEffect(() => {
    if (!active) return
    const unload = (event) => { event.preventDefault(); event.returnValue = '' }
    const navigate = (event) => {
      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey) return
      const url = new URL(link.href, location.href)
      if (url.pathname === location.pathname) return
      if (!window.confirm('Leave this unfinished practice session? Keep this tab open to recover your draft. Answers may be lost if browser storage is unavailable.')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', navigate, true)
    return () => {
      window.removeEventListener('beforeunload', unload)
      document.removeEventListener('click', navigate, true)
    }
  }, [active])

  return () => { try { sessionStorage.removeItem(key) } catch {} }
}
