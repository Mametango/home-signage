// Vercel Serverless Function: 画像プロキシ（CORS回避）
// フロントエンドからは /api/image-proxy?url=... で呼び出す

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rawUrl = req.query?.url
  const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url' })
    return
  }

  try {
    let response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://news.web.nhk/'
      }
    })

    if (!response.ok) {
      res.status(response.status).json({ error: `Upstream error: ${response.status}` })
      return
    }

    let contentType = response.headers.get('content-type') || 'image/jpeg'
    if (contentType.includes('image/avif')) {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/jpeg,image/png,image/*,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
          'Referer': 'https://news.web.nhk/'
        }
      })
      if (!response.ok) {
        res.status(response.status).json({ error: `Upstream error: ${response.status}` })
        return
      }
      contentType = response.headers.get('content-type') || 'image/jpeg'
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Content-Type', contentType)
    res.status(200).send(buffer)
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed', message: error?.message || String(error) })
  }
}
