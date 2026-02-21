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

  // NHKのRSS(XML)を取得してパース
  const fetchNHKRss = async (rssUrl: string, categoryName: string): Promise<NewsItem[]> => {
    try {
      // 既存のVercelバックエンド (Serverless Function) を専用プロキシとして指定
      const response = await fetch(`https://home-signage.vercel.app/api/nhk-rss?url=${encodeURIComponent(rssUrl)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml'
        }
      })

      if (!response.ok) {
        console.error(`${categoryName} RSS取得エラー: status=`, response.status)
        return []
      }

      const xmlText = await response.text()
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const items = xmlDoc.querySelectorAll('item')

      const newsList: NewsItem[] = []
      items.forEach((item, index) => {
        const title = item.querySelector('title')?.textContent || ''
        const link = item.querySelector('link')?.textContent || ''
        const pubDate = item.querySelector('pubDate')?.textContent || ''
        const description = item.querySelector('description')?.textContent || ''

        // nhk:video または enclosure から動画・画像を探す
        let imageUrl = ''
        let videoUrl = ''
        const enc = item.querySelector('enclosure')
        if (enc) {
          const type = enc.getAttribute('type') || ''
          const url = enc.getAttribute('url') || ''
          if (type.startsWith('image/')) imageUrl = url
          if (type.startsWith('video/')) videoUrl = url
        }
        // 要素名の名前空間検索(nhk:news_web_image) - 大文字小文字や正確な名前空間はRSSの仕様による
        const imageEl = item.getElementsByTagNameNS('*', 'news_web_image')[0] || item.getElementsByTagName('image')[0];
        if (imageEl && !imageUrl) {
          imageUrl = imageEl.textContent || '';
        }

        newsList.push({
          id: Date.now() + Math.floor(Math.random() * 1000) + index,
          title,
          link,
          pubDate,
          description,
          category: categoryName,
          isUrgent: false,
          image: imageUrl || undefined,
          video: videoUrl || undefined
        })
      })

      return newsList
    } catch (err) {
      console.error(`${categoryName} RSS取得でエラー:`, err)
      return []
    }
  }

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)

        // 緊急ニュース機能を完全に停止
        // P2P地震情報のAPIからの取得も停止

        // スクレイピングAPIからニュースを取得
        const [nhkAreaNews, nhkTopNews, nhkLatestNews] = await Promise.all([
          fetchNHKRss('https://www.nhk.or.jp/niigata/lnews/niigata.xml', '新潟県ニュース'),
          fetchNHKRss('https://www.nhk.or.jp/rss/news/cat0.xml', 'トップニュース'),
          fetchNHKRss('https://www.nhk.or.jp/rss/news/cat1.xml', '最新ニュース')
        ])

        // デバッグ用：各ニュースソースの取得数をログ出力
        console.log('📰 [ニュース取得結果]', {
          '新潟県ニュース': nhkAreaNews.length,
          'トップニュース': nhkTopNews.length,
          '新着ニュース': nhkLatestNews.length
        })

        // 各ソースの画像があるニュース数を確認
        const areaNewsWithImage = nhkAreaNews.filter((item: NewsItem) => item.image && item.image.length >= 2 && !item.image.includes('data:') && !item.image.toLowerCase().includes('placeholder') && !item.image.toLowerCase().includes('nhk-one-news_eyecatch')).length
        const topNewsWithImage = nhkTopNews.filter((item: NewsItem) => item.image && item.image.length >= 2 && !item.image.includes('data:') && !item.image.toLowerCase().includes('placeholder') && !item.image.toLowerCase().includes('nhk-one-news_eyecatch')).length
        const latestNewsWithImage = nhkLatestNews.filter((item: NewsItem) => item.image && item.image.length >= 2 && !item.image.includes('data:') && !item.image.toLowerCase().includes('placeholder') && !item.image.toLowerCase().includes('nhk-one-news_eyecatch')).length

        console.log('🖼️ [画像があるニュース数]', {
          '新潟県ニュース': areaNewsWithImage,
          'トップニュース': topNewsWithImage,
          '新着ニュース': latestNewsWithImage
        })

        // 全てのニュースを統合
        let newsItems = [...nhkAreaNews, ...nhkTopNews, ...nhkLatestNews]

        console.log('📊 [統合後のニュース総数]', newsItems.length)

        // 一昨日以前を除外（昨日 0:00 JST 以降のみ表示）。日付不明は残す
        const yesterdayStartJST = getYesterdayStartJST()
        newsItems = newsItems.filter((item) => {
          const t = parsePubDateToTime(item.pubDate)
          return t === 0 || t >= yesterdayStartJST
        })

        // ソート：時刻で新しい順。日付不明・無効は 0 で末尾に
        newsItems.sort((a, b) => {
          const dateA = parsePubDateToTime(a.pubDate)
          const dateB = parsePubDateToTime(b.pubDate)
          return dateB - dateA
        })

        // 画像/動画つきのニュースを優先的に表示
        const hasMedia = (item: NewsItem) => {
          if (!item) return false

          const image = item.image?.trim()
          const hasImage = !!(image && image.length >= 2 &&
            !image.includes('data:') &&
            !image.toLowerCase().includes('placeholder') &&
            !image.toLowerCase().includes('nhk-one-news_eyecatch'))

          const video = item.video?.trim()
          const hasVideo = !!(video && video.length >= 2 &&
            !video.includes('data:') &&
            !video.toLowerCase().includes('placeholder'))

          return hasImage || hasVideo
        }

        const mediaItems = newsItems.filter(hasMedia)
        const orderedItems = mediaItems.length > 0 ? mediaItems : newsItems

        // 全て通常ニュースとして扱う
        setNormalNews(orderedItems)

        // 通常ニュースのインデックスをリセット（念のため）
        if (orderedItems.length > 0 && currentNormalIndex >= orderedItems.length) {
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
    // プロトコル相対URL（//で始まる）
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    // 相対パス（/で始まる）の場合はNHKのドメインを追加
    if (trimmed.startsWith('/')) return `https://news.web.nhk${trimmed}`
    return trimmed
  }

  const isVideoUrl = (url?: string): boolean => {
    const normalized = normalizeMediaUrl(url)
    if (!normalized) return false
    return /\.(mp4|webm|m3u8)(\?|#|$)/i.test(normalized)
  }

  const normalizedVideoUrl = normalizeMediaUrl(currentNews?.video)
  const normalizedImageUrl = normalizeMediaUrl(currentNews?.image)

  // 画像URLを優先的に使用（動画URLは画像として使用しない）
  // 画像URLが存在する場合は、必ず表示を試みる
  let mediaImageUrl: string | null = null
  if (currentNews?.image) {
    // 元の画像URLを正規化
    const originalImage = currentNews.image.trim()
    // より緩い条件：空でなく、data:やplaceholderでない場合は使用
    // デフォルト画像（nhk-one-news_eyecatch）も除外
    if (originalImage && originalImage.length >= 2 &&
      !originalImage.includes('data:') &&
      !originalImage.toLowerCase().includes('placeholder') &&
      !originalImage.toLowerCase().includes('nhk-one-news_eyecatch')) {
      // 正規化処理を適用
      let finalImageUrl = originalImage
      if (finalImageUrl.startsWith('//')) {
        finalImageUrl = `https:${finalImageUrl}`
      } else if (finalImageUrl.startsWith('/')) {
        finalImageUrl = `https://news.web.nhk${finalImageUrl}`
      } else if (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
        // プロトコルがない場合はhttps://を追加
        finalImageUrl = `https://news.web.nhk${finalImageUrl.startsWith('/') ? '' : '/'}${finalImageUrl}`
      }
      mediaImageUrl = finalImageUrl
    }
  }

  // normalizedImageUrlが存在し、mediaImageUrlが設定されていない場合は使用
  if (!mediaImageUrl && normalizedImageUrl) {
    const normalizedLower = normalizedImageUrl.toLowerCase()
    // デフォルト画像やplaceholderを除外
    if (normalizedImageUrl.length >= 2 &&
      !normalizedLower.includes('data:') &&
      !normalizedLower.includes('placeholder') &&
      !normalizedLower.includes('nhk-one-news_eyecatch')) {
      mediaImageUrl = normalizedImageUrl
    }
  }

  const hasValidMedia = !!currentNews && (
    (isVideoUrl(normalizedVideoUrl || undefined) && normalizedVideoUrl) ||
    !!mediaImageUrl
  )

  // デバッグ: 画像URLの処理状況をログ出力（詳細版）
  if (currentNews) {
    const currentIndex = currentNormalIndex
    const totalCount = normalNews.length
    const isTargetIndex = currentIndex >= 10 && currentIndex <= 15 // 10-15番目を重点的にデバッグ
    const isExactly12th = currentIndex === 11 // 12番目（インデックス11）を特別にデバッグ

    const debugInfo = {
      index: `${currentIndex + 1}/${totalCount}`,
      title: currentNews.title.substring(0, 40),
      originalImage: currentNews.image,
      originalImageLength: currentNews.image?.length || 0,
      normalizedImageUrl,
      normalizedImageUrlLength: normalizedImageUrl?.length || 0,
      mediaImageUrl,
      mediaImageUrlLength: mediaImageUrl?.length || 0,
      hasVideo: !!currentNews.video,
      videoUrl: currentNews.video,
      isVideoUrl: isVideoUrl(normalizedVideoUrl || undefined),
      willShowImage: !!mediaImageUrl && !isVideoUrl(normalizedVideoUrl || undefined),
      hasValidMedia,
      imageLoadError: imageLoadErrors.has(currentNews.id)
    }

    if (isExactly12th) {
      // 12番目のニュースを特別に詳細デバッグ
      console.log('🔍 [12番目のニュース - 詳細デバッグ]', {
        ...debugInfo,
        newsId: currentNews.id,
        category: currentNews.category
      })

      // 画像URLの処理ステップを詳しく確認
      if (currentNews.image) {
        const originalImage = currentNews.image.trim()
        console.log('🔍 [12番目 - 画像URL処理ステップ]', {
          step1_originalImage: originalImage,
          step2_lengthCheck: originalImage.length >= 2,
          step3_dataCheck: !originalImage.includes('data:'),
          step4_placeholderCheck: !originalImage.toLowerCase().includes('placeholder'),
          step5_finalImageUrl: mediaImageUrl,
          step6_normalizeMediaUrl_result: normalizeMediaUrl(currentNews.image),
          step7_hasValidMedia: hasValidMedia,
          step8_imageCondition: !isVideoUrl(normalizedVideoUrl || undefined) && !!mediaImageUrl && !imageLoadErrors.has(currentNews.id)
        })
      } else {
        console.log('🔍 [12番目 - 画像なし]', {
          hasImage: false,
          hasVideo: !!currentNews.video,
          videoUrl: currentNews.video,
          hasValidMedia: hasValidMedia
        })
      }
    } else if (isTargetIndex) {
      console.log('[画像URL処理 - 詳細デバッグ]', debugInfo)

      // 画像URLの処理ステップを詳しく確認
      if (currentNews.image) {
        const originalImage = currentNews.image.trim()
        console.log('[画像URL処理ステップ]', {
          step1_originalImage: originalImage,
          step2_lengthCheck: originalImage.length >= 2,
          step3_dataCheck: !originalImage.includes('data:'),
          step4_placeholderCheck: !originalImage.toLowerCase().includes('placeholder'),
          step5_finalImageUrl: mediaImageUrl,
          step6_normalizeMediaUrl_result: normalizeMediaUrl(currentNews.image)
        })
      }
    } else {
      console.log('[画像URL処理]', {
        index: `${currentIndex + 1}/${totalCount}`,
        originalImage: currentNews.image,
        mediaImageUrl,
        willShowImage: !!mediaImageUrl && !isVideoUrl(normalizedVideoUrl || undefined)
      })
    }
  }

  // デバッグ用：現在のニュースの画像情報をログ出力（詳細版）
  if (currentNews) {
    const currentIndex = currentNormalIndex
    const totalCount = normalNews.length
    const isTargetIndex = currentIndex >= 10 && currentIndex <= 15 // 10-15番目を重点的にデバッグ
    const isExactly12th = currentIndex === 11 // 12番目（インデックス11）を特別にデバッグ

    const imageCondition = !isVideoUrl(normalizedVideoUrl || undefined) && !!mediaImageUrl && !imageLoadErrors.has(currentNews.id)

    const debugInfo = {
      index: `${currentIndex + 1}/${totalCount}`,
      title: currentNews.title.substring(0, 30),
      newsId: currentNews.id,
      hasImage: !!currentNews.image,
      imageUrl: currentNews.image,
      imageUrlLength: currentNews.image?.length || 0,
      isValidImageUrl: !!mediaImageUrl,
      mediaImageUrl,
      hasVideo: !!currentNews.video,
      videoUrl: currentNews.video,
      hasValidMedia: hasValidMedia,
      imageLoadError: imageLoadErrors.has(currentNews.id),
      imageCondition: imageCondition,
      willShowImage: imageCondition,
      isVideoUrl: isVideoUrl(normalizedVideoUrl || undefined),
      normalizedVideoUrl,
      normalizedImageUrl
    }

    if (isExactly12th) {
      // 12番目のニュースを特別に詳細デバッグ
      console.log('🔍 [12番目のニュース - 表示デバッグ]', {
        ...debugInfo,
        newsId: currentNews.id,
        category: currentNews.category
      })

      // 画像表示の判定ロジックを詳しく確認
      console.log('🔍 [12番目 - 画像表示判定]', {
        step1_hasImage: !!currentNews.image,
        step2_mediaImageUrl: !!mediaImageUrl,
        step3_isVideoUrl: isVideoUrl(normalizedVideoUrl || undefined),
        step4_imageLoadError: imageLoadErrors.has(currentNews.id),
        step5_imageCondition: imageCondition,
        step6_hasValidMedia: hasValidMedia,
        final_willShowImage: imageCondition,
        normalizedImageUrl,
        normalizedVideoUrl
      })
    } else if (isTargetIndex) {
      console.log('[ニュース表示デバッグ - 詳細]', debugInfo)

      // 画像表示の判定ロジックを詳しく確認
      console.log('[画像表示判定]', {
        step1_hasImage: !!currentNews.image,
        step2_mediaImageUrl: !!mediaImageUrl,
        step3_isVideoUrl: isVideoUrl(normalizedVideoUrl || undefined),
        step4_imageLoadError: imageLoadErrors.has(currentNews.id),
        step5_imageCondition: imageCondition,
        step6_hasValidMedia: hasValidMedia,
        final_willShowImage: imageCondition
      })
    } else {
      console.log('[ニュース表示デバッグ]', {
        index: `${currentIndex + 1}/${totalCount}`,
        title: currentNews.title.substring(0, 30),
        hasImage: !!currentNews.image,
        isValidImageUrl: !!mediaImageUrl,
        hasValidMedia: hasValidMedia,
        willShowImage: imageCondition
      })
    }

    if (imageCondition && mediaImageUrl) {
      console.log('[画像表示] 画像を表示します:', mediaImageUrl)
    } else if (currentNews.image && !hasValidMedia) {
      console.warn('[画像表示] 画像があるのに表示されません:', {
        index: `${currentIndex + 1}/${totalCount}`,
        imageUrl: currentNews.image,
        imageUrlLength: currentNews.image.length,
        isValidUrl: !!mediaImageUrl,
        mediaImageUrl,
        hasError: imageLoadErrors.has(currentNews.id),
        reason: imageLoadErrors.has(currentNews.id) ? '画像読み込みエラー' : (mediaImageUrl ? '不明' : '無効なURL'),
        normalizedImageUrl,
        normalizedVideoUrl
      })
    }
  }

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
            className={`news-item ${hasValidMedia ? 'news-item-with-media' : ''}`}
            style={{
              // 緊急ニュースのスタイルを強制的に無効化
              background: currentNews.isUrgent ? 'rgba(255, 255, 255, 0.15) !important' : undefined,
              border: currentNews.isUrgent ? '1px solid rgba(255, 255, 255, 0.1) !important' : undefined
            }}
          >
            {/* 動画または画像がある場合：画像とテキストを配置 */}
            {hasValidMedia ? (
              <div className="news-item-media-container">
                {/* 動画を表示 */}
                {isVideoUrl(normalizedVideoUrl || undefined) && normalizedVideoUrl && (
                  <div className="news-item-media">
                    <video
                      className="news-video"
                      src={normalizedVideoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      poster={mediaImageUrl && !isVideoUrl(mediaImageUrl) ? (mediaImageUrl.startsWith('data:image') ? mediaImageUrl : (mediaImageUrl.startsWith('http://') || mediaImageUrl.startsWith('https://') ? mediaImageUrl : `https://news.web.nhk${mediaImageUrl.startsWith('/') ? '' : '/'}${mediaImageUrl}`)) : undefined}
                    >
                      お使いのブラウザは動画の再生に対応していません。
                    </video>
                  </div>
                )}
                {/* 画像を表示（動画がない場合） */}
                {!isVideoUrl(normalizedVideoUrl || undefined) && mediaImageUrl && (
                  <div className="news-item-media">
                    <img
                      className="news-image"
                      src={
                        mediaImageUrl.startsWith('data:image')
                          ? mediaImageUrl
                          : mediaImageUrl.startsWith('http://') || mediaImageUrl.startsWith('https://')
                            ? mediaImageUrl
                            : `https://news.web.nhk${mediaImageUrl.startsWith('/') ? '' : '/'}${mediaImageUrl}`
                      }
                      alt={currentNews.title}
                      loading="eager"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const imgElement = e.target as HTMLImageElement
                        const currentSrc = imgElement.src
                        console.error('[画像読み込みエラー]', {
                          imageUrl: mediaImageUrl,
                          originalImageUrl: currentNews?.image,
                          normalizedImageUrl,
                          newsId: currentNews.id,
                          src: currentSrc,
                          attemptedUrl: mediaImageUrl
                        })

                        // エラーが発生した場合、元のURLを再正規化してリトライ（プロキシは使わない）
                        if (mediaImageUrl && currentNews?.image) {
                          const originalImage = currentNews.image.trim()
                          let retryUrl = originalImage
                          if (retryUrl.startsWith('//')) {
                            retryUrl = `https:${retryUrl}`
                          } else if (retryUrl.startsWith('/')) {
                            retryUrl = `https://news.web.nhk${retryUrl}`
                          } else if (!retryUrl.startsWith('http')) {
                            retryUrl = `https://news.web.nhk/${retryUrl}`
                          }
                          if (retryUrl !== currentSrc && retryUrl !== mediaImageUrl) {
                            console.log('[画像読み込みリトライ] 再正規化URLを試します:', retryUrl)
                            imgElement.src = retryUrl
                            return
                          }
                        }

                        handleImageError(currentNews.id, mediaImageUrl || undefined)
                      }}
                      onLoad={() => {
                        console.log('[画像読み込み成功]', {
                          imageUrl: mediaImageUrl,
                          originalImageUrl: currentNews?.image,
                          newsId: currentNews.id,
                          src: (document.querySelector(`.news-image[alt="${currentNews.title}"]`) as HTMLImageElement)?.src
                        })
                      }}
                    />
                  </div>
                )}
                <div className="news-item-text">
                  <h3 className="news-item-title">{currentNews.title}</h3>
                  {currentNews.description && (
                    <div className="news-item-description">{currentNews.description}</div>
                  )}
                  <div className="news-item-header">
                    <div className="news-item-meta">
                      <span className="news-category-badge">{currentNews.category}</span>
                      <span className="news-time">{formatDate(currentNews.pubDate)}</span>
                      <span className="news-source-label">
                        {currentNews.category === '緊急地震速報'
                          ? 'P2P地震情報'
                          : currentNews.category === 'トップニュース'
                            ? 'NHKトップニュース'
                            : currentNews.category === '新着ニュース' || currentNews.category === '最新ニュース'
                              ? 'NHK最新ニュース'
                              : currentNews.category === '新潟県ニュース'
                                ? 'NHK新潟'
                                : 'NHKニュース'}
                      </span>
                      <span className="news-counter">
                        {getNewsCounter()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 動画・画像がない場合：通常表示 */
              <>
                <h3 className="news-item-title">{currentNews.title}</h3>
                {currentNews.description && (
                  <div className="news-item-description">{currentNews.description}</div>
                )}
                <div className="news-item-header">
                  <div className="news-item-meta">
                    <span className="news-category-badge">{currentNews.category}</span>
                    <span className="news-time">{formatDate(currentNews.pubDate)}</span>
                    <span className="news-source-label">
                      {currentNews.category === '緊急地震速報'
                        ? 'P2P地震情報'
                        : currentNews.category === 'トップニュース'
                          ? 'NHKトップニュース'
                          : currentNews.category === '新着ニュース' || currentNews.category === '最新ニュース'
                            ? 'NHK最新ニュース'
                            : currentNews.category === '新潟県ニュース'
                              ? 'NHK新潟'
                              : 'NHKニュース'}
                    </span>
                    <span className="news-counter">
                      {getNewsCounter()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </a>
          {/* スキップボタン */}
          <button
            className="news-skip-button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              // 次のニュースに進む
              setCurrentNormalIndex((prev) => (prev + 1) % normalNews.length)
            }}
            title="次のニュースへ"
            aria-label="次のニュースへ"
          >
            ⏭️
          </button>
        </div>
      ) : (
        <div className="news-empty">ニュースが取得できませんでした</div>
      )}
    </div>
  )
}

export default News
