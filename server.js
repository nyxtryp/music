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

async function readJsonBody(req, limit = 64 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new Error('Request too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function normalizeImportUrl(rawUrl) {
  const source = new URL(rawUrl)
  if (!['http:', 'https:'].includes(source.protocol)) throw new Error('Разрешены только HTTP/HTTPS ссылки')

  const driveId =
    source.hostname === 'drive.google.com'
      ? source.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] || source.searchParams.get('id')
      : source.hostname === 'docs.google.com'
        ? source.searchParams.get('id')
        : null

  if (driveId) {
    return 'https://drive.usercontent.google.com/download?export=download&confirm=t&id=' + encodeURIComponent(driveId)
  }

  if (source.hostname === 'localhost' || source.hostname === '127.0.0.1' || source.hostname === '::1' || source.hostname.endsWith('.localhost')) {
    throw new Error('Этот адрес недоступен')
  }

  return source.toString()
}

function filenameFromResponse(response, sourceUrl, type) {
  const disposition = response.headers.get('content-disposition') || ''
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
  if (match) {
    const value = decodeURIComponent(match[1] || match[2]).trim()
    if (value) return value
  }

  const source = new URL(sourceUrl)
  const raw = decodeURIComponent(source.pathname.split('/').filter(Boolean).pop() || '')
  if (raw && !['download', 'uc', 'view'].includes(raw.toLowerCase())) return raw

  return `download-${Date.now()}.${type === 'photos' ? 'jpg' : 'bin'}`
}

function cleanFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[\r\n]/g, '')
    .trim()
    .slice(0, 240)
}

async function importUrl(req, res) {
  try {
    const body = await readJsonBody(req)
    const sourceUrl = String(body.url || '').trim()
    const type = String(body.type || '').trim()
    const adminKey = String(body.adminKey || '')

    if (!sourceUrl) throw new Error('URL не указан')
    if (!['tracks', 'radio', 'mixes', 'photos'].includes(type)) throw new Error('Недопустимая категория')
    if (!adminKey) throw new Error('Admin key не указан')

    const auth = await fetch(`${STORAGE_API}/api/admin`, {
      headers: { 'X-Admin-Key': adminKey }
    })
    if (!auth.ok) throw new Error('Неверный admin key')

    const source = normalizeImportUrl(sourceUrl)
    const remote = await fetch(source, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30 * 60 * 1000)
    })

    if (!remote.ok) throw new Error(`Источник вернул HTTP ${remote.status}`)
    const contentType = (remote.headers.get('content-type') || '').toLowerCase()

    if (contentType.includes('text/html')) {
      throw new Error('Ссылка не ведёт напрямую на файл. Для Google Drive нужен общий доступ по ссылке.')
    }

    const name = cleanFilename(filenameFromResponse(remote, source, type))
    if (!name || name === '.' || name === '..') throw new Error('Не удалось определить имя файла')

    const uploadUrl = `${STORAGE_API}/api/upload?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`
    const headers = new Headers({
      'X-Admin-Key': adminKey,
      'Content-Type': remote.headers.get('content-type') || 'application/octet-stream'
    })
    const length = remote.headers.get('content-length')
    if (length) headers.set('Content-Length', length)

    const upstream = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: remote.body,
      duplex: 'half'
    })

    const text = await upstream.text()
    res.statusCode = upstream.status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(text || JSON.stringify({ ok: upstream.ok, name }))
  } catch (error) {
    console.error('URL import error:', error)
    res.statusCode = error.message === 'Request too large' ? 413 : 400
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: error.message || 'Ошибка загрузки по URL' }))
  }
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

  if (pathname === '/api/import-url' && req.method === 'POST') {
    await importUrl(req, res)
    return
  }

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
