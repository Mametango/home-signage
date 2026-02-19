// Vercel Serverless Function: NHKのWebページをスクレイピングしてニュース情報を取得
// フロントエンドからは /api/nhk-web-scrape?type=<news_area|news_top|weather> で呼び出す

import * as cheerio from 'cheerio'

export default async function handler(req, res) {
  // OPTIONSリクエストの処理（CORSプリフライト）
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
    const { type } = req.query || {}

    if (!type) {
      res.status(400).json({ error: 'type query parameter is required (news_area, news_top, weather)' })
      return
    }

    let url
    let scraper

    // タイプに応じてURLとスクレイパーを設定
    switch (type) {
      case 'news_area':
        // 新潟県の最新ニュース
        url = 'https://news.web.nhk/newsweb/area/150'
        scraper = scrapeAreaNews
        break
      case 'news_top':
        // トップニュース
        url = 'https://news.web.nhk/newsweb'
        scraper = scrapeTopNews
        break
      case 'weather':
        // 新潟の天気
        url = 'https://news.web.nhk/kishou-saigai/weather/pref/niigata/'
        scraper = scrapeWeather
        break
      default:
        res.status(400).json({ error: 'Invalid type. Use: news_area, news_top, or weather' })
        return
    }

    // HTMLを取得
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    })

    if (!response.ok) {
      console.error(`NHK Web取得エラー: status=${response.status}`)
      res.status(502).json({ error: 'Failed to fetch NHK page', status: response.status })
      return
    }

    const htmlText = await response.text()

    if (!htmlText || htmlText.trim().length === 0) {
      res.status(502).json({ error: 'Empty response from NHK' })
      return
    }

    // Cheerioでパース
    const $ = cheerio.load(htmlText)

    // タイプに応じたスクレイピングを実行
    const data = await scraper($, url)

    // CORSを許可してJSONを返す
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).json(data)
  } catch (error) {
    console.error('Unexpected error in /api/nhk-web-scrape:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}

// 新潟県の最新ニュースをスクレイピング
function scrapeAreaNews($, url) {
  const newsItems = []

  // 「新潟県の最新ニュース」セクションを探す
  // HTML構造に応じて調整が必要な可能性がある
  $('.news-item, .news-list-item, article, [class*="news"]').each((index, element) => {
    const $item = $(element)
    
    // タイトルとリンクを取得
    const titleElement = $item.find('a, h2, h3, [class*="title"]').first()
    const title = titleElement.text().trim()
    let link = titleElement.attr('href') || $item.find('a').first().attr('href') || ''
    
    // 相対URLを絶対URLに変換
    if (link && !link.startsWith('http')) {
      link = new URL(link, 'https://news.web.nhk').href
    }

    // 日時を取得
    const dateText = $item.find('[class*="date"], [class*="time"], time').first().text().trim()

    // 説明文を取得（あれば）
    const description = $item.find('[class*="description"], [class*="summary"], p').first().text().trim()

    if (title && title.length > 0) {
      newsItems.push({
        id: index + 1,
        title: title,
        link: link,
        pubDate: dateText || '',
        description: description || undefined,
        category: '新潟県のニュース'
      })
    }
  })

  // より具体的なセレクタを試す（NHKの実際のHTML構造に応じて調整）
  if (newsItems.length === 0) {
    // リストアイテムを探す
    $('li, [role="listitem"]').each((index, element) => {
      const $item = $(element)
      const titleElement = $item.find('a').first()
      const title = titleElement.text().trim()
      const link = titleElement.attr('href') || ''

      if (title && title.length > 5) { // 最低限の文字数チェック
        const fullLink = link && !link.startsWith('http') 
          ? new URL(link, 'https://news.web.nhk').href 
          : link

        newsItems.push({
          id: index + 1,
          title: title,
          link: fullLink,
          pubDate: $item.find('time, [class*="date"]').first().text().trim() || '',
          description: undefined,
          category: '新潟県のニュース'
        })
      }
    })
  }

  return {
    type: 'news_area',
    url: url,
    count: newsItems.length,
    items: newsItems.slice(0, 20) // 最大20件
  }
}

// トップニュースをスクレイピング
function scrapeTopNews($, url) {
  const newsItems = []

  // トップニュースのセクションを探す
  $('.top-news-item, .featured-news, [class*="top"], [class*="featured"]').each((index, element) => {
    const $item = $(element)
    
    const titleElement = $item.find('a, h1, h2, h3').first()
    const title = titleElement.text().trim()
    let link = titleElement.attr('href') || $item.find('a').first().attr('href') || ''
    
    if (link && !link.startsWith('http')) {
      link = new URL(link, 'https://news.web.nhk').href
    }

    const dateText = $item.find('[class*="date"], [class*="time"], time').first().text().trim()
    const description = $item.find('[class*="description"], [class*="summary"], p').first().text().trim()

    if (title && title.length > 0) {
      newsItems.push({
        id: index + 1,
        title: title,
        link: link,
        pubDate: dateText || '',
        description: description || undefined,
        category: 'トップニュース'
      })
    }
  })

  // フォールバック: 一般的なニュースアイテムを探す
  if (newsItems.length === 0) {
    $('article, [class*="news-item"]').each((index, element) => {
      const $item = $(element)
      const titleElement = $item.find('a, h2, h3').first()
      const title = titleElement.text().trim()
      const link = titleElement.attr('href') || ''

      if (title && title.length > 5) {
        const fullLink = link && !link.startsWith('http') 
          ? new URL(link, 'https://news.web.nhk').href 
          : link

        newsItems.push({
          id: index + 1,
          title: title,
          link: fullLink,
          pubDate: $item.find('time, [class*="date"]').first().text().trim() || '',
          description: $item.find('p, [class*="description"]').first().text().trim() || undefined,
          category: 'トップニュース'
        })
      }
    })
  }

  return {
    type: 'news_top',
    url: url,
    count: newsItems.length,
    items: newsItems.slice(0, 20) // 最大20件
  }
}

// 新潟の天気情報をスクレイピング
function scrapeWeather($, url) {
  const weatherData = {
    location: '新潟',
    current: null,
    forecast: []
  }

  // 天気情報の要素を探す
  // HTML構造に応じて調整が必要
  $('[class*="weather"], [class*="forecast"]').each((index, element) => {
    const $item = $(element)
    const text = $item.text().trim()

    // 天気、気温などの情報を抽出
    // 実際のHTML構造を確認して調整が必要
  })

  // より具体的な天気情報の取得
  const weatherText = $('body').text()
  
  // 今日の天気を探す
  const todayMatch = weatherText.match(/今日[^]*?([晴曇雨雪])[^]*?(\d+)[度°]/)
  if (todayMatch) {
    weatherData.current = {
      condition: todayMatch[1],
      temperature: todayMatch[2]
    }
  }

  return {
    type: 'weather',
    url: url,
    data: weatherData,
    raw: $('body').text().substring(0, 500) // デバッグ用（最初の500文字）
  }
}

