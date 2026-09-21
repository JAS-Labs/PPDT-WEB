import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, LIVE_API_URL, authApi, getAllHistory, practiceApi } from '../services/liveApi'

const ok = (data = {}) => Promise.resolve({ ok: true, json: async () => data })

beforeEach(() => {
  localStorage.setItem('issb-token', 'account-token')
  vi.stubGlobal('fetch', vi.fn(() => ok({})))
})

afterEach(() => {
  localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks()
})

describe('production API contract', () => {
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
})
