const OWNER = 'nyxtryp'
const REPO = 'nyxtryp'
const FILE_PATH = 'guestbook.json'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

const BAD_WORDS = [
  'бляд', 'бля', 'сука', 'сучк', 'еба', 'ебл', 'пизд', 'хуйн', 'хуй', 'нахуй',
  'мудак', 'мудил', 'дебил', 'идиот', 'тупой', 'тупая', 'тупое', 'тварь', 'урод',
  'козел', 'коза', 'мраз', 'шлюх', 'пидор', 'пидар', 'гандон', 'говно', 'дерьм',
  'fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid', 'moron', 'slut', 'whore'
]

function normalize(value = '') {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[0-9]/g, '')
    .replace(/[._*\-+=[\]{}()<>!?/\\|:;,`~'"^]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsBadLanguage(value) {
  const text = normalize(value)
  return BAD_WORDS.some(word => text.includes(word))
}

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
  if (!response.ok) {
    const error = new Error(data.message || 'GitHub request failed')
    error.status = response.status
    throw error
  }
  return data
}

async function readGuestbook() {
  const file = await github(`/contents/${FILE_PATH}?ref=main`)
  const decoded = Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8')
  const data = JSON.parse(decoded)
  return { messages: Array.isArray(data.messages) ? data.messages : [], sha: file.sha }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  try {
    if (req.method === 'GET') {
      const { messages } = await readGuestbook()
      return json(res, 200, { messages })
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
      const name = String(body.name || '').trim()
      const message = String(body.message || '').trim()
      const honeypot = String(body.website || '').trim()

      if (honeypot) return json(res, 400, { error: 'Invalid submission.' })
      if (name.length > 40) return json(res, 400, { error: 'Name is too long.' })
      if (message.length < 2) return json(res, 400, { error: 'Message is too short.' })
      if (message.length > 300) return json(res, 400, { error: 'Message is too long. Maximum 300 characters.' })
      if (containsBadLanguage(name) || containsBadLanguage(message)) {
        return json(res, 400, { error: 'Please keep the guestbook respectful.' })
      }

      const adminKey = process.env.GUESTBOOK_ADMIN_KEY
      const suppliedKey = String(body.adminKey || '')
      const asNyxtryp = body.asNyxtryp === true

      if (
        asNyxtryp &&
        (!adminKey || suppliedKey !== adminKey)
      ) {
        return json(res, 403, { error: 'Forbidden.' })
      }

      const guestbook = await readGuestbook()
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: asNyxtryp ? 'NYXTRYP' : (name || 'Anonymous'),
        message,
        date: new Date().toISOString(),
        official: asNyxtryp
      }

      const messages = [entry, ...guestbook.messages].slice(0, 500)
      const content = Buffer.from(JSON.stringify({ messages }, null, 2) + '\n').toString('base64')

      await github(`/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `guestbook: add message ${entry.id}`,
          content,
          sha: guestbook.sha,
          branch: 'main'
        })
      })

      return json(res, 201, { message: entry })
    }

    if (req.method === 'DELETE') {
      const adminKey = process.env.GUESTBOOK_ADMIN_KEY
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
      const suppliedKey = String(body.adminKey || '')

      if (!adminKey || suppliedKey !== adminKey) {
        return json(res, 403, { error: 'Forbidden.' })
      }

      const id = String(body.id || '').trim()
      if (!id) return json(res, 400, { error: 'Message id is required.' })

      const guestbook = await readGuestbook()
      const messages = guestbook.messages.filter(item => item.id !== id)
      if (messages.length === guestbook.messages.length) {
        return json(res, 404, { error: 'Message not found.' })
      }

      const content = Buffer.from(JSON.stringify({ messages }, null, 2) + '\n').toString('base64')
      await github(`/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `guestbook: delete message ${id}`,
          content,
          sha: guestbook.sha,
          branch: 'main'
        })
      })

      return json(res, 200, { ok: true })
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS')
    return json(res, 405, { error: 'Method not allowed.' })
  } catch (error) {
    console.error('Guestbook API error:', error)
    return json(res, error.status === 409 ? 409 : 500, { error: 'Guestbook service is temporarily unavailable.' })
  }
}
