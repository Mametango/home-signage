import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import './EarthquakeAlert.css'

interface EarthquakeInfo {
  id: string
  magnitude: number
  location: string
  time: string
  depth: string
  intensity: string
  isAlert: boolean
}

const EarthquakeAlert = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActiveAlert, setHasActiveAlert] = useState(false)

  useEffect(() => {
    const fetchEarthquakeData = async () => {
      try {
        // 気象庁の地震情報APIから取得
        // 最新の地震情報
        const response = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json', {
          cache: 'no-cache'
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // データをパース
          const earthquakeList: EarthquakeInfo[] = []
          
          if (data && Array.isArray(data)) {
            // 最新の地震情報を取得（最大5件）
            const recentQuakes = data.slice(0, 5)
            
            recentQuakes.forEach((quake: any, index: number) => {
              if (quake && quake.earthquake) {
                const eq = quake.earthquake
                const time = quake.time ? new Date(quake.time) : new Date()
                
                // 震度情報を取得
                let intensity = '不明'
                if (eq.maxScale) {
                  const scale = eq.maxScale
                  if (scale >= 7) intensity = '震度7'
                  else if (scale >= 6) intensity = '震度6'
                  else if (scale >= 5) intensity = '震度5'
                  else if (scale >= 4) intensity = '震度4'
                  else if (scale >= 3) intensity = '震度3'
                  else if (scale >= 2) intensity = '震度2'
                  else if (scale >= 1) intensity = '震度1'
                }
                
                // 緊急地震速報かどうかを判定（震度4以上、または最近1時間以内）
                const isRecent = (Date.now() - time.getTime()) < 3600000 // 1時間以内
                const isAlert = eq.maxScale >= 4 || isRecent
                
                earthquakeList.push({
                  id: quake.id || `eq-${index}`,
                  magnitude: eq.hypocenter?.magnitude || 0,
                  location: eq.hypocenter?.name || '不明',
                  time: `${format(time, 'yyyy年MM月dd日 HH:mm')} ${['日', '月', '火', '水', '木', '金', '土'][time.getDay()]}曜日`,
                  depth: eq.hypocenter?.depth ? `${eq.hypocenter.depth}km` : '不明',
                  intensity: intensity,
                  isAlert: isAlert
                })
              }
            })
          }
          
          setEarthquakes(earthquakeList)
          const hasAlert = earthquakeList.some(eq => eq.isAlert)
          setHasActiveAlert(hasAlert)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('地震情報の取得に失敗しました:', error)
      }
      
      // フォールバック: 緊急地震速報APIを試す
      try {
        const eewResponse = await fetch('https://www.jma.go.jp/bosai/quake/data/eeew.json', {
          cache: 'no-cache'
        })
        
        if (eewResponse.ok) {
          const eewData = await eewResponse.json()
          
          if (eewData && eewData.items && eewData.items.length > 0) {
            const alertList: EarthquakeInfo[] = []
            
            eewData.items.forEach((item: any, index: number) => {
              if (item && item.earthquake) {
                const eq = item.earthquake
                const time = item.time ? new Date(item.time) : new Date()
                
                let intensity = '不明'
                if (eq.maxScale) {
                  const scale = eq.maxScale
                  if (scale >= 7) intensity = '震度7'
                  else if (scale >= 6) intensity = '震度6'
                  else if (scale >= 5) intensity = '震度5'
                  else if (scale >= 4) intensity = '震度4'
                }
                
                alertList.push({
                  id: item.id || `eew-${index}`,
                  magnitude: eq.hypocenter?.magnitude || 0,
                  location: eq.hypocenter?.name || '不明',
                  time: `${format(time, 'yyyy年MM月dd日 HH:mm')} ${['日', '月', '火', '水', '木', '金', '土'][time.getDay()]}曜日`,
                  depth: eq.hypocenter?.depth ? `${eq.hypocenter.depth}km` : '不明',
                  intensity: intensity,
                  isAlert: true
                })
              }
            })
            
            if (alertList.length > 0) {
              setEarthquakes(alertList)
              setHasActiveAlert(true)
              setLoading(false)
              return
            }
          }
        }
      } catch (eewError) {
        console.error('緊急地震速報の取得に失敗しました:', eewError)
      }
      
      // 最終フォールバック: 空のデータ
      setEarthquakes([])
      setHasActiveAlert(false)
      setLoading(false)
    }

    fetchEarthquakeData()
    const interval = setInterval(fetchEarthquakeData, 30000) // 30秒ごとに更新

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return null // ローディング中は何も表示しない
  }

  // 緊急地震速報がある場合のみ表示（震度4以上、または最近1時間以内の地震）
  const urgentEarthquakes = earthquakes.filter(eq => eq.isAlert)
  if (urgentEarthquakes.length === 0 && !hasActiveAlert) {
    return null
  }

  return (
    <div className="earthquake-alert">
      {hasActiveAlert && (
        <div className="earthquake-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <h3>緊急地震速報</h3>
            <p>強い揺れに注意してください</p>
          </div>
        </div>
      )}
      {urgentEarthquakes.length > 0 && (
        <>
          <h2 className="earthquake-title">地震情報</h2>
          <div className="earthquake-list">
            {urgentEarthquakes.map((eq) => (
              <div key={eq.id} className={`earthquake-item ${eq.isAlert ? 'alert' : ''}`}>
                <div className="earthquake-header">
                  <div className="earthquake-magnitude">
                    <span className="magnitude-label">M</span>
                    <span className="magnitude-value">{eq.magnitude}</span>
                  </div>
                  <div className="earthquake-intensity">{eq.intensity}</div>
                </div>
                <div className="earthquake-location">{eq.location}</div>
                <div className="earthquake-details">
                  <span className="earthquake-time">{eq.time}</span>
                  <span className="earthquake-depth">深さ: {eq.depth}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default EarthquakeAlert
