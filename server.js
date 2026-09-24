import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT || 9001)
const STORAGE_API = 'http://127.0.0.1:9002'
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist')

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.ico': 'image/x-icon'
}

async function proxy(req, res, targetUrl) {
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value != null && !['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
    }

    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      duplex: body ? 'half' : undefined
    })

    res.statusCode = upstream.status
    upstream.headers.forEach((value, key) => {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value)
      }
    })

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.end(buffer)
  } catch (error) {
    console.error('Storage API proxy error:', error)
    res.statusCode = 502
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: 'Storage API unavailable' }))
  }
}

function serveFile(res, file) {
  try {
    const stat = fs.statSync(file)
    if (!stat.isFile()) return false
    res.statusCode = 200
    res.setHeader('content-type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream')
    res.setHeader('content-length', stat.size)
    fs.createReadStream(file).pipe(res)
    return true
  } catch {
    return false
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pathname = decodeURIComponent(url.pathname)

  if (pathname.startsWith('/api/') || pathname === '/api' || pathname.startsWith('/media/') || pathname === '/media') {
    await proxy(req, res, STORAGE_API + url.pathname + url.search)
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const requested = path.resolve(DIST, relative)

  if (!requested.startsWith(DIST + path.sep) && requested !== DIST) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  if (serveFile(res, requested)) return

  if (!path.extname(pathname) && serveFile(res, path.join(DIST, 'index.html'))) return

  res.statusCode = 404
  res.setHeader('content-type', 'text/plain; charset=utf-8')
  res.end('Not Found')
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NYXTRYP Music listening on ${PORT}`)
})
