import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { build } from 'vite'

await build()
const assets = {}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await collect(path)
    else if (!entry.name.startsWith('_')) {
      const key = '/' + relative('dist', path).replaceAll('\\', '/')
      const extension = entry.name.slice(entry.name.lastIndexOf('.'))
      assets[key] = { bytes: (await readFile(path)).toString('base64'), type: types[extension] || 'application/octet-stream' }
    }
  }
}
await collect('dist')
const proxy = await readFile('server/siteProxy.js', 'utf8')
const source = `${proxy}\nconst assets = ${JSON.stringify(assets)};\nexport default { async fetch(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return proxyApi(request);
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
  let asset = assets[url.pathname];
  if (!asset && !url.pathname.split('/').pop().includes('.')) asset = assets['/index.html'];
  if (!asset) return new Response('Not found', { status: 404 });
  const bytes = Uint8Array.from(atob(asset.bytes), value => value.charCodeAt(0));
  return new Response(request.method === 'HEAD' ? null : bytes, { headers: { 'Content-Type': asset.type, 'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
}};\n`
await mkdir('dist/server', { recursive: true })
await writeFile('dist/server/index.js', source)
console.log('Built website and same-origin API proxy.')
