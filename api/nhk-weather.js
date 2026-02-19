// Vercel Serverless Function: NHK新潟の天気情報をスクレイピング
// フロントエンドからは /api/nhk-weather で呼び出す

import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const url = 'https://news.web.nhk/kishou-saigai/weather/pref/niigata/';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`NHK weather fetch error: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const weatherData = {
      location: '新潟県',
      current: {},
      forecast: [],
      warnings: []
    };

    // 現在の天気情報を取得
    const currentTempEl = $('.current-temperature, .temp-now, .temperature-current').first();
    const currentWeatherEl = $('.current-weather, .weather-now, .weather-current').first();
    const currentDescEl = $('.weather-description, .weather-summary').first();

    weatherData.current = {
      temperature: currentTempEl.text().trim() || null,
      condition: currentWeatherEl.text().trim() || null,
      description: currentDescEl.text().trim() || null
    };

    // 天気予報を取得
    $('.forecast-item, .weather-forecast-item, .forecast-day').each((index, element) => {
      const $el = $(element);
      
      const dateEl = $el.find('.date, .forecast-date, time').first();
      const date = dateEl.text().trim() || dateEl.attr('datetime') || '';

      const highTempEl = $el.find('.high, .max-temp, .temperature-high').first();
      const lowTempEl = $el.find('.low, .min-temp, .temperature-low').first();
      
      const weatherEl = $el.find('.weather, .weather-condition, .condition').first();
      const weather = weatherEl.text().trim() || '';

      if (date) {
        weatherData.forecast.push({
          date: date,
          high: highTempEl.text().trim() || null,
          low: lowTempEl.text().trim() || null,
          condition: weather
        });
      }
    });

    // 警報・注意報を取得
    $('.warning, .alert, .weather-warning').each((index, element) => {
      const $el = $(element);
      const warning = $el.text().trim();
      if (warning) {
        weatherData.warnings.push(warning);
      }
    });

    // CORSを許可してJSONを返す
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(weatherData);
  } catch (error) {
    console.error('Unexpected error in /api/nhk-weather:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}


