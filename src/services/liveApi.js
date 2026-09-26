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

async function request(path, options = {}) {
  const authToken = token()
  const requestUrl = `${API_BASE_URL}${path}`
  let response

  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    })
  } catch (networkErr) {
    throw handleFetchError(networkErr, requestUrl)
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

  const data = await response.json().catch(() => ({}))
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

    if (response.status === 401 && typeof window !== 'undefined') {
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
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
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

      items.push({
        id: entry.session_id || entry.id || `${type}-${entry.created_at}`,
        type,
        timestamp: entry.created_at || entry.timestamp || new Date().toISOString(),
        date: new Date(entry.created_at || entry.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: durationStr,
        score: Number(feedback.overall_score ?? entry.overall_score ?? 0),
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
      })
    }
  })
  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export { LIVE_API_URL }
