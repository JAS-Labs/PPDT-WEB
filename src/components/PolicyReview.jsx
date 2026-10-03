import { useEffect, useState } from 'react'
import { authApi } from '../services/liveApi'

export default function PolicyReview() {
  const [state, setState] = useState(null)
  const [terms, setTerms] = useState(false)
  const [research, setResearch] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = async () => {
    setTerms(false); setResearch(false)
    return authApi.policyAcceptance()
  }
  useEffect(() => {
    let active = true
    authApi.policyAcceptance?.().then((next) => { if (active) setState(next) }).catch((err) => { if (active && err.status !== 404) setError(err.message) })
    return () => { active = false }
  }, [])
  const accept = async () => {
    setBusy(true); setError('')
    try {
      const next = await authApi.acceptPolicies({ terms_accepted: terms, privacy_acknowledged: terms, research_consent: research,
        ...Object.fromEntries(state.catalog.policies.map((document) => [`${document.document_type}_version`, document.version])) })
      setState(next); setTerms(false); setResearch(false)
    } catch (err) {
      setError(err.message)
      if (err.status === 409) { try { setState(await load()) } catch (next) { setError(next.message) } }
    } finally { setBusy(false) }
  }
  if (!state?.catalog?.ready) return error ? <p className="form-error" role="alert">Policy records could not be loaded: {error}</p> : null
  return <section className="settings-list">
    <h3>Terms, privacy & research consent</h3>
    <p>{state.has_accepted_current ? 'You have accepted the current policy versions.' : 'Review the current documents and record your choices.'}</p>
    {state.catalog.policies.map((document) => <details className="auth-terms" key={document.document_type}>
      <summary>{document.document_type} · {document.version}</summary><div className="auth-policy-document">{document.content}</div>
    </details>)}
    {!state.has_accepted_current && <>
      <label className="consent-row"><input type="checkbox" checked={terms} disabled={busy} onChange={(event) => setTerms(event.target.checked)} />I accept the Terms and Conditions and acknowledge the Privacy Policy.</label>
      <label className="consent-row"><input type="checkbox" checked={research} disabled={busy} onChange={(event) => setResearch(event.target.checked)} />I agree that my anonymized responses may be used for ISSB psychometric research.</label>
      <button className="primary-button" disabled={busy || !terms || !research} onClick={accept}>{busy ? 'Saving…' : 'Save acceptance'}</button>
    </>}
    {state.acceptances?.length > 0 && <details><summary>Acceptance records</summary>{state.acceptances.map((receipt) => <p key={`${receipt.document_type}:${receipt.version}`}>{receipt.document_type} · {receipt.version} · {new Date(receipt.accepted_at).toLocaleString()}</p>)}</details>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>
}
