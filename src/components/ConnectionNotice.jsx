import { useEffect, useState } from 'react'

export default function ConnectionNotice() {
  const [offline, setOffline] = useState(() => navigator.onLine === false)
  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  if (!offline) return null
  return <aside className="connection-notice" role="status">You’re offline. Keep this page open—practice drafts are saved locally. Reconnect before loading or submitting a session.</aside>
}
