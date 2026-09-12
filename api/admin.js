import { list, del, copy } from '@vercel/blob'

const OWNER = 'nyxtryp'
const REPO = 'nyxtryp'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

const folders = {
  tracks: 'public/audio/tracks',
  radio: 'public/audio/radio',
  mixes: 'public/audio/mixes',
  photos: 'public/photos'
}

const audioTypes = new Set(['tracks', 'radio', 'mixes'])

function json(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(data))
}

async function github(path, options = {}) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not configured')
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  })
  const text = await response.text()
  let data
  try { data = JSON.parse(text) } catch { data = { message: text } }
  if (!response.ok) { const error = new Error(data.message || 'GitHub request failed'); error.status = response.status; throw error }
  return data
}

function checkAdmin(body) {
  const adminKey = process.env.GUESTBOOK_ADMIN_KEY
  return Boolean(adminKey && String(body?.adminKey || '') === adminKey)
}

function safeName(name) {
  const value = String(name || '').trim()
  if (!value || value === '.' || value === '..') return null
  if (value.includes('/') || value.includes('\\') || value.includes('..')) return null
  return value
}

async function listFiles(folder) {
  const data = await github(`/contents/${folder}?ref=main`)
  if (!Array.isArray(data)) return []
  return data.filter(item => item.type === 'file').map(item => item.name).sort((a, b) => a.localeCompare(b))
}

async function listAudio(type) {
  const result = await list({ prefix: `${type}/`, limit: 1000 })
  return (result.blobs || [])
    .filter(blob => blob.pathname.startsWith(`${type}/`))
    .map(blob => ({ name: blob.pathname.slice(type.length + 1), url: blob.url }))
    .filter(item => safeName(item.name))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function findBlob(type, name) {
  const target = `${type}/${name}`
  const result = await list({ prefix: `${type}/`, limit: 1000 })
  return (result.blobs || []).find(blob => blob.pathname === target) || null
}

async function githubRename(type, oldName, newName) {
  const folder = folders[type]
  const oldPath = `${folder}/${oldName}`
  const newPath = `${folder}/${newName}`
  const oldEncoded = encodeURIComponent(oldPath).replace(/%2F/g, '/')
  const newEncoded = encodeURIComponent(newPath).replace(/%2F/g, '/')
  const file = await github(`/contents/${oldEncoded}?ref=main`)
  await github(`/contents/${newEncoded}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `admin: rename ${type}/${oldName} to ${newName}`, content: file.content.replace(/\n/g, ''), branch: 'main' })
  })
  await github(`/contents/${oldEncoded}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `admin: remove old name ${type}/${oldName}`, sha: file.sha, branch: 'main' })
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    if (req.method === 'GET') {
      const result = { tracks: [], radio: [], mixes: [], photos: [] }
      for (const type of audioTypes) {
        const [githubFiles, blobFiles] = await Promise.all([
          listFiles(folders[type]),
          listAudio(type)
        ])
        const blobNames = new Set(blobFiles.map(item => item.name))
        result[type] = [...new Set([...githubFiles, ...blobFiles.map(item => item.name)])]
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        result[type] = result[type].filter(name => !blobNames.has(name) || blobFiles.some(item => item.name === name))
      }
      result.photos = await listFiles(folders.photos)
      return json(res, 200, result)
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    if (!checkAdmin(body)) return json(res, 403, { error: 'Forbidden.' })
    if (req.method === 'POST' && body.action === 'auth') return json(res, 200, { ok: true })

    if (req.method === 'POST') {
      if (audioTypes.has(String(body.type || ''))) {
        return json(res, 400, { error: 'Audio files are uploaded directly to storage.' })
      }
      const type = String(body.type || '')
      const name = safeName(body.name)
      const content = String(body.content || '')
      if (!folders[type] || !name || !content) return json(res, 400, { error: 'Type, name and content are required.' })
      if (!/^[A-Za-z0-9+/=\s]+$/.test(content)) return json(res, 400, { error: 'Invalid base64 content.' })
      const folder = folders[type]
      const filePath = `${folder}/${name}`
      const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/')
      let sha
      try {
        const existing = await github(`/contents/${encodedPath}?ref=main`)
        sha = existing.sha
      } catch (error) {
        if (error.status !== 404) throw error
      }
      const payload = { message: `admin: ${sha ? 'replace' : 'add'} ${type}/${name}`, content: content.replace(/\s/g, ''), branch: 'main' }
      if (sha) payload.sha = sha
      await github(`/contents/${encodedPath}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      return json(res, 200, { ok: true, action: sha ? 'replaced' : 'added', type, name })
    }

    if (req.method === 'PATCH') {
      const type = String(body.type || '')
      const oldName = safeName(body.oldName)
      const newName = safeName(body.newName)
      if (!folders[type] || !oldName || !newName) return json(res, 400, { error: 'Type, oldName and newName are required.' })
      if (oldName === newName) return json(res, 400, { error: 'New name must be different.' })

      if (audioTypes.has(type)) {
        const blob = await findBlob(type, oldName)
        if (blob) {
          await copy(blob.url, `${type}/${newName}`, { access: 'public', allowOverwrite: true })
          await del(blob.url)
          return json(res, 200, { ok: true, action: 'renamed', type, oldName, newName })
        }
      }

      await githubRename(type, oldName, newName)
      return json(res, 200, { ok: true, action: 'renamed', type, oldName, newName })
    }

    if (req.method === 'DELETE') {
      const type = String(body.type || '')
      const name = safeName(body.name)
      if (!folders[type] || !name) return json(res, 400, { error: 'Invalid file.' })

      if (audioTypes.has(type)) {
        const blob = await findBlob(type, name)
        if (blob) {
          await del(blob.url)
          return json(res, 200, { ok: true })
        }
      }

      const filePath = `${folders[type]}/${name}`
      const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/')
      const file = await github(`/contents/${encodedPath}?ref=main`)
      await github(`/contents/${encodedPath}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `admin: delete ${type}/${name}`, sha: file.sha, branch: 'main' }) })
      return json(res, 200, { ok: true })
    }

    return json(res, 501, { error: 'Admin operation is not implemented yet.' })
  } catch (error) {
    console.error('Admin API error:', error)
    return json(res, error.status || 500, { error: error.message || 'Admin service error.' })
  }
}
