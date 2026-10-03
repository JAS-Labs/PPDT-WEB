import { afterEach, expect, it, vi } from 'vitest'
import { proxyApi } from '../../server/siteProxy'

afterEach(() => vi.unstubAllGlobals())

it('only forwards the app refresh cookie and keeps API responses uncached', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true }), { headers: { 'set-cookie': 'issb-refresh=rotated; Secure; HttpOnly' } }))
  vi.stubGlobal('fetch', fetch)
  const response = await proxyApi(new Request('https://example.com/api/v1/auth/refresh?browser_session=true', {
    method: 'POST', body: '{}', headers: { Cookie: 'site-session=private; issb-refresh=current', 'X-ISSB-Browser': '1', 'X-Forwarded-For': 'forged' },
  }))
  expect(fetch.mock.calls[0][0]).toContain('azurecontainerapps.io/api/v1/auth/refresh?browser_session=true')
  const headers = fetch.mock.calls[0][1].headers
  expect(headers.get('Cookie')).toBe('issb-refresh=current')
  expect(headers.has('X-Forwarded-For')).toBe(false)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(response.headers.get('set-cookie')).toContain('HttpOnly')
})

it('cannot be used as an arbitrary external proxy', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  expect((await proxyApi(new Request('https://example.com/external'))).status).toBe(404)
  expect(fetch).not.toHaveBeenCalled()
})
