// Vercel Serverless Function: Gemini に天気解説を問い合わせる簡単なプロキシ
// フロントエンドからは /api/gemini-weather に対して POST で { prompt } を送る

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set on the server');
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
      return;
    }

    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    let prompt = '';
    try {
      const json = JSON.parse(body || '{}');
      prompt = typeof json.prompt === 'string' ? json.prompt : '';
    } catch (e) {
      console.error('Failed to parse request body for /api/gemini-weather', e);
    }

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    console.log('[Gemini API][server] incoming request to /api/gemini-weather', {
      promptLength: prompt.length,
      promptSample: prompt.slice(0, 120)
    });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const text = await geminiResponse.text().catch(() => '');
      console.error('Gemini API error:', geminiResponse.status, geminiResponse.statusText, text);
      res.status(502).json({
        error: 'Gemini API error',
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        body: text ? text.slice(0, 500) : ''
      });
      return;
    }

    const data = await geminiResponse.json();
    console.log('[Gemini API][server] success response from Gemini', {
      hasCandidates: !!(data && data.candidates && data.candidates.length),
      rawSample: JSON.stringify(data).slice(0, 500)
    });
    let description =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      typeof data.candidates[0].content.parts[0].text === 'string'
        ? data.candidates[0].content.parts[0].text.trim()
        : '';

    // サーバー側でラベルを付与（フロントですぐに分かるように）
    if (description) {
      description = `【Gemini】${description}`;
    }

    res.status(200).json({ description });
  } catch (error) {
    console.error('Unexpected error in /api/gemini-weather:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}








