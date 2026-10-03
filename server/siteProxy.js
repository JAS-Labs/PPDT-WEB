const API_ORIGIN = 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io'

export async function proxyApi(request) {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/v1/')) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  for (const name of ['authorization', 'content-type', 'idempotency-key', 'x-issb-browser', 'sec-fetch-site', 'origin']) {
    if (request.headers.has(name)) headers.set(name, request.headers.get(name))
  }
  const refresh = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('issb-refresh='))
  if (refresh) headers.set('cookie', refresh)
  try {
    const upstream = await fetch(API_ORIGIN + url.pathname + url.search, {
      method: request.method, headers, redirect: 'manual',
      ...(request.method !== 'GET' && request.method !== 'HEAD' ? { body: request.body, duplex: 'half' } : {}),
    })
    const responseHeaders = new Headers(upstream.headers)
    responseHeaders.set('Cache-Control', 'no-store')
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch {
    return Response.json({ detail: 'The practice service is temporarily unavailable. Please try again.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
