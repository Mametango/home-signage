import { useState, useEffect } from 'react'
import './News.css'

interface NewsItem {
  id: number
  title: string
  link: string
  pubDate: string
  description?: string
  category: string
  isUrgent?: boolean // 緊急ニュースフラグ
}

// 緊急ニュースを判定する関数（災害関連のアラートのみ）
const isUrgentNews = (title: string, description?: string): boolean => {
  const text = `${title} ${description || ''}`
  
  // 緊急地震速報の場合は震度4以上のみ
  if (text.includes('緊急地震速報')) {
    // 震度情報を抽出（震度4、震度5、震度6、震度7など）
    const intensityMatch = text.match(/震度([4-7]|４|５|６|７)/)
    if (intensityMatch) {
      const intensity = intensityMatch[1]
      // 数字または全角数字を判定
      const intensityNum = intensity === '４' || intensity === '4' ? 4 :
                          intensity === '５' || intensity === '5' ? 5 :
                          intensity === '６' || intensity === '6' ? 6 :
                          intensity === '７' || intensity === '7' ? 7 : 0
      return intensityNum >= 4
    }
    // 震度情報がない場合は、震度4以上を示す表現を探す
    if (text.includes('震度4') || text.includes('震度５') || text.includes('震度6') || 
        text.includes('震度7') || text.includes('震度４') || text.includes('震度５') || 
        text.includes('震度６') || text.includes('震度７') ||
        text.includes('震度5弱') || text.includes('震度5強') || 
        text.includes('震度6弱') || text.includes('震度6強') ||
        text.includes('震度７') || text.includes('最大震度4') || 
        text.includes('最大震度5') || text.includes('最大震度6') || 
        text.includes('最大震度7')) {
      return true
    }
    // 震度情報が不明な場合は緊急として扱わない
    return false
  }
  
  // その他のアラートキーワード
  const alertKeywords = [
    '津波警報', '津波注意報', '気象警報', '土砂災害警戒情報',
    '洪水警報', '暴風警報', '大雪警報', '暴風雪警報', '台風警報',
    '避難指示', '避難勧告', '避難準備', '警戒レベル', '特別警報',
    '土石流警戒', '地滑り警戒', '崖崩れ警戒', '落石警戒', '雪崩警戒',
    '火山噴火警報', '火災警報', '浸水警戒', '冠水警戒'
  ]
  
  return alertKeywords.some(keyword => 
    text.includes(keyword)
  )
}

// NHKニュースのカテゴリーとRSS URL
const NHK_CATEGORIES = [
  { name: '主要', url: 'https://news.web.nhk/n-data/conf/na/rss/cat0.xml' },
  { name: '社会', url: 'https://news.web.nhk/n-data/conf/na/rss/cat1.xml' },
  { name: '文化・エンタメ', url: 'https://news.web.nhk/n-data/conf/na/rss/cat2.xml' },
  { name: '科学・医療', url: 'https://news.web.nhk/n-data/conf/na/rss/cat3.xml' },
  { name: '政治', url: 'https://news.web.nhk/n-data/conf/na/rss/cat4.xml' },
  { name: '経済', url: 'https://news.web.nhk/n-data/conf/na/rss/cat5.xml' },
  { name: '国際', url: 'https://news.web.nhk/n-data/conf/na/rss/cat6.xml' },
  { name: 'スポーツ', url: 'https://news.web.nhk/n-data/conf/na/rss/cat7.xml' }
]

const News = () => {
  const [urgentNews, setUrgentNews] = useState<NewsItem[]>([])
  const [normalNews, setNormalNews] = useState<NewsItem[]>([])
  const [currentUrgentIndex, setCurrentUrgentIndex] = useState(0)
  const [currentNormalIndex, setCurrentNormalIndex] = useState(0)
  const [isShowingUrgent, setIsShowingUrgent] = useState(false)
  const [urgentDisplayStartTime, setUrgentDisplayStartTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // NHKニュースを取得（複数カテゴリーから）
  const fetchNHKNews = async (): Promise<NewsItem[]> => {
    const allNews: NewsItem[] = []
    
    // 各カテゴリーから並列で取得
    const fetchPromises = NHK_CATEGORIES.map(async (category) => {
      try {
        // 自前のサーバーレス関数を経由してNHK RSSを取得（CORS回避）
        const apiUrl = `/api/nhk-rss?url=${encodeURIComponent(category.url)}`

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml, text/xml, */*'
          }
        })

        if (!response.ok) {
          console.error(`NHKニュース取得エラー (${category.name}): status=${response.status}`)
          return []
        }

        const xmlText = await response.text()

        if (!xmlText || xmlText.trim().length === 0) {
          console.error(`NHKニュース取得エラー (${category.name}): 空のレスポンス`)
          return []
        }

        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

        const parseError = xmlDoc.querySelector('parsererror')
        if (parseError) {
          console.error(`NHKニュースXMLパースエラー (${category.name})`)
          return []
        }

        const items = xmlDoc.querySelectorAll('item')

        const newsItems: NewsItem[] = []
        items.forEach((item, index) => {
          const title = item.querySelector('title')?.textContent || ''
          const link = item.querySelector('link')?.textContent || ''
          const pubDate = item.querySelector('pubDate')?.textContent || ''
          const description = item.querySelector('description')?.textContent || ''
          
          if (title && link) {
            const trimmedTitle = title.trim()
            const trimmedDescription = description.trim()
            newsItems.push({
              id: allNews.length + index + 1,
              title: trimmedTitle,
              link: link.trim(),
              pubDate: pubDate.trim(),
              description: trimmedDescription,
              category: category.name,
              isUrgent: isUrgentNews(trimmedTitle, trimmedDescription)
            })
          }
        })
        
        return newsItems.slice(0, 10) // 各カテゴリーから10件まで
      } catch (err) {
        console.error(`NHKニュース取得エラー (${category.name}):`, err)
        return []
      }
    })

    // すべてのカテゴリーから取得したニュースを統合
    const results = await Promise.all(fetchPromises)
    results.forEach((newsItems) => {
      allNews.push(...newsItems)
    })

    // 日時でソート（新しい順）
    allNews.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      return dateB - dateA
    })

    return allNews
  }

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)

        const newsItems = await fetchNHKNews()

        if (newsItems.length === 0) {
          setError('NHKニュースが取得できませんでした')
        } else {
          // 緊急ニュースと通常ニュースを分離
          const urgent = newsItems.filter(item => item.isUrgent)
          const normal = newsItems.filter(item => !item.isUrgent)
          
          setUrgentNews(urgent)
          setNormalNews(normal)
          
          // 緊急ニュースがある場合は、緊急ニュースを優先表示
          if (urgent.length > 0) {
            setIsShowingUrgent(true)
            setCurrentUrgentIndex(0)
            setUrgentDisplayStartTime(Date.now())
          } else {
            setIsShowingUrgent(false)
            setUrgentDisplayStartTime(null)
          }
          
          setError(null)
        }
        setLoading(false)
      } catch (err) {
        console.error('ニュースの取得に失敗しました:', err)
        setError('ニュースの取得に失敗しました')
        setLoading(false)
      }
    }

    fetchNews()
    const interval = setInterval(fetchNews, 300000) // 5分ごとに自動更新

    return () => clearInterval(interval)
  }, [])

  // 緊急ニュースの表示管理（5分間表示）
  useEffect(() => {
    if (!isShowingUrgent || urgentNews.length === 0 || urgentDisplayStartTime === null) return

    const checkUrgentDisplay = () => {
      const elapsed = Date.now() - urgentDisplayStartTime
      const urgentDisplayDuration = 300000 // 5分（300秒）

      if (elapsed >= urgentDisplayDuration) {
        // 5分経過したら次の緊急ニュースへ、または通常ニュースへ
        if (currentUrgentIndex < urgentNews.length - 1) {
          // 次の緊急ニュースへ
          setCurrentUrgentIndex(prev => prev + 1)
          setUrgentDisplayStartTime(Date.now())
        } else {
          // 緊急ニュースが全て表示されたら通常ニュースへ
          setIsShowingUrgent(false)
          setUrgentDisplayStartTime(null)
          setCurrentUrgentIndex(0)
        }
      }
    }

    const interval = setInterval(checkUrgentDisplay, 1000) // 1秒ごとにチェック

    return () => clearInterval(interval)
  }, [isShowingUrgent, urgentNews, currentUrgentIndex, urgentDisplayStartTime])

  // 通常ニュースの自動切り替え（1分ごと）
  useEffect(() => {
    if (isShowingUrgent || normalNews.length === 0) return

    const timer = setInterval(() => {
      setCurrentNormalIndex((prev) => (prev + 1) % normalNews.length)
    }, 60000) // 1分（60秒）ごとに切り替え

    return () => clearInterval(timer)
  }, [isShowingUrgent, normalNews])

  // 新しい緊急ニュースが追加された場合の処理
  useEffect(() => {
    if (urgentNews.length > 0 && !isShowingUrgent) {
      // 緊急ニュースが新しく追加された場合は、すぐに表示
      setIsShowingUrgent(true)
      setCurrentUrgentIndex(0)
      setUrgentDisplayStartTime(Date.now())
    }
  }, [urgentNews.length, isShowingUrgent])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // 取得日時を表示（yyyy年MM月dd日 HH:mm形式）
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="news">
        <div className="news-loading">NHKニュースを読み込み中...</div>
      </div>
    )
  }

  // 表示するニュースを決定
  const getCurrentNews = () => {
    if (isShowingUrgent && urgentNews.length > 0) {
      return urgentNews[currentUrgentIndex]
    } else if (normalNews.length > 0) {
      return normalNews[currentNormalIndex]
    }
    return null
  }

  const getNewsCounter = () => {
    if (isShowingUrgent && urgentNews.length > 0) {
      return `${currentUrgentIndex + 1} / ${urgentNews.length} (緊急)`
    } else if (normalNews.length > 0) {
      return `${currentNormalIndex + 1} / ${normalNews.length}`
    }
    return ''
  }

  const currentNews = getCurrentNews()

  return (
    <div className="news">
      {error && (
        <div className="news-error-banner">
          {error}
        </div>
      )}
      {currentNews ? (
        <a
          href={currentNews.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`news-item ${currentNews.isUrgent ? 'news-item-urgent' : ''}`}
        >
          <div className="news-item-header">
            <div className="news-item-meta">
              {currentNews.isUrgent && (
                <span className="news-urgent-badge">🚨 緊急</span>
              )}
              <span className="news-category-badge">{currentNews.category}</span>
              <span className="news-time">{formatDate(currentNews.pubDate)}</span>
            </div>
            <div className="news-header-right">
              <span className="news-source-label">NHKニュース</span>
              <span className="news-counter">
                {getNewsCounter()}
              </span>
            </div>
          </div>
          <h3 className="news-item-title">{currentNews.title}</h3>
          {currentNews.description && (
            <div className="news-item-description">{currentNews.description}</div>
          )}
        </a>
      ) : (
        <div className="news-empty">ニュースが取得できませんでした</div>
      )}
    </div>
  )
}

export default News
