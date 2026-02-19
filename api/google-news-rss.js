// Vercel Serverless Function: Google News RSSをサーバー側で取得して返すプロキシ
// フロントエンドからは /api/google-news-rss?url=<GOOGLE_NEWS_RSS_URL> で呼び出す

export default async function handler(req, res) {
  // OPTIONSメソッドのハンドリング（CORSプリフライト）
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // Google News RSS URL（日本のニュース）
    let googleNewsUrl = req.query.url || 'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja'
    
    // セキュリティのため、Google NewsのRSS URLだけを許可
    if (typeof googleNewsUrl !== 'string' || !googleNewsUrl.startsWith('https://news.google.com/rss')) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Only Google News RSS URLs are allowed' })
      return
    }
    
    // Google News RSSを取得
    const response = await fetch(googleNewsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Google News RSS取得エラー: ${response.status}`)
    }

    const xmlText = await response.text()

    // XMLをそのまま返す
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    res.status(200).send(xmlText)
  } catch (error) {
    console.error('Google News RSS取得エラー:', error)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Google News RSSの取得に失敗しました' })
  }
}

