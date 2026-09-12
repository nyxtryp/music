import { Buffer } from 'node:buffer'

const OWNER = 'nyxtryp'
const REPO = 'nyxtryp'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`

function safeName(name) {
  const value = String(name || '').trim()
  if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\') || value.includes('..')) return null
  return value
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  const name = safeName(req.query?.name)
  if (!name) return res.status(400).send('Invalid photo name')

  try {
    const token = process.env.GITHUB_TOKEN
    if (!token) throw new Error('GITHUB_TOKEN is not configured')

    const path = `public/photos/${name}`
    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/')
    const response = await fetch(`${API}/contents/${encodedPath}?ref=main`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })

    if (!response.ok) return res.status(response.status === 404 ? 404 : 502).send('Photo not found')

    const data = await response.json()
    if (data.type !== 'file' || !data.content) return res.status(404).send('Photo not found')

    const mime = data.name?.toLowerCase().endsWith('.png') ? 'image/png'
      : data.name?.toLowerCase().endsWith('.webp') ? 'image/webp'
      : data.name?.toLowerCase().endsWith('.gif') ? 'image/gif'
      : 'image/jpeg'

    res.setHeader('Content-Type', mime)
    return res.status(200).send(Buffer.from(data.content.replace(/\n/g, ''), 'base64'))
  } catch (error) {
    console.error('PHOTO API ERROR:', error)
    return res.status(500).send('Photo service failed')
  }
}
