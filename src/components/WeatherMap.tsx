import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './WeatherMap.css'

interface WeatherMapProps {
  prefecture: string
  city: string
  condition: string
  lat?: number
  lon?: number
}

// 都道府県の中心座標
const PREFECTURE_COORDS: { [key: string]: [number, number] } = {
  '北海道': [43.0642, 141.3469],
  '青森県': [40.8244, 140.7406],
  '岩手県': [39.7036, 141.1527],
  '宮城県': [38.2688, 140.8721],
  '秋田県': [39.7186, 140.1024],
  '山形県': [38.2404, 140.3633],
  '福島県': [37.7500, 140.4676],
  '茨城県': [36.3414, 140.4467],
  '栃木県': [36.5658, 139.8836],
  '群馬県': [36.3911, 139.0608],
  '埼玉県': [35.8617, 139.6455],
  '千葉県': [35.6074, 140.1065],
  '東京都': [35.6762, 139.6503],
  '神奈川県': [35.4475, 139.6425],
  '新潟県': [37.9161, 139.0364],
  '富山県': [36.6953, 137.2113],
  '石川県': [36.5947, 136.6256],
  '福井県': [36.0652, 136.2216],
  '山梨県': [35.6636, 138.5684],
  '長野県': [36.6513, 138.1812],
  '岐阜県': [35.3912, 136.7223],
  '静岡県': [34.9769, 138.3831],
  '愛知県': [35.1802, 136.9066],
  '三重県': [34.7303, 136.5086],
  '滋賀県': [35.0045, 135.8686],
  '京都府': [35.0212, 135.7556],
  '大阪府': [34.6863, 135.5197],
  '兵庫県': [34.6913, 135.1830],
  '奈良県': [34.6851, 135.8050],
  '和歌山県': [34.2261, 135.1675],
  '鳥取県': [35.5038, 134.2383],
  '島根県': [35.4723, 133.0505],
  '岡山県': [34.6617, 133.9350],
  '広島県': [34.3963, 132.4596],
  '山口県': [34.1858, 131.4705],
  '徳島県': [34.0658, 134.5593],
  '香川県': [34.3401, 134.0433],
  '愛媛県': [33.8416, 132.7656],
  '高知県': [33.5597, 133.5311],
  '福岡県': [33.5904, 130.4017],
  '佐賀県': [33.2494, 130.2988],
  '長崎県': [32.7448, 129.8737],
  '熊本県': [32.7898, 130.7416],
  '大分県': [33.2381, 131.6126],
  '宮崎県': [31.9077, 131.4202],
  '鹿児島県': [31.5601, 130.5581],
  '沖縄県': [26.2124, 127.6809]
}

const WeatherMap = ({ prefecture, city, condition, lat, lon }: WeatherMapProps) => {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const radarLayerRef = useRef<L.TileLayer | null>(null)
  const [basetime, setBasetime] = useState<string>('')
  const [validtime, setValidtime] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  // 気象庁の降水ナウキャストのベースタイムとバリッドタイムを取得
  useEffect(() => {
    const fetchRadarTimes = async () => {
      try {
        // 気象庁の降水ナウキャストのメタデータを取得
        const response = await fetch('https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json')
        if (response.ok) {
          const data = await response.json()
          console.log('気象庁データ:', data)
          if (data && data.length > 0) {
            // 最新のベースタイムとバリッドタイムを取得
            const latest = data[data.length - 1]
            console.log('最新データ:', latest)
            setBasetime(latest.basetime)
            // 最初のバリッドタイムを使用（現在時刻に最も近い）
            if (latest.validtime && latest.validtime.length > 0) {
              setValidtime(latest.validtime[0])
              setDebugInfo(`basetime: ${latest.basetime}, validtime: ${latest.validtime[0]}`)
            }
          }
        } else {
          console.error('気象庁APIのレスポンスエラー:', response.status)
        }
      } catch (error) {
        console.error('レーダータイムの取得に失敗しました:', error)
        // フォールバック: 現在時刻から計算
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hour = String(Math.floor(now.getHours() / 5) * 5).padStart(2, '0')
        const minute = '00'
        const base = `${year}${month}${day}${hour}${minute}00`
        setBasetime(base)
        // 10分後をバリッドタイムとして設定
        const valid = String(parseInt(base) + 100000)
        setValidtime(valid)
        setDebugInfo(`フォールバック: basetime: ${base}, validtime: ${valid}`)
      }
    }

    fetchRadarTimes()
    const interval = setInterval(fetchRadarTimes, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) return

    // 座標を決定
    const coordinates = lat && lon ? [lat, lon] : PREFECTURE_COORDS[prefecture] || [35.6762, 139.6503]

    // 地図を初期化
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: coordinates as [number, number],
        zoom: 8,
        zoomControl: false,
        attributionControl: false
      })

      // 地図の背景レイヤー（暗めに）
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        opacity: 0.5
      }).addTo(mapRef.current)
    } else {
      mapRef.current.setView(coordinates as [number, number], 8)
    }

    // マーカーを更新
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current)
    }

    // カスタムアイコンを作成
    const weatherIcon = L.divIcon({
      className: 'weather-marker',
      html: `<div class="weather-marker-content">${condition === '雨' ? '🌧️' : condition === '曇り' ? '☁️' : '☀️'}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    markerRef.current = L.marker(coordinates as [number, number], {
      icon: weatherIcon
    }).addTo(mapRef.current)

    markerRef.current.bindPopup(`${prefecture}${city ? ' ' + city : ''}<br>${condition}`)

    // 気象庁の雨雲レーダータイルを追加（カラフルな画像）
    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current)
      radarLayerRef.current = null
    }

    // basetimeとvalidtimeが取得できている場合のみレーダーを追加
    if (basetime && validtime) {
      const tileUrl = `https://www.jma.go.jp/bosai/jmatile/data/nowc/${basetime}/${validtime}/{z}/{x}/{y}.png`
      console.log('レーダータイルURL:', tileUrl.replace('{z}/{x}/{y}', '8/140/60')) // サンプルURLを表示

      radarLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 10,
        opacity: 0.8,
        attribution: '気象庁',
        className: 'radar-tile-layer',
        // エラー時の処理
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })

      radarLayerRef.current.addTo(mapRef.current)

      // タイル読み込み完了時のイベント
      radarLayerRef.current.on('tileload', (e: any) => {
        console.log('タイル読み込み成功:', e.url)
      })

      radarLayerRef.current.on('tileerror', (e: any) => {
        console.error('タイルエラー:', e.url)
      })
    } else {
      console.log('basetimeまたはvalidtimeが取得できていません')
    }

    return () => {
      // クリーンアップはしない（地図は保持）
    }
  }, [prefecture, city, condition, lat, lon, basetime, validtime])

  return (
    <div className="weather-map-container">
      <div ref={mapContainerRef} className="weather-map" />
      {condition === '雨' && (
        <div className="weather-rain-effect">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="rain-drop" style={{
              left: `${(i * 5)}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.5 + Math.random() * 0.3}s`
            }} />
          ))}
        </div>
      )}
      <div className="weather-map-label">
        雨雲レーダー（気象庁）
        {debugInfo && <span className="debug-info">{debugInfo}</span>}
      </div>
    </div>
  )
}

export default WeatherMap
