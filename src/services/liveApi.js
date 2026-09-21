const LIVE_API_URL = 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io/api/v1'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api/v1' : LIVE_API_URL)

function token() {
  return localStorage.getItem('issb-token')
}

async function request(path, options = {}) {
  const authToken = token()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.detail || data.error || 'The live service could not complete this request.')
    error.status = response.status
    throw error
  }
  return data
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  profile: () => request('/auth/me'),
}

export const practiceApi = {
  getPpdtImage: () => request('/images/random'),
  submitPpdt: (payload) => request('/evaluate', { method: 'POST', body: JSON.stringify(payload) }),
  getWatWords: (seconds) => request(`/wat/words?time_per_word=${seconds}`),
  submitWat: (responses, setCode) => request('/wat/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
  getTatImage: () => request('/tat/images?count=1'),
  submitTat: (imageId, storyText) => request('/tat/evaluate', { method: 'POST', body: JSON.stringify({ image_id: imageId, story_text: storyText }) }),
  getSdtPrompts: () => request('/sdt/prompts'),
  submitSdt: (responses, setCode) => request('/sdt/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
  getSctStems: (seconds) => request(`/sct/stems?time_per_sentence=${seconds}`),
  submitSct: (responses, setCode) => request('/sct/evaluate', { method: 'POST', body: JSON.stringify({ responses, ...(setCode ? { set_code: setCode } : {}) }) }),
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
  if (failures.length === settled.length) throw failures[0].reason
  const items = []
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    const type = historyRequests[index][0]
    for (const entry of Array.isArray(result.value) ? result.value : []) {
      const feedback = entry.feedback || entry.ai_feedback_json || {}
      items.push({
        id: entry.session_id || entry.id || `${type}-${entry.created_at}`,
        type,
        timestamp: entry.created_at || entry.timestamp || new Date().toISOString(),
        date: new Date(entry.created_at || entry.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: entry.avg_response_time_ms ? `${Math.round(entry.avg_response_time_ms / 1000)}s avg` : 'Completed',
        score: Number(feedback.overall_score ?? entry.overall_score ?? 0),
        status: 'Completed',
      })
    }
  })
  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export { LIVE_API_URL }
