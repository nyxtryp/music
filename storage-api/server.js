import http from 'node:http'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT || 9002)
const ROOT = '/srv/frostdeploy/music/storage'
const ENV_FILE = '/srv/frostdeploy/music/storage-api/.env'

const TYPES = {
  tracks: { dir: 'tracks', kind: 'audio' },
  radio: { dir: 'radio', kind: 'audio' },
  mixes: { dir: 'mixes', kind: 'audio' },
  photos: { dir: 'photos', kind: 'image' }
}

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'])
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

let adminKey = String(process.env.NYXTRYP_ADMIN_KEY || '')

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  })
  if (type.startsWith('application/json')) res.end(JSON.stringify(data))
  else res.end(data)
}

function safeName(value) {
  const name = String(value || '').trim()
  if (!name || name === '.' || name === '..') return null
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return null
  return name
}

function typeInfo(type) {
  return TYPES[String(type || '')] || null
}

function checkKey(req, bodyKey = '') {
  const supplied = String(req.headers['x-admin-key'] || bodyKey || '')
  return Boolean(adminKey && supplied === adminKey)
}

async function ensureStorage() {
  for (const type of Object.values(TYPES)) {
    await fsp.mkdir(path.join(ROOT, type.dir), { recursive: true })
  }
}

async function readBody(req, limit = 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new Error('BODY_TOO_LARGE')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

async function readJson(req) {
  const raw = await readBody(req)
  try { return raw ? JSON.parse(raw) : {} }
  catch { return null }
}

function filePath(type, name) {
  return path.join(ROOT, type.dir, name)
}

async function listMedia() {
  const result = {}
  for (const [id, type] of Object.entries(TYPES)) {
    const dir = path.join(ROOT, type.dir)
    const names = (await fsp.readdir(dir, { withFileTypes: true }))
      .filter(x => x.isFile())
      .map(x => x.name)
      .sort((a, b) => a.localeCompare(b))
    result[id] = names
  }
  return result
}

async function saveEnvKey(newKey) {
  const text = `NYXTRYP_ADMIN_KEY=${JSON.stringify(newKey)}\n`
  const tmp = `${ENV_FILE}.tmp-${randomUUID()}`
  await fsp.writeFile(tmp, text, { mode: 0o600 })
  await fsp.rename(tmp, ENV_FILE)
  adminKey = newKey
}

function extensionAllowed(type, name) {
  const ext = path.extname(name).toLowerCase()
  return type.kind === 'audio' ? AUDIO_EXT.has(ext) : IMAGE_EXT.has(ext)
}

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pathname = url.pathname

  if (req.method === 'GET' && pathname === '/api/health') {
    return send(res, 200, { ok: true, service: 'nyxtryp-music-storage' })
  }

  if (req.method === 'GET' && pathname === '/api/media') {
    return send(res, 200, await listMedia())
  }

  if (req.method === 'GET' && pathname === '/api/admin') {
    if (!checkKey(req)) return send(res, 401, { ok: false, error: 'unauthorized' })
    return send(res, 200, await listMedia())
  }

  if (req.method === 'POST' && pathname === '/api/admin') {
    const body = await readJson(req)
    if (!body || body.action !== 'auth' || !checkKey(req, body.adminKey)) {
      return send(res, 401, { ok: false, error: 'unauthorized' })
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'POST' && pathname === '/api/admin/password') {
    const body = await readJson(req)
    if (!body || !checkKey(req, body.adminKey)) {
      return send(res, 401, { ok: false, error: 'unauthorized' })
    }
    const nextKey = String(body.newKey || '').trim()
    if (nextKey.length < 8) {
      return send(res, 400, { ok: false, error: 'password_min_8' })
    }
    await saveEnvKey(nextKey)
    return send(res, 200, { ok: true })
  }

  if (req.method === 'POST' && pathname === '/api/upload') {
    if (!checkKey(req)) return send(res, 401, { ok: false, error: 'unauthorized' })

    const type = typeInfo(url.searchParams.get('type'))
    const name = safeName(url.searchParams.get('name'))
    if (!type || !name) return send(res, 400, { ok: false, error: 'invalid_file' })
    if (!extensionAllowed(type, name)) return send(res, 400, { ok: false, error: 'invalid_extension' })

    const target = filePath(type, name)
    const tmp = `${target}.upload-${randomUUID()}`
    try {
      await pipeline(req, fs.createWriteStream(tmp, { flags: 'wx', mode: 0o640 }))
      await fsp.rename(tmp, target)
      return send(res, 200, { ok: true, name })
    } catch (err) {
      await fsp.rm(tmp, { force: true }).catch(() => {})
      if (err?.code === 'LIMIT') return send(res, 413, { ok: false, error: 'too_large' })
      return send(res, 500, { ok: false, error: 'upload_failed' })
    }
  }

  if (req.method === 'DELETE' && pathname === '/api/admin') {
    const body = await readJson(req)
    if (!body || !checkKey(req, body.adminKey)) return send(res, 401, { ok: false, error: 'unauthorized' })

    const type = typeInfo(body.type)
    const name = safeName(body.name)
    if (!type || !name) return send(res, 400, { ok: false, error: 'invalid_file' })

    await fsp.rm(filePath(type, name), { force: true })
    return send(res, 200, { ok: true })
  }

  if (req.method === 'PATCH' && pathname === '/api/admin') {
    const body = await readJson(req)
    if (!body || !checkKey(req, body.adminKey)) return send(res, 401, { ok: false, error: 'unauthorized' })

    const type = typeInfo(body.type)
    const oldName = safeName(body.oldName)
    const newName = safeName(body.newName)
    if (!type || !oldName || !newName || !extensionAllowed(type, newName)) {
      return send(res, 400, { ok: false, error: 'invalid_file' })
    }

    await fsp.rename(filePath(type, oldName), filePath(type, newName))
    return send(res, 200, { ok: true, name: newName })
  }

  if (req.method === 'GET' && pathname.startsWith('/media/')) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length !== 3) return send(res, 404, { ok: false, error: 'not_found' })

    const type = typeInfo(parts[1])
    const name = safeName(decodeURIComponent(parts[2]))
    if (!type || !name) return send(res, 404, { ok: false, error: 'not_found' })

    const target = filePath(type, name)
    try {
      const stat = await fsp.stat(target)
      if (!stat.isFile()) return send(res, 404, { ok: false, error: 'not_found' })

      const ext = path.extname(name).toLowerCase()
      const mime = {
        '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
        '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg',
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.webp': 'image/webp', '.gif': 'image/gif'
      }[ext] || 'application/octet-stream'

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      })
      return fs.createReadStream(target).pipe(res)
    } catch {
      return send(res, 404, { ok: false, error: 'not_found' })
    }
  }

  return send(res, 404, { ok: false, error: 'not_found' })
}

ensureStorage()
  .then(() => {
    http.createServer((req, res) => {
      handle(req, res).catch(err => {
        if (err?.message === 'BODY_TOO_LARGE') return send(res, 413, { ok: false, error: 'body_too_large' })
        if (!res.headersSent) return send(res, 500, { ok: false, error: 'server_error' })
        res.destroy()
      })
    }).listen(PORT, '127.0.0.1', () => {
      console.log(`NYXTRYP MUSIC STORAGE listening on 127.0.0.1:${PORT}`)
    })
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
