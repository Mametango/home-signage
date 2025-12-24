export default async function handler(req, res) {
  try {
    // Google News RSS URL（日本のニュース）
    const googleNewsUrl = req.query.url || 'https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja'
    
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
    res.status(500).json({ error: 'Google News RSSの取得に失敗しました' })
  }
}

