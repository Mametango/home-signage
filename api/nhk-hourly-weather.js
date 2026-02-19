// Vercel Serverless Function: NHK新発田市の1時間毎の天気をスクレイピング
// フロントエンドからは /api/nhk-hourly-weather で呼び出す

import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const url = 'https://news.web.nhk/kishou-saigai/weather/city/15206001520600/';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`NHK hourly weather fetch error: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const hourlyWeather = [];

    // 1時間毎の天気を取得
    // 様々なセレクタパターンで試す
    $('[class*="hourly"], [class*="time"], [data-time]').each((index, element) => {
      const $el = $(element);
      
      // 時刻を探す
      const timeText = $el.find('[class*="time"], [class*="hour"]').first().text().trim() || 
                       $el.text().trim().match(/\d{1,2}[時:]/)?.[0] || '';
      
      // 気温を探す
      const tempText = $el.find('[class*="temp"], [class*="temperature"]').first().text().trim() || '';
      const temp = parseInt(tempText.match(/\d+/)?.[0] || '');
      
      // 天気を探す
      const condition = $el.find('[class*="weather"], [class*="condition"]').first().text().trim() || '';
      
      // 画像/アイコンを探す
      const iconEl = $el.find('img').first();
      const icon = iconEl.attr('src') || iconEl.attr('data-src') || '';
      
      if (timeText && !isNaN(temp)) {
        hourlyWeather.push({
          time: timeText.replace(/[時:]/g, '時'),
          temp: temp,
          condition: condition || undefined,
          icon: icon || undefined
        });
      }
    });

    // テーブル形式の場合
    if (hourlyWeather.length === 0) {
      $('table tr, [class*="table"] tr').each((index, element) => {
        if (index === 0) return; // ヘッダー行をスキップ
        
        const $el = $(element);
        const cells = $el.find('td, [class*="cell"]');
        
        if (cells.length >= 2) {
          const timeText = $(cells[0]).text().trim();
          const tempText = $(cells[1]).text().trim();
          const temp = parseInt(tempText.match(/\d+/)?.[0] || '');
          const condition = $(cells[2]).text().trim() || '';
          
          if (timeText && !isNaN(temp)) {
            hourlyWeather.push({
              time: timeText,
              temp: temp,
              condition: condition || undefined,
              icon: undefined
            });
          }
        }
      });
    }

    // リスト形式の場合
    if (hourlyWeather.length === 0) {
      $('[class*="hourly"] li, [class*="forecast"] li').each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        
        const timeMatch = text.match(/(\d{1,2})[時:]/);
        const tempMatch = text.match(/(\d{1,2})度|(\d{1,2})°C/);
        
        if (timeMatch && tempMatch) {
          hourlyWeather.push({
            time: `${timeMatch[1]}時`,
            temp: parseInt(tempMatch[1] || tempMatch[2] || '0'),
            condition: undefined,
            icon: undefined
          });
        }
      });
    }

    // CORSを許可してJSONを返す
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ hourly: hourlyWeather });
  } catch (error) {
    console.error('Unexpected error in /api/nhk-hourly-weather:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}


