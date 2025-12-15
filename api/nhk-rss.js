// Vercel Serverless Function: NHKニュースRSSをサーバー側で取得して返すプロキシ
// フロントエンドからは /api/nhk-rss?url=<NHK_RSS_URL> で呼び出す

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.query || {};

    if (typeof url !== 'string' || !url) {
      res.status(400).json({ error: 'url query parameter is required' });
      return;
    }

    // セキュリティのため、NHKのRSS URL だけを許可
    if (!url.startsWith('https://news.web.nhk/n-data/conf/na/rss/')) {
      res.status(400).json({ error: 'Only NHK RSS URLs are allowed' });
      return;
    }

    const nhkResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!nhkResponse.ok) {
      const text = await nhkResponse.text().catch(() => '');
      console.error('NHK RSS fetch error:', nhkResponse.status, nhkResponse.statusText, text);
      res.status(502).json({ error: 'NHK RSS fetch error', status: nhkResponse.status });
      return;
    }

    const xmlText = await nhkResponse.text();

    // CORSを許可してXMLテキストをそのまま返す
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xmlText);
  } catch (error) {
    console.error('Unexpected error in /api/nhk-rss:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


