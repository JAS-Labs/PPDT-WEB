import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, LIVE_API_URL, authApi, getAllHistory, practiceApi, analyticsApi, historyApi } from '../services/liveApi'

const ok = (data = {}) => Promise.resolve({ ok: true, json: async () => data })

beforeEach(() => {
  localStorage.setItem('issb-token', 'account-token')
  vi.stubGlobal('fetch', vi.fn(() => ok({})))
})

afterEach(() => {
  localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks()
})

describe('production API contract', () => {
  it('does not report incomplete history as a successful refresh', async () => {
    fetch.mockImplementation((url) => url.includes('/wat/history')
      ? Promise.resolve({ ok: false, status: 503, json: async () => ({ detail: 'Unavailable' }) })
      : ok([]))
    await expect(getAllHistory()).rejects.toThrow('Could not refresh WAT history')
  })

  it('propagates expired authentication even when another history endpoint succeeds', async () => {
    fetch.mockImplementation((url) => url.includes('/wat/history')
      ? Promise.resolve({ ok: false, status: 401, json: async () => ({ detail: 'Expired' }) })
      : ok([]))
    await expect(getAllHistory()).rejects.toMatchObject({ status: 401 })
  })

  it('keeps the production base URL and uses the dev proxy locally', () => {
    expect(LIVE_API_URL).toBe('https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io/api/v1')
    expect(API_BASE_URL).toBe('/api/v1')
  })

  it('sends the bearer token and login payload', async () => {
    fetch.mockImplementationOnce(() => ok({ access_token: 'next-token' }))
    await authApi.login('candidate@example.com', 'secret')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('/api/v1/auth/login')
    expect(options.body).toBe(JSON.stringify({ email: 'candidate@example.com', password: 'secret' }))
    expect(options.headers.Authorization).toBe('Bearer account-token')
  })

  it('uses live PPDT image and evaluation contracts', async () => {
    await practiceApi.getPpdtImage()
    await practiceApi.submitPpdt({ image_id: 'img-1', spot_text: 'people', action_text: 'helping', story_text: 'A complete story', logic_text: 'visual clues' })
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/images/random')
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/evaluate')
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({ image_id: 'img-1', spot_text: 'people', action_text: 'helping', story_text: 'A complete story', logic_text: 'visual clues' })
  })

  it('uses live WAT and SCT sets with timing and set codes', async () => {
    await practiceApi.getWatWords(15); await practiceApi.submitWat([{ word: 'Duty', response: 'I act', response_time_ms: 1200 }], 'A')
    await practiceApi.getSctStems(30); await practiceApi.submitSct([{ stem: 'I can', response: 'lead', response_time_ms: 1600 }], 'B')
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/v1/wat/words?time_per_word=15', '/api/v1/wat/evaluate', '/api/v1/sct/stems?time_per_sentence=30', '/api/v1/sct/evaluate'])
    expect(JSON.parse(fetch.mock.calls[1][1].body).set_code).toBe('A')
    expect(JSON.parse(fetch.mock.calls[3][1].body).set_code).toBe('B')
  })

  it('uses live TAT and SDT contracts', async () => {
    await practiceApi.getTatImage(); await practiceApi.submitTat('tat-1', 'A sufficiently complete story response.')
    await practiceApi.getSdtPrompts(); await practiceApi.submitSdt([{ prompt: 'Describe yourself', response: 'Dependable and reflective' }], 'C')
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/v1/tat/images?count=1', '/api/v1/tat/evaluate', '/api/v1/sdt/prompts', '/api/v1/sdt/evaluate'])
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ image_id: 'tat-1', story_text: 'A sufficiently complete story response.' })
    expect(JSON.parse(fetch.mock.calls[3][1].body).set_code).toBe('C')
  })

  it('requests history for all five assessments', async () => {
    fetch.mockImplementation(() => ok([]))
    await getAllHistory()
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/v1/history', '/api/v1/wat/history', '/api/v1/tat/history', '/api/v1/sdt/history', '/api/v1/sct/history'])
  })

  it('supports signup and logout contracts', async () => {
    fetch.mockImplementationOnce(() => ok({ success: true, access_token: 'new-token' }))
    await authApi.signup({ email: 'new@example.com', password: 'password123', age: 22, nationality: 'Bangladeshi', research_consent: true })
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/auth/signup')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ email: 'new@example.com', age: 22, nationality: 'Bangladeshi', research_consent: true })

    fetch.mockImplementationOnce(() => ok({ success: true }))
    await authApi.logout()
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/auth/logout')
  })

  it('supports analytics and history export contracts', async () => {
    await analyticsApi.getOverallJudge(true)
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/analytics/overall-judge?re_evaluate=true')

    await analyticsApi.getAverages(500)
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/analytics/averages?sample_size=500')

    await analyticsApi.getPercentile(8.0, 'ppdt')
    expect(fetch.mock.calls[2][0]).toBe('/api/v1/analytics/percentile?score=8&test_type=ppdt&sample_size=1000')

    await historyApi.exportHistory()
    expect(fetch.mock.calls[3][0]).toBe('/api/v1/history/export')
  })

  it('supports community responses contracts for PPDT and TAT', async () => {
    await practiceApi.getImageResponses('img-123', 15)
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/images/img-123/responses?limit=15')

    await practiceApi.getTatImageResponses('tat-456', 20)
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/tat/images/tat-456/responses?limit=20')
  })

  it('correctly maps FastAPI 422 validation error arrays to readable strings', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 422,
      json: async () => ({
        detail: [
          { loc: ['body', 'email'], msg: 'value is not a valid email address' },
          { loc: ['body', 'password'], msg: 'ensure this value has at least 8 characters' }
        ]
      })
    }))

    await expect(authApi.login('bad-email', 'short')).rejects.toThrow(
      'value is not a valid email address; ensure this value has at least 8 characters'
    )
  })

  it('clears token and dispatches auth expired event on 401 Unauthorized', async () => {
    const expiredListener = vi.fn()
    window.addEventListener('issb-auth-expired', expiredListener)

    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Token has expired' })
    }))

    await expect(practiceApi.getPpdtImage()).rejects.toThrow('Token has expired')
    expect(localStorage.getItem('issb-token')).toBeNull()
    expect(expiredListener).toHaveBeenCalledOnce()
    window.removeEventListener('issb-auth-expired', expiredListener)
  })

  it('passes difficulty and set query parameters for PPDT and TAT image queries', async () => {
    await practiceApi.getPpdtImage('hard', 'A')
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/images/random?difficulty=hard&set=A')

    await practiceApi.getPpdtImages({ difficulty: 'easy', set: 'B', limit: 5 })
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/images?difficulty=easy&set=B&limit=5')

    await practiceApi.getTatImage('medium', 'C')
    expect(fetch.mock.calls[2][0]).toBe('/api/v1/tat/images?count=1&difficulty=medium&set=C')

    await practiceApi.getTatImages({ difficulty: 'hard', set: 'A', count: 4 })
    expect(fetch.mock.calls[3][0]).toBe('/api/v1/tat/images?difficulty=hard&set=A&count=4')
  })

  it('converts network errors / Failed to fetch into actionable ApiNetworkError', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/Unable to connect to the authentication server/i)
  })

  it('converts Disallowed CORS origin into actionable diagnostic error', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Disallowed CORS origin' }),
    }))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/Cross-origin request blocked by the server/i)
  })

  it('handles 502/503/504 container status gracefully', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'Service Unavailable' }),
    }))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/The service is temporarily unavailable/i)
  })

  it('rejects with proxy diagnostic error when endpoint returns HTML document on 200/404', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      status: 200,
      headers: {
        get: (h) => (h === 'content-type' ? 'text/html; charset=utf-8' : null),
      },
      json: async () => ({}),
    }))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/The API endpoint returned an HTML document instead of an API response/i)
  })

  it('treats 502/503/504 HTML error page as service unavailable rather than proxy configuration error', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 504,
      headers: {
        get: (h) => (h === 'content-type' ? 'text/html; charset=utf-8' : null),
      },
      json: async () => { throw new Error('not json') },
    }))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/The service is temporarily unavailable \(HTTP 504\)/i)
  })

  it('provides actionable diagnostic when API endpoint returns 404', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 404,
      headers: {
        get: (h) => (h === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({ detail: 'Not Found' }),
    }))
    await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
      .rejects.toThrow(/The API endpoint was not found \(HTTP 404\)/i)
  })

  it('detects offline state and throws specific offline ApiNetworkError', async () => {
    const originalOnLine = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))

    try {
      await expect(authApi.signup({ email: 'cand@test.com', password: 'password123', age: 21, nationality: 'Bangladeshi', research_consent: true }))
        .rejects.toThrow(/You are currently offline/i)
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true })
    }
  })
})


