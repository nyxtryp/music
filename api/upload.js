import { handleUpload } from '@vercel/blob/client'

function safeName(name) {
  const value = String(name || '').trim()
  if (!value || value === '.' || value === '..') return null
  if (value.includes('/') || value.includes('\\') || value.includes('..')) return null
  return value
}

function checkAdmin(adminKey) {
  const expected = process.env.GUESTBOOK_ADMIN_KEY
  return Boolean(expected && String(adminKey || '') === expected)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})

    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload = {}
        try { payload = JSON.parse(clientPayload || '{}') } catch { throw new Error('Invalid upload payload.') }

        const type = String(payload.type || '')
        const name = safeName(payload.name)
        if (!['tracks', 'radio', 'mixes'].includes(type) || !name) throw new Error('Invalid audio upload target.')
        if (!checkAdmin(payload.adminKey)) throw new Error('Forbidden.')

        const expectedPath = `${type}/${name}`
        if (pathname !== expectedPath) throw new Error('Invalid upload pathname.')

        return {
          addRandomSuffix: false,
          allowOverwrite: true
        }
      },
      onUploadCompleted: async () => {}
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Blob upload API error:', error)
    return res.status(400).json({ error: error?.message || 'Upload failed.' })
  }
}
