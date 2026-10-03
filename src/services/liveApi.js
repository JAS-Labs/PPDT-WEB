const LIVE_API_URL = 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io/api/v1'

// Default to '/api/v1' in development/tests and in browser deployments behind a reverse proxy (e.g. Vercel rewrites),
// keeping API requests same-origin and preventing browser CORS restrictions.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  (import.meta.env.DEV || typeof window !== 'undefined') ? '/api/v1' : LIVE_API_URL
)

export class ApiNetworkError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ApiNetworkError'
    this.isNetworkError = true
    this.status = details.status || 0
    this.isCors = details.isCors || false
    this.isOffline = details.isOffline || false
    this.isColdStart = details.isColdStart || false
    this.originalError = details.originalError
  }
}

function handleFetchError(err, url) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new ApiNetworkError(
      'You are currently offline. Please check your internet connection and try again.',
      { isOffline: true, originalError: err }
    )
  }

  const isDirectAzure = typeof url === 'string' && url.includes('azurecontainerapps.io')
  return new ApiNetworkError(
    'Unable to connect to the authentication server. Please wait a moment and try again.',
    { isColdStart: true, isCors: isDirectAzure, originalError: err }
  )
}

function token() {
  const raw = localStorage.getItem('issb-token')
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    try { localStorage.removeItem('issb-token') } catch {}
    return null
  }
  return trimmed
}

const pendingEvaluations = new Map()
const evaluationKeys = new Map()
let refreshing = null

export async function refreshBrowserSession() {
  if (refreshing) return refreshing
  const previousToken = token()
  refreshing = performRequest('/auth/refresh?browser_session=true', {
    method: 'POST', body: '{}', headers: { 'X-ISSB-Browser': '1' }, skipRefresh: true,
  }).then((result) => {
    if (token() !== previousToken) throw new Error('Your account changed. Please reload the page.')
    if (!result.access_token) throw new Error('Please sign in again.')
    localStorage.setItem('issb-token', result.access_token)
    window.dispatchEvent(new CustomEvent('issb-token-refreshed', { detail: result.access_token }))
    return result
  }).finally(() => { refreshing = null })
  return refreshing
}

function tokenNeedsRefresh(value) {
  try { return JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000 < Date.now() + 60000 }
  catch { return false }
}

export async function waitForEvaluation(job, account = submissionAccount(token())) {
  const deadline = Date.now() + 6 * 60000
  while (['queued', 'running', 'saving'].includes(job.status)) {
    if (Date.now() >= deadline) throw new Error('Your evaluation is still processing. Open History to check its progress.')
    await new Promise((resolve) => setTimeout(resolve, 5000))
    if (submissionAccount(token()) !== account) throw new Error('Your account changed. Please reopen History.')
    job = await performRequest(`/evaluation-jobs/${job.job_id}`)
  }
  if (job.status === 'completed' && job.result) return job.result
  throw new Error(job.status === 'failed'
    ? 'The answers could not be evaluated. Please check your response before starting a new attempt.'
    : 'This evaluation needs recovery. Check History for its status; your answers are still saved.')
}

function submissionAccount(authToken) {
  try {
    const encoded = authToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(encoded))
    if (typeof claims.sub === 'string' && claims.sub) return claims.sub
  } catch {}
  return authToken
}

async function submitEvaluation(path, options) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw handleFetchError(new Error('Offline'), path)
  }
  const authToken = token()
  if (!crypto.subtle) throw new Error('Open the app over HTTPS or localhost to submit securely.')
  const identity = JSON.stringify([submissionAccount(authToken), path, options.body])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))
  if (token() !== authToken) throw new Error('Your account changed. Please reopen the practice session before submitting.')
  const storageKey = `issb-submission:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`
  let submissionKey = evaluationKeys.get(storageKey)
  try { submissionKey ||= sessionStorage.getItem(storageKey) } catch {}
  submissionKey ||= crypto.randomUUID()
  evaluationKeys.set(storageKey, submissionKey)
  try { sessionStorage.setItem(storageKey, submissionKey) } catch {}
  const background = import.meta.env.VITE_BACKGROUND_EVALUATIONS === 'true' || (import.meta.env.PROD && import.meta.env.VITE_BACKGROUND_EVALUATIONS !== 'false')
  const testType = path === '/evaluate' ? 'ppdt' : path.split('/')[1]
  const response = await performRequest(background ? `/evaluation-jobs/${testType}` : path, { ...options, headers: { ...options.headers, 'Idempotency-Key': submissionKey } })
  const data = background ? await waitForEvaluation(response, submissionAccount(authToken)) : response
  // Keep the key through timeouts, errors, and reloads. A successful receipt ends this attempt.
  evaluationKeys.delete(storageKey)
  try { sessionStorage.removeItem(storageKey) } catch {}
  return data
}

function request(path, options = {}) {
  if (options.method !== 'POST' || !/\/evaluate$/.test(path)) return performRequest(path, options)
  // Coalesce identical in-flight submissions, but never automatically retry a POST.
  const key = JSON.stringify([token(), path, options.body])
  if (pendingEvaluations.has(key)) return pendingEvaluations.get(key)
  const pending = submitEvaluation(path, options).finally(() => pendingEvaluations.delete(key))
  pendingEvaluations.set(key, pending)
  return pending
}

async function performRequest(path, options = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw handleFetchError(new Error('Offline'), path)
  }
  if (!path.startsWith('/auth/') && !options.skipRefresh && tokenNeedsRefresh(token())) await refreshBrowserSession()
  const authToken = token()
  const requestUrl = `${API_BASE_URL}${path}`
  let response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.method === 'POST' ? 120000 : 30000)

  try {
    response = await fetch(requestUrl, {
      ...options,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    })
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') {
      const error = new ApiNetworkError(options.method === 'POST'
        ? 'The request timed out. It may still have completed on the server. Check your history before retrying; your saved draft is available.'
        : 'The request timed out. Please try loading again.')
      error.isTimeout = true
      throw error
    }
    throw handleFetchError(networkErr, requestUrl)
  } finally {
    clearTimeout(timeout)
  }

  const contentType = response.headers?.get ? (response.headers.get('content-type') || '') : ''
  if (contentType.includes('text/html')) {
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      const error = new Error(
        `The service is temporarily unavailable (HTTP ${response.status}). Please wait a few seconds and try again.`
      )
      error.status = response.status
      error.isColdStart = true
      throw error
    }
    const error = new Error(
      'The API endpoint returned an HTML document instead of an API response. This indicates an unconfigured proxy or routing issue.'
    )
    error.status = response.status
    error.isProxyError = true
    throw error
  }

  const data = response.status === 204 ? {} : await response.json().catch(() => {
    if (!response.ok) return {}
    throw new Error('The service returned an unreadable response. Please check your history before retrying a submission.')
  })
  if (!response.ok) {
    let message = data.detail || data.error || 'The live service could not complete this request.'
    if (Array.isArray(message)) {
      message = message
        .map((item) => (typeof item === 'object' && item !== null ? item.msg || item.message || JSON.stringify(item) : String(item)))
        .join('; ')
    } else if (typeof message === 'object' && message !== null) {
      message = message.message || message.detail || JSON.stringify(message)
    }

    if (typeof message === 'string' && message.includes('Disallowed CORS origin')) {
      message = 'Cross-origin request blocked by the server. Please ensure requests are routed through the configured proxy or an allowed origin.'
    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
      message = 'The service is temporarily unavailable (HTTP ' + response.status + '). ' + (data.detail ? `(${data.detail}) ` : '') + 'Please wait a few seconds and try again.'
    } else if (response.status === 429) {
      message = data.detail || 'Rate limit reached. Please wait a moment before trying again.'
    } else if (response.status === 404 && API_BASE_URL.startsWith('/')) {
      message = 'The API endpoint was not found (HTTP 404). Please ensure the reverse proxy rewrite is configured on your web host.'
    }

    if (response.status === 401 && authToken && token() === authToken && typeof window !== 'undefined') {
      localStorage.removeItem('issb-token')
      window.dispatchEvent(new CustomEvent('issb-auth-expired', { detail: { path, status: 401 } }))
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}

export const authApi = {
  policies: () => request('/auth/policies'),
  policyAcceptance: () => request('/auth/policy-acceptance'),
  acceptPolicies: (payload) => request('/auth/policy-acceptance', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email, password) => request('/auth/login?browser_session=true', { method: 'POST', headers: { 'X-ISSB-Browser': '1' }, body: JSON.stringify({ email, password }) }),
  signup: (payload) => request('/auth/signup?browser_session=true', { method: 'POST', headers: { 'X-ISSB-Browser': '1' }, body: JSON.stringify(payload) }),
  requestPasswordReset: (email) => request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  confirmPasswordReset: (payload) => request('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  profile: () => request('/auth/me'),
}

export const practiceApi = {
  getPpdtImage: (difficulty, setCode) => {
    const params = new URLSearchParams()
    if (difficulty) params.append('difficulty', difficulty)
    if (setCode) params.append('set', setCode)
    const q = params.toString()
    return request(`/images/random${q ? `?${q}` : ''}`)
  },
  getPpdtImages: (options = {}) => {
    const params = new URLSearchParams()
    if (options.difficulty) params.append('difficulty', options.difficulty)
    if (options.setCode || options.set) params.append('set', options.setCode || options.set)
    if (options.limit) params.append('limit', options.limit)
    const q = params.toString()
    return request(`/images${q ? `?${q}` : ''}`)
  },
  submitPpdt: (payload) => request('/evaluate', { method: 'POST', body: JSON.stringify(payload) }),
  getImageResponses: (imageId, limit = 10) => request(`/images/${imageId}/responses?limit=${limit}`),
  getWatWords: (seconds) => request(`/wat/words?time_per_word=${seconds}`),
  submitWat: (responses, setCode) => request('/wat/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
  getTatImage: (difficulty, setCode) => {
    const params = new URLSearchParams({ count: '1' })
    if (difficulty) params.append('difficulty', difficulty)
    if (setCode) params.append('set', setCode)
    return request(`/tat/images?${params.toString()}`)
  },
  getTatImages: (options = {}) => {
    const params = new URLSearchParams()
    if (options.difficulty) params.append('difficulty', options.difficulty)
    if (options.setCode || options.set) params.append('set', options.setCode || options.set)
    if (options.count) params.append('count', options.count)
    const q = params.toString()
    return request(`/tat/images${q ? `?${q}` : ''}`)
  },
  submitTat: (imageId, storyText) => request('/tat/evaluate', { method: 'POST', body: JSON.stringify({ image_id: imageId, story_text: storyText }) }),
  getTatImageResponses: (imageId, limit = 10) => request(`/tat/images/${imageId}/responses?limit=${limit}`),
  getSdtPrompts: () => request('/sdt/prompts'),
  submitSdt: (responses, setCode) => request('/sdt/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
  getSctStems: (seconds) => request(`/sct/stems?time_per_sentence=${seconds}`),
  submitSct: (responses, setCode) => request('/sct/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
}

export const analyticsApi = {
  getOverallJudge: (reEvaluate = false) => request(`/analytics/overall-judge${reEvaluate ? '?re_evaluate=true' : ''}`),
  getAverages: (sampleSize = 1000) => request(`/analytics/averages?sample_size=${sampleSize}`),
  getPercentile: (score, testType, sampleSize = 1000) => request(`/analytics/percentile?score=${score}&test_type=${testType}&sample_size=${sampleSize}`),
}

export const historyApi = {
  page: async (cursor) => {
    const data = await request(`/history/page?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
    if (!Array.isArray(data.items)) throw new Error('History could not be loaded. Please try again.')
    return { ...data, items: normalizeHistory(data.items || []) }
  },
  summary: () => request('/history/summary'),
  jobs: () => request('/evaluation-jobs'),
  exportHistory: () => request('/history/export'),
  getSession: (sessionId) => request(`/history/session/${sessionId}`),
}

const historyRequests = [
  ['PPDT', '/history'],
  ['WAT', '/wat/history'],
  ['TAT', '/tat/history'],
  ['SDT', '/sdt/history'],
  ['SCT', '/sct/history'],
]

export async function getAllHistory() {
  try {
    const results = await Promise.allSettled([historyApi.page(), historyApi.summary()])
    const failure = results.find((result) => result.status === 'rejected' && result.reason.status !== 404) || results.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
    const [page, summary] = results.map((result) => result.value)
    if (typeof summary.sessions !== 'number' || !summary.by_type) throw new Error('Lifetime statistics could not be loaded. Please try again.')
    const items = page.items
    items.nextCursor = page.next_cursor
    items.summary = summary
    return items
  } catch (error) {
    if (error.status !== 404) throw error
  }
  return getLegacyHistory()
}

async function getLegacyHistory() {
  const settled = await Promise.allSettled(historyRequests.map(([, path]) => request(path)))
  const failures = settled.filter((result) => result.status === 'rejected')
  const unauthorized = failures.find((result) => result.reason.status === 401)
  if (unauthorized) throw unauthorized.reason
  if (failures.length) {
    const missing = settled.flatMap((result, index) => result.status === 'rejected' ? [historyRequests[index][0]] : [])
    throw new Error(`Could not refresh ${missing.join(', ')} history. Please try again; previously loaded sessions have been kept.`)
  }
  const items = []
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    const type = historyRequests[index][0]
    for (const entry of Array.isArray(result.value) ? result.value : []) {
      items.push(normalizeAttempt(entry, type))
    }
  })
  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export function normalizeHistory(items) {
  return items.map((entry) => normalizeAttempt(entry, entry.test_type.toUpperCase()))
}

function normalizeAttempt(entry, type) {
      const feedback = entry.feedback || entry.ai_feedback_json || {}
      let durationStr = 'Completed'
      if (entry.avg_response_time_ms) {
        const avgSec = Math.round(entry.avg_response_time_ms / 1000)
        const count = entry.word_count || entry.sentence_count
        durationStr = count ? `${count} items · ${avgSec}s avg` : `${avgSec}s avg`
      } else if (type === 'SDT') {
        durationStr = `${entry.section_count || 5} sections`
      } else if (type === 'PPDT' || type === 'TAT') {
        durationStr = '5 min'
      }

      return {
        id: entry.session_id || entry.id || `${type}-${entry.created_at}`,
        type,
        timestamp: entry.created_at || entry.timestamp || new Date().toISOString(),
        date: new Date(entry.created_at || entry.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: durationStr,
        score: feedback.overall_score ?? entry.overall_score ?? null,
        status: 'Completed',
        feedback,
        imageId: entry.image_id,
        imageUrl: entry.image_url,
        storyText: entry.story_text,
        spotText: entry.spot_text,
        actionText: entry.action_text,
        logicText: entry.logic_text,
        responses: entry.responses,
        raw: entry,
      }
}

export { LIVE_API_URL }
