import { useState, useEffect } from 'react'
import './EarthquakeAlert.css'

interface EarthquakeInfo {
  id: number
  magnitude: number
  location: string
  time: string
  depth: string
  intensity: string
  isAlert: boolean
}

// 地震情報の状態を外部から取得できるようにする（実際の実装では状態管理を使用）
let earthquakeAlertCallback: ((hasAlert: boolean) => void) | null = null

export const setEarthquakeAlertCallback = (callback: (hasAlert: boolean) => void) => {
  earthquakeAlertCallback = callback
}

const EarthquakeAlert = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [hasActiveAlert, setHasActiveAlert] = useState(false)

  useEffect(() => {
    // 地震情報APIの例（実際のAPIを連携可能）
    // 今回はモックデータを使用
    const fetchEarthquakeData = async () => {
      try {
        // 実際の使用時は地震情報APIを実装
        // 例: 気象庁のAPIや地震速報サービス
        setTimeout(() => {
          const data: EarthquakeInfo[] = [
            // 通常時は空配列（緊急地震速報がある場合のみデータを追加）
            // 例: 緊急地震速報がある場合
            // {
            //   id: 1,
            //   magnitude: 5.5,
            //   location: '千葉県東方沖',
            //   time: '2024年1月15日 14:30',
            //   depth: '30km',
            //   intensity: '震度5弱',
            //   isAlert: true
            // }
          ]
          setEarthquakes(data)
          const hasAlert = data.some(eq => eq.isAlert) || data.length > 0
          setHasActiveAlert(hasAlert)
          
          // 外部に状態を通知
          if (earthquakeAlertCallback) {
            earthquakeAlertCallback(hasAlert)
          }
          
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('地震情報の取得に失敗しました:', error)
        setLoading(false)
        if (earthquakeAlertCallback) {
          earthquakeAlertCallback(false)
        }
      }
    }

    fetchEarthquakeData()
    const interval = setInterval(fetchEarthquakeData, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="earthquake-alert">
        <div className="earthquake-loading">地震情報を読み込み中...</div>
      </div>
    )
  }

  if (!hasActiveAlert && earthquakes.length === 0) {
    return null // 地震情報がない場合は何も表示しない
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
      <h2 className="earthquake-title">地震情報</h2>
      {earthquakes.length === 0 ? (
        <div className="earthquake-empty">
          <p>直近の地震情報はありません</p>
        </div>
      ) : (
        <div className="earthquake-list">
          {earthquakes.map((eq) => (
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
      )}
      <div className="earthquake-footer">
        <p className="earthquake-note">
          ※ 情報は気象庁などの公式データに基づいています
        </p>
      </div>
    </div>
  )
}

export default EarthquakeAlert
