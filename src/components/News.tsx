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

// NHKニュースからの緊急判定は削除（P2P地震情報のAPIからの緊急地震速報のみを使用）
// const isUrgentNews = (title: string, description?: string): boolean => {
//   // NHKニュースは全て通常ニュースとして扱う
//   return false
// }

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

// Google News RSS URLs（興味のあるトピック）
const GOOGLE_NEWS_URLS = [
  { name: '日本の社会情勢', url: 'https://news.google.com/rss/search?q=日本+社会&hl=ja&gl=JP&ceid=JP:ja' },
  { name: 'ハイテク', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=ja&gl=JP&ceid=JP:ja' }, // テクノロジー
  { name: 'コンピュータ', url: 'https://news.google.com/rss/search?q=コンピュータ+PC+CPU+GPU&hl=ja&gl=JP&ceid=JP:ja' },
  { name: 'POE', url: 'https://news.google.com/rss/search?q=Path+of+Exile+POE&hl=ja&gl=JP&ceid=JP:ja' },
  { name: 'ゲーム情報', url: 'https://news.google.com/rss/search?q=ゲーム+ゲームニュース&hl=ja&gl=JP&ceid=JP:ja' },
  { name: 'テック', url: 'https://news.google.com/rss/search?q=テック+IT+AI+人工知能&hl=ja&gl=JP&ceid=JP:ja' }
]

const News = () => {
  const [normalNews, setNormalNews] = useState<NewsItem[]>([])
  const [currentNormalIndex, setCurrentNormalIndex] = useState(0)
  // const [urgentDisplayStartTime, setUrgentDisplayStartTime] = useState<number | null>(null) // 未使用
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  // P2P地震情報から緊急地震速報を取得（未使用のためコメントアウト）
  /*
  const fetchP2PQuakeEEW = async (): Promise<NewsItem[]> => {
    const urgentItems: NewsItem[] = []
    
    try {
      // P2P地震情報のAPIから最新の地震情報を取得
      const response = await fetch('https://api.p2pquake.net/v2/history?limit=10', {
        cache: 'no-cache'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (Array.isArray(data)) {
          // 緊急地震速報（EEW）または震度4以上の地震を取得
          data.forEach((item: any, index: number) => {
            // 緊急地震速報（code: 551）または震度4以上の地震（code: 9611, maxScale >= 4）
            const isEEW = item.code === 551 // 緊急地震速報
            const isStrongQuake = item.code === 9611 && item.earthquake && item.earthquake.maxScale >= 4
            
            if (isEEW || isStrongQuake) {
              const time = item.time ? new Date(item.time) : new Date()
              const eq = item.earthquake || {}
              
              let title = ''
              let description = ''
              
              if (isEEW) {
                title = '緊急地震速報'
                description = `最大震度${eq.maxScale || '不明'}の地震が予想されます。強い揺れに注意してください。`
                if (eq.hypocenter?.name) {
                  description += ` 震源地: ${eq.hypocenter.name}`
                }
                if (eq.hypocenter?.magnitude) {
                  description += ` M${eq.hypocenter.magnitude}`
                }
              } else {
                title = `地震発生 - ${eq.hypocenter?.name || '不明'}`
                description = `最大震度${eq.maxScale || '不明'}の地震が発生しました。`
                if (eq.hypocenter?.name) {
                  description += ` 震源地: ${eq.hypocenter.name}`
                }
                if (eq.hypocenter?.magnitude) {
                  description += ` M${eq.hypocenter.magnitude}`
                }
                if (eq.hypocenter?.depth) {
                  description += ` 深さ: ${eq.hypocenter.depth}km`
                }
              }
              
              urgentItems.push({
                id: item.id || `p2p-${index}`,
                title: title,
                link: 'https://www.p2pquake.net/',
                pubDate: time.toISOString(),
                description: description,
                category: '緊急地震速報',
                isUrgent: true
              })
            }
          })
        }
      }
    } catch (error) {
      console.error('P2P地震情報の取得に失敗しました:', error)
    }
    
    return urgentItems
  }
  */

  // HTMLタグを除去する関数
  const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // URLを除去する関数
  const removeUrls = (text: string): string => {
    // URLパターンを除去（http://、https://で始まる文字列）
    return text.replace(/https?:\/\/[^\s]+/gi, '').trim()
  }

  // Google Newsを取得（複数のトピックから）
  const fetchGoogleNews = async (): Promise<NewsItem[]> => {
    const allNews: NewsItem[] = []
    let newsId = 1
    
    // 複数のRSSフィードを並列で取得
    const fetchPromises = GOOGLE_NEWS_URLS.map(async (topic) => {
      try {
        // サーバーレス関数を経由してGoogle News RSSを取得（CORS回避）
        const apiUrl = `/api/google-news-rss?url=${encodeURIComponent(topic.url)}`

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/xml, text/xml, */*'
          }
        })

        if (!response.ok) {
          console.error(`Google News取得エラー (${topic.name}): status=${response.status}`)
          return []
        }

        const xmlText = await response.text()

        if (!xmlText || xmlText.trim().length === 0) {
          console.error(`Google News取得エラー (${topic.name}): 空のレスポンス`)
          return []
        }

        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

        const parseError = xmlDoc.querySelector('parsererror')
        if (parseError) {
          console.error(`Google News XMLパースエラー (${topic.name})`)
          return []
        }

        const items = xmlDoc.querySelectorAll('item')
        const topicNews: NewsItem[] = []

        items.forEach((item) => {
          const title = item.querySelector('title')?.textContent || ''
          const link = item.querySelector('link')?.textContent || ''
          const pubDate = item.querySelector('pubDate')?.textContent || ''
          const descriptionElement = item.querySelector('description')
          let description: string | undefined
          
          if (descriptionElement) {
            // description要素のHTMLコンテンツを取得
            const descriptionHtml = descriptionElement.innerHTML || descriptionElement.textContent || ''
            // HTMLタグを除去
            let cleanedDescription = stripHtmlTags(descriptionHtml).trim()
            // URLを除去
            cleanedDescription = removeUrls(cleanedDescription)
            description = cleanedDescription
          }
          
          if (title && link) {
            const trimmedTitle = title.trim()
            
            topicNews.push({
              id: newsId++,
              title: trimmedTitle,
              link: link.trim(),
              pubDate: pubDate.trim(),
              description: description || undefined,
              category: `Google News - ${topic.name}`,
              isUrgent: false
            })
          }
        })
        
        return topicNews.slice(0, 10) // 各トピックから最大10件
      } catch (err) {
        console.error(`Google News取得エラー (${topic.name}):`, err)
        return []
      }
    })

    // すべてのトピックからニュースを取得
    const results = await Promise.all(fetchPromises)
    results.forEach((news) => {
      allNews.push(...news)
    })
    
    return allNews
  }

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
            
            // 除外する記事のタイトル（部分一致で除外）
            const excludedTitles = [
              '岩手 久慈 8日の地震直後 避難所への道路渋滞',
              '岩手 久慈8日の地震直後 避難所への道路渋滞',
              '久慈 8日の地震直後 避難所への道路渋滞',
              '久慈8日の地震直後 避難所への道路渋滞'
            ]
            
            // 除外する記事かどうかをチェック
            const shouldExclude = excludedTitles.some(excludedTitle => 
              trimmedTitle.includes(excludedTitle) || trimmedDescription.includes(excludedTitle)
            )
            
            // 除外する記事は追加しない
            if (shouldExclude) {
              console.log('記事を除外:', trimmedTitle)
              return
            }
            
            newsItems.push({
              id: allNews.length + index + 1,
              title: trimmedTitle,
              link: link.trim(),
              pubDate: pubDate.trim(),
              description: trimmedDescription,
              category: category.name,
              isUrgent: false // NHKニュースは全て通常ニュースとして扱う
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

        // 緊急ニュース機能を完全に停止
        // P2P地震情報のAPIからの取得も停止
        
        // NHKニュースとGoogle Newsを並列で取得
        const [nhkNews, googleNews] = await Promise.all([
          fetchNHKNews(),
          fetchGoogleNews()
        ])
        
        // 両方のニュースを統合
        const newsItems = [...nhkNews, ...googleNews]
        
        // 日時でソート（新しい順）
        newsItems.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime()
          const dateB = new Date(b.pubDate).getTime()
          return dateB - dateA
        })

        if (newsItems.length === 0) {
          setError('ニュースが取得できませんでした')
        } else {
          // 全て通常ニュースとして扱う（緊急ニュースは一切表示しない）
          // 通常ニュースを設定
          setNormalNews(newsItems)
          
          // 通常ニュースのインデックスをリセット（念のため）
          if (newsItems.length > 0 && currentNormalIndex >= newsItems.length) {
            setCurrentNormalIndex(0)
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

  // 緊急ニュースの表示管理を完全に停止
  // useEffect(() => { ... }, []) // コメントアウト

  // 通常ニュースの自動切り替え（1分ごと）
  useEffect(() => {
    // 緊急ニュースのチェックを削除（常に通常ニュースのみ）
    if (normalNews.length === 0) return

    const timer = setInterval(() => {
      setCurrentNormalIndex((prev) => (prev + 1) % normalNews.length)
    }, 60000) // 1分（60秒）ごとに切り替え

    return () => clearInterval(timer)
  }, [normalNews])

  // 新しい緊急ニュースが追加された場合の処理（削除：既にfetchNews内で処理しているため不要）

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

  // 表示するニュースを決定（緊急ニュースは完全に無効化）
  const getCurrentNews = () => {
    // 緊急ニュースは一切表示しない（強制的に通常ニュースのみ）
    if (normalNews.length > 0) {
      return normalNews[currentNormalIndex]
    }
    return null
  }

  const getNewsCounter = () => {
    // 緊急の表示を完全に削除
    if (normalNews.length > 0) {
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
        <div className="news-item-wrapper">
          <a
            href={currentNews.link}
            target="_blank"
            rel="noopener noreferrer"
            className="news-item"
            style={{
              // 緊急ニュースのスタイルを強制的に無効化
              background: currentNews.isUrgent ? 'rgba(255, 255, 255, 0.15) !important' : undefined,
              border: currentNews.isUrgent ? '1px solid rgba(255, 255, 255, 0.1) !important' : undefined
            }}
          >
            <div className="news-item-header">
              <div className="news-item-meta">
                {/* 緊急バッジの表示を完全に停止 */}
                <span className="news-category-badge">{currentNews.category}</span>
                <span className="news-time">{formatDate(currentNews.pubDate)}</span>
              </div>
              <div className="news-header-right">
                <span className="news-source-label">
                  {currentNews.category === '緊急地震速報' 
                    ? 'P2P地震情報' 
                    : currentNews.category === 'Google News' 
                    ? 'Google News' 
                    : 'NHKニュース'}
                </span>
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
          <button
            className="news-weather-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('週間天気予報ボタンがクリックされました')
              // 週間天気予報を表示するイベントを発火
              const event = new CustomEvent('showWeeklyWeather', {
                bubbles: true,
                cancelable: true
              })
              window.dispatchEvent(event)
              console.log('イベントを発火しました:', event)
            }}
            title="週間天気予報を表示"
            aria-label="週間天気予報を表示"
          >
            🌤️
          </button>
        </div>
      ) : (
        <div className="news-empty">ニュースが取得できませんでした</div>
      )}
    </div>
  )
}

export default News
