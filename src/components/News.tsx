import { useState, useEffect, useRef } from 'react'
import './News.css'

interface NewsItem {
  id: number
  title: string
  link: string
  pubDate: string
  description?: string
  category: string
  isUrgent?: boolean // 緊急ニュースフラグ
  image?: string // 画像URL
  video?: string // 動画URL
}

// NHKニュースからの緊急判定は削除（P2P地震情報のAPIからの緊急地震速報のみを使用）
// const isUrgentNews = (title: string, description?: string): boolean => {
//   // NHKニュースは全て通常ニュースとして扱う
//   return false
// }

/** pubDate をタイムスタンプに変換。無効・空の場合は 0（ソートで末尾に回す） */
function parsePubDateToTime(pubDate: string | undefined): number {
  if (pubDate == null || String(pubDate).trim() === '') return 0
  const t = new Date(pubDate).getTime()
  return Number.isNaN(t) ? 0 : t
}

/** 昨日 0:00 JST のタイムスタンプ（これより前のニュースは除外） */
function getYesterdayStartJST(): number {
  const d = new Date()
  const jstDayMs = d.getTime() + 9 * 60 * 60 * 1000
  const jstDayStart = Math.floor(jstDayMs / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000) - 9 * 60 * 60 * 1000
  return jstDayStart - 24 * 60 * 60 * 1000
}

const News = () => {
  const [normalNews, setNormalNews] = useState<NewsItem[]>([])
  const [currentNormalIndex, setCurrentNormalIndex] = useState(0)
  // const [urgentDisplayStartTime, setUrgentDisplayStartTime] = useState<number | null>(null) // 未使用
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set())
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [transitionState, setTransitionState] = useState<'entering' | 'visible' | 'exiting'>('visible')


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


  // ニュースを取得（GASプロキシまたは内部API）
  const fetchNewsFromApi = async (type: 'latest' | 'area'): Promise<NewsItem[]> => {
    try {
      // 環境変数から GAS の URL を取得（未設定時はデフォルトの GAS を参照）
      const gasUrl = import.meta.env.VITE_NEWS_API_URL || 'https://script.google.com/macros/s/AKfycbwrDvEcIRw50vSe0KgtDBIFG38ZywNZEAmYOrPHceld-OVqE8MZBVXsQwLhOLDMDw91/exec'
      const endpoint = gasUrl 
        ? `${gasUrl}?type=${type}` 
        : (type === 'latest' ? '/api/nhk-latest-news' : '/api/nhk-area-news')

      const response = await fetch(endpoint, { cache: 'no-cache' })
      if (!response.ok) return []

      const data = await response.json()
      return data.news || []
    } catch (err) {
      console.error(`ニュース取得エラー (${type}):`, err)
      return []
    }
  }


  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)

        // 全国・新潟のニュースを取得
        const [latestNews, areaNews] = await Promise.all([
          fetchNewsFromApi('latest'),
          fetchNewsFromApi('area'),
        ])

        console.log('📰 [ニュース取得]', {
          '全国ニュース': latestNews.length,
          '新潟ニュース': areaNews.length,
        })

        // 重複除外
        const seenTitles = new Set<string>()
        let newsItems: NewsItem[] = []

        // 全国ニュースを先に追加
        latestNews.forEach(item => {
          if (!seenTitles.has(item.title)) {
            seenTitles.add(item.title)
            newsItems.push(item)
          }
        })

        // 新潟ニュースを追加
        areaNews.forEach(item => {
          if (!seenTitles.has(item.title)) {
            seenTitles.add(item.title)
            newsItems.push(item)
          }
        })

        // 一昨日以前を除外
        const yesterdayStartJST = getYesterdayStartJST()
        newsItems = newsItems.filter((item) => {
          const t = parsePubDateToTime(item.pubDate)
          return t === 0 || t >= yesterdayStartJST
        })

        // 新しい順にソート
        newsItems.sort((a, b) => {
          const dateA = parsePubDateToTime(a.pubDate)
          const dateB = parsePubDateToTime(b.pubDate)
          return dateB - dateA
        })

        setNormalNews(newsItems)

        if (newsItems.length > 0 && currentNormalIndex >= newsItems.length) {
          setCurrentNormalIndex(0)
        }

        setError(null)
      } catch (err) {
        console.error('ニュースの取得に失敗しました:', err)
        setError('ニュースの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    const interval = setInterval(fetchNews, 1800000) // 30分ごとに自動更新（Vercel無料枠節約）

    return () => clearInterval(interval)
  }, [])

  // 緊急ニュースの表示管理を完全に停止
  // useEffect(() => { ... }, []) // コメントアウト

  // Card-by-card slide animation
  useEffect(() => {
    if (normalNews.length <= 1) return

    const DISPLAY_TIME = 30000  // 30 seconds per card
    const EXIT_ANIM = 600      // exit animation duration

    const timer = setInterval(() => {
      setTransitionState('exiting')
      setTimeout(() => {
        setCurrentNormalIndex((prev) => (prev + 1) % normalNews.length)
        setTransitionState('entering')
        setTimeout(() => setTransitionState('visible'), 50)
      }, EXIT_ANIM)
    }, DISPLAY_TIME)

    return () => clearInterval(timer)
  }, [normalNews])

  // 新しい緊急ニュースが追加された場合の処理（削除：既にfetchNews内で処理しているため不要）

  const formatDate = (dateString: string) => {
    if (!dateString || !dateString.trim()) return '—'
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return '—'
      // 取得日時を表示（yyyy年MM月dd日 HH:mm形式）
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}年${month}月${day}日 ${hours}:${minutes}`
    } catch {
      return '—'
    }
  }

  if (loading) {
    return (
      <div
        className="news"
        onTouchStart={(event) => {
          const touch = event.touches[0]
          touchStartRef.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchMove={(event) => {
          if (!touchStartRef.current) return
          const touch = event.touches[0]
          const deltaX = touch.clientX - touchStartRef.current.x
          const deltaY = touch.clientY - touchStartRef.current.y
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onTouchEnd={() => {
          touchStartRef.current = null
        }}
        onTouchCancel={() => {
          touchStartRef.current = null
        }}
      >
        <div className="news-loading">NHKニュースを読み込み中...</div>
      </div>
    )
  }

  // 画像の読み込みエラーハンドラ
  const handleImageError = (newsId: number, imageUrl?: string) => {
    console.warn('[画像読み込みエラー]', {
      newsId,
      imageUrl,
      timestamp: new Date().toISOString()
    })
    setImageLoadErrors(prev => {
      const newSet = new Set(prev)
      newSet.add(newsId)
      return newSet
    })
  }

  // 現在のニュースに画像/動画があるか、かつエラーでないかチェック
  // 画像URLが有効かどうかをチェック（httpまたはhttpsで始まり、長さが10文字以上）
  const normalizeMediaUrl = (url?: string): string | null => {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed) return null

    // Build full URL
    let fullUrl = trimmed
    if (trimmed.startsWith('//')) {
      fullUrl = `https:${trimmed}`
    } else if (trimmed.startsWith('/')) {
      fullUrl = `https://www3.nhk.or.jp${trimmed}`
    }

    // imgu.web.nhk is publicly accessible, no proxy needed
    return fullUrl
  }

  const isVideoUrl = (url?: string): boolean => {
    const normalized = normalizeMediaUrl(url)
    if (!normalized) return false
    return /\.(mp4|webm|m3u8)(\?|#|$)/i.test(normalized)
  }

  // Current news item to display
  const currentItem = normalNews.length > 0 ? normalNews[currentNormalIndex % normalNews.length] : null
  const totalItems = normalNews.length

  return (
    <div
      className="news bento-news"
      onTouchStart={(event) => {
        const touch = event.touches[0]
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      }}
      onTouchMove={(event) => {
        if (!touchStartRef.current) return
        const touch = event.touches[0]
        const deltaX = touch.clientX - touchStartRef.current.x
        const deltaY = touch.clientY - touchStartRef.current.y
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      onTouchEnd={() => {
        touchStartRef.current = null
      }}
      onTouchCancel={() => {
        touchStartRef.current = null
      }}
    >

      {error && (
        <div className="news-error-banner">
          {error}
        </div>
      )}

      {currentItem ? (
        <div className={`bento-news-card news-transition-${transitionState}`}>
          {(() => {
            const newsItem = currentItem
            let normalizedImageUrl = ''
            let normalizedVideoUrl = ''
            let itemHasValidMedia = false

            if (newsItem.video) {
              itemHasValidMedia = true
              normalizedVideoUrl = normalizeMediaUrl(newsItem.video) || ''
            } else if (newsItem.image && !imageLoadErrors.has(newsItem.id)) {
              itemHasValidMedia = true
              normalizedImageUrl = normalizeMediaUrl(newsItem.image) || ''
            }

            const isVideo = isVideoUrl(normalizedVideoUrl || undefined)

            return (
              <>
                {/* Meta row: source, time, counter — right-aligned */}
                <div className="news-card-meta-row">
                  <span className="news-category-badge">{newsItem.category}</span>
                  <span className="news-time">{formatDate(newsItem.pubDate)}</span>
                  <span className="news-card-counter">{(currentNormalIndex % totalItems) + 1} / {totalItems}</span>
                </div>

                {/* Title */}
                <h3 className="news-card-title">{newsItem.title}</h3>

                {/* Media (bottom) */}
                {itemHasValidMedia && (
                  <div className="news-card-media">
                    {isVideo && normalizedVideoUrl ? (
                      <video className="news-video" src={normalizedVideoUrl} playsInline preload="metadata" />
                    ) : normalizedImageUrl ? (
                      <img
                        className="news-image"
                        src={normalizedImageUrl}
                        alt={newsItem.title}
                        loading="lazy"
                        onError={() => handleImageError(newsItem.id, normalizedImageUrl)}
                      />
                    ) : null}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      ) : (
        <div className="news-empty">ニュースが取得できませんでした</div>
      )}
    </div>
  )
}

export default News
