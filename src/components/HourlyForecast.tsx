import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { getSettings } from './Settings'
import './HourlyForecast.css'

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
  precipitation: number // 降水確率（%）
}

const HourlyForecast = () => {
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture)
      setCity(settings.city || '')
    }

    loadSettings()
    
    // 設定変更イベントを監視
    const handleSettingsChange = () => {
      loadSettings()
    }
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        // 新潟県新発田市の座標: 37.95°N, 139.33°E
        const lat = 37.95
        const lon = 139.33
        
        // OpenWeatherMap APIを使用（APIキーが必要）
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
        
        if (apiKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            const getWeatherIcon = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '🌧️'
              if (condition.includes('Cloud') || condition.includes('曇')) return '☁️'
              if (condition.includes('Snow') || condition.includes('雪')) return '❄️'
              return '☀️'
            }
            
            const getWeatherCondition = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '雨'
              if (condition.includes('Cloud') || condition.includes('曇')) return '曇り'
              if (condition.includes('Snow') || condition.includes('雪')) return '雪'
              return '晴れ'
            }
            
            // 今日の朝6時から夜12時（24時）まで、2時間おきの固定時刻を生成
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const fixedHours = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24] // 6時から24時まで2時間おき
            
            const forecast: HourlyForecast[] = []
            
            // 固定時刻の予報を生成
            for (const hour of fixedHours) {
              const forecastTime = new Date(today)
              if (hour === 24) {
                // 24時は翌日の0時として扱う
                forecastTime.setDate(forecastTime.getDate() + 1)
                forecastTime.setHours(0, 0, 0, 0)
              } else {
                forecastTime.setHours(hour, 0, 0, 0)
              }
              
              // APIから取得したデータから最も近い時刻のデータを取得
              let closestItem = data.list[0]
              let minTimeDiff = Math.abs(new Date(closestItem.dt_txt).getTime() - forecastTime.getTime())
              
              for (const item of data.list) {
                const itemTime = new Date(item.dt_txt).getTime()
                const timeDiff = Math.abs(itemTime - forecastTime.getTime())
                if (timeDiff < minTimeDiff) {
                  minTimeDiff = timeDiff
                  closestItem = item
                }
              }
              
              forecast.push({
                time: forecastTime,
                temp: Math.round(closestItem.main.temp),
                condition: getWeatherCondition(closestItem.weather[0].main),
                icon: getWeatherIcon(closestItem.weather[0].main),
                precipitation: Math.round(closestItem.pop * 100) // 降水確率（0-1を0-100に変換）
              })
            }
            
            setHourlyForecast(forecast)
            setLoading(false)
            return
          }
        }
        
        // フォールバック: モックデータ（新発田市の実際の気温に近い値）
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const fixedHours = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24] // 6時から24時まで2時間おき
        
        const forecast: HourlyForecast[] = []
        const conditions = ['晴れ', '曇り', '雨', '晴れ', '曇り', '晴れ', '曇り', '雨', '晴れ', '曇り']
        const icons = ['☀️', '☁️', '🌧️', '☀️', '☁️', '☀️', '☁️', '🌧️', '☀️', '☁️']
        const temps = [8, 10, 12, 14, 16, 15, 13, 11, 9, 7] // 新発田市の気温に近い値（朝から夜へ）
        const pops = [20, 30, 40, 30, 20, 10, 0, 0, 0, 0] // 降水確率
        
        for (let i = 0; i < fixedHours.length; i++) {
          const hour = fixedHours[i]
          const forecastTime = new Date(today)
          if (hour === 24) {
            // 24時は翌日の0時として扱う
            forecastTime.setDate(forecastTime.getDate() + 1)
            forecastTime.setHours(0, 0, 0, 0)
          } else {
            forecastTime.setHours(hour, 0, 0, 0)
          }
          
          forecast.push({
            time: forecastTime,
            temp: temps[i] || 10,
            condition: conditions[i] || '晴れ',
            icon: icons[i] || '☀️',
            precipitation: pops[i] || 0
          })
        }
        
        setHourlyForecast(forecast)
        setLoading(false)
      } catch (error) {
        console.error('天気予報の取得に失敗しました:', error)
        setLoading(false)
      }
    }

    fetchForecast()
    const interval = setInterval(fetchForecast, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  if (loading) {
    return (
      <div className="hourly-forecast">
        <div className="hourly-forecast-loading">読み込み中...</div>
      </div>
    )
  }

  // 折れ線グラフ用のデータを準備
  const getGraphData = () => {
    if (hourlyForecast.length === 0) return null
    
    const temps = hourlyForecast.map(f => f.temp)
    const dataMinTemp = Math.min(...temps)
    const dataMaxTemp = Math.max(...temps)
    
    // グラフの表示範囲を最高気温+2度、最低気温-2度に設定
    const minTemp = dataMinTemp - 2
    const maxTemp = dataMaxTemp + 2
    const tempRange = maxTemp - minTemp || 1 // 0除算を防ぐ
    
    // グラフの高さとマージン（余白を最小限に）
    const graphHeight = 200
    const graphPadding = 5 // 余白を最小限に
    const graphWidth = 90 * hourlyForecast.length // 各ポイント間の距離（10項目用に調整）
    
    // 各ポイントの座標を計算
    const points = hourlyForecast.map((forecast, index) => {
      const x = index * 90 + 45 // 各ポイントのX座標（10項目用に調整）
      const normalizedTemp = (forecast.temp - minTemp) / tempRange
      const y = graphHeight - (normalizedTemp * (graphHeight - graphPadding * 2)) - graphPadding
      return { x, y, temp: forecast.temp, time: forecast.time }
    })
    
    // 折れ線のパスを生成
    const pathData = points.map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    }).join(' ')
    
    return { points, pathData, minTemp, maxTemp, graphHeight, graphWidth, graphPadding }
  }

  const graphData = getGraphData()

  const currentDate = new Date()

  return (
    <div className="hourly-forecast">
      {graphData && (
        <div className="hourly-forecast-graph-container">
          {/* 日付と位置表示 */}
          <div className="hourly-forecast-header">
            <div className="hourly-forecast-date">
              {format(currentDate, 'yyyy年MM月dd日 (EEEE)', { locale: ja })}
            </div>
            <div className="hourly-forecast-location">
              {prefecture} {city}
            </div>
          </div>
          {/* 折れ線グラフ */}
          <div className="hourly-forecast-graph-wrapper">
            <svg 
              className="hourly-forecast-graph" 
              viewBox={`0 0 ${graphData.graphWidth} ${graphData.graphHeight + 50}`}
              preserveAspectRatio="none"
            >
              {/* グリッド線 */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = graphData.graphHeight - (ratio * (graphData.graphHeight - graphData.graphPadding * 2)) - graphData.graphPadding
                const temp = Math.round(graphData.minTemp + (graphData.maxTemp - graphData.minTemp) * ratio)
                return (
                  <g key={ratio}>
                    <line
                      x1="0"
                      y1={y}
                      x2={graphData.graphWidth}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y={y + 5}
                      fill="rgba(255, 255, 255, 0.6)"
                      fontSize="12"
                      fontFamily="'Noto Sans JP', sans-serif"
                    >
                      {temp}°
                    </text>
                  </g>
                )
              })}
              
              {/* 折れ線 */}
              <path
                d={graphData.pathData}
                fill="none"
                stroke="#4dabf7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* ポイントと気温表示、時刻表示 */}
              {graphData.points.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="#4dabf7"
                    stroke="#fff"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
                  />
                  <text
                    x={point.x}
                    y={point.y - 20}
                    fill="#fff"
                    fontSize="18"
                    fontWeight="800"
                    textAnchor="middle"
                    fontFamily="'Noto Sans JP', sans-serif"
                    style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 8px rgba(77, 171, 247, 0.5)'
                    }}
                  >
                    {point.temp}°
                  </text>
                  <text
                    x={point.x}
                    y={graphData.graphHeight + 25}
                    fill="rgba(255, 255, 255, 0.9)"
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                    fontFamily="'Noto Sans JP', sans-serif"
                    style={{
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {format(point.time, 'HH時')}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          
          {/* 天気情報（グラフの下に統合） */}
          <div className="hourly-forecast-list">
            {hourlyForecast.map((forecast, index) => (
              <div key={index} className="hourly-forecast-item">
                <div className="hourly-forecast-icon">{forecast.icon}</div>
                <div className="hourly-forecast-condition">{forecast.condition}</div>
                <div className="hourly-forecast-precipitation">💧{forecast.precipitation}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HourlyForecast

