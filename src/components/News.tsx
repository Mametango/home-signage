import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

const News = () => {
  const [urgentNews, setUrgentNews] = useState<NewsItem[]>([])
  const [normalNews, setNormalNews] = useState<NewsItem[]>([])
  const [currentUrgentIndex, setCurrentUrgentIndex] = useState(0)
  const [currentNormalIndex, setCurrentNormalIndex] = useState(0)
  const [isShowingUrgent, setIsShowingUrgent] = useState(false)
  // const [urgentDisplayStartTime, setUrgentDisplayStartTime] = useState<number | null>(null) // 未使用
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hiddenNewsIds, setHiddenNewsIds] = useState<Set<number>>(new Set())

  // localStorageから非表示記事のIDを読み込み
  useEffect(() => {
    const savedHiddenIds = localStorage.getItem('hiddenNewsIds')
    if (savedHiddenIds) {
      try {
        const ids = JSON.parse(savedHiddenIds)
        setHiddenNewsIds(new Set(ids))
      } catch (e) {
        console.error('非表示記事IDの読み込みに失敗しました:', e)
      }
    }
  }, [])

  // 記事を非表示にする関数
  const hideNews = (newsId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newHiddenIds = new Set(hiddenNewsIds)
    newHiddenIds.add(newsId)
    setHiddenNewsIds(newHiddenIds)
    
    // localStorageに保存
    localStorage.setItem('hiddenNewsIds', JSON.stringify(Array.from(newHiddenIds)))
    
    // 非表示にした記事をリストから除外
    setNormalNews(prev => prev.filter(item => item.id !== newsId))
    
    console.log('記事を非表示にしました:', newsId)
  }

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
        
        // NHKニュースのみを取得
        const newsItems = await fetchNHKNews()

        if (newsItems.length === 0) {
          setError('ニュースが取得できませんでした')
        } else {
          // 全て通常ニュースとして扱う（緊急ニュースは一切表示しない）
          // 非表示にした記事を除外
          const filteredNews = newsItems.filter(item => !hiddenNewsIds.has(item.id))
          
          // 緊急ニュースを完全にクリア
          console.log('【デバッグ】ニュース取得完了:', {
            totalNews: newsItems.length,
            filteredNews: filteredNews.length,
            hiddenNewsCount: hiddenNewsIds.size
          })
          
          setUrgentNews([])
          setNormalNews(filteredNews)
          
          // 緊急ニュースの表示を完全に停止（確実にfalseにする）
          console.log('【デバッグ】緊急ニュース表示状態:', {
            before: isShowingUrgent,
            willSet: false
          })
          setIsShowingUrgent(false)
          // setUrgentDisplayStartTime(null) // 未使用のためコメントアウト
          setCurrentUrgentIndex(0)
          
          // 通常ニュースのインデックスをリセット（念のため）
          if (filteredNews.length > 0 && currentNormalIndex >= filteredNews.length) {
            setCurrentNormalIndex(0)
          }
          
          console.log('【デバッグ】状態設定完了:', {
            urgentNewsLength: 0,
            normalNewsLength: filteredNews.length,
            isShowingUrgent: false
          })
          
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
  }, [hiddenNewsIds])

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
    // デバッグログ
    console.log('【デバッグ】getCurrentNews呼び出し:', {
      isShowingUrgent,
      urgentNewsLength: urgentNews.length,
      normalNewsLength: normalNews.length,
      currentNormalIndex,
      currentUrgentIndex
    })
    
    // 緊急ニュースは一切表示しない（強制的に通常ニュースのみ）
    if (normalNews.length > 0) {
      const news = normalNews[currentNormalIndex]
      console.log('【デバッグ】通常ニュースを返します:', news?.title)
      return news
    }
    console.log('【デバッグ】ニュースがありません')
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
  
  // デバッグログ：現在の状態を表示
  console.log('【デバッグ】Newsコンポーネントの状態:', {
    isShowingUrgent,
    urgentNewsLength: urgentNews.length,
    normalNewsLength: normalNews.length,
    currentNormalIndex,
    currentNewsTitle: currentNews?.title,
    currentNewsCategory: currentNews?.category,
    currentNewsIsUrgent: currentNews?.isUrgent
  })

  // デバッグ情報を常に表示（確実に表示されるように）
  const debugInfo = {
    isShowingUrgent,
    urgentNewsLength: urgentNews.length,
    normalNewsLength: normalNews.length,
    currentNormalIndex,
    currentUrgentIndex,
    currentNewsIsUrgent: currentNews?.isUrgent,
    currentNewsCategory: currentNews?.category,
    currentNewsTitle: currentNews?.title?.substring(0, 30)
  }
  
  console.log('【デバッグ】Newsコンポーネント レンダリング:', debugInfo)

  // デバッグ情報をbody直下に表示（React Portalを使用）
  const debugElement = (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      background: 'rgba(255, 0, 0, 0.95)',
      color: '#fff',
      padding: '1rem',
      fontSize: '0.9rem',
      zIndex: 999999,
      borderRadius: '0.5rem',
      fontFamily: 'monospace',
      maxWidth: '500px',
      border: '3px solid #fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
      pointerEvents: 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1rem' }}>【デバッグ情報】</div>
      <div>isShowingUrgent: {String(isShowingUrgent)}</div>
      <div>urgentNews.length: {urgentNews.length}</div>
      <div>normalNews.length: {normalNews.length}</div>
      <div>currentNormalIndex: {currentNormalIndex}</div>
      <div>currentUrgentIndex: {currentUrgentIndex}</div>
      <div>currentNews?.isUrgent: {String(currentNews?.isUrgent || false)}</div>
      <div>currentNews?.category: {currentNews?.category || 'なし'}</div>
      <div>currentNews?.title: {currentNews?.title?.substring(0, 40) || 'なし'}...</div>
      <div>hiddenNewsIds.size: {hiddenNewsIds.size}</div>
    </div>
  )

  return (
    <>
      {createPortal(debugElement, document.body)}
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
                  {currentNews.category === '緊急地震速報' ? 'P2P地震情報' : 'NHKニュース'}
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
            className="news-delete-button"
            onClick={(e) => hideNews(currentNews.id, e)}
            title="この記事を非表示にする"
            aria-label="記事を削除"
          >
            🗑️
          </button>
        </div>
      ) : (
        <div className="news-empty">ニュースが取得できませんでした</div>
      )}
      </div>
    </>
  )
}

export default News
