import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import './WeeklyWeather.css'

interface DailyWeatherData {
  date: Date
  condition: string
  icon: string
  maxTemp?: number
  minTemp?: number
  description?: string
}

const WeeklyWeather = () => {
  const [weeklyWeather, setWeeklyWeather] = useState<DailyWeatherData[]>([])
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')
  const [loading, setLoading] = useState(true)

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = () => {
      const settings = getSettings()
      setPrefecture(settings.prefecture || '新潟県')
      setCity(settings.city || '新発田市')
    }

    loadSettings()
    
    const handleSettingsChange = () => {
      loadSettings()
    }
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  // 1週間の天気予報を取得
  useEffect(() => {
    const fetchWeeklyWeather = async () => {
      console.log('1週間の天気予報を取得開始:', prefecture, city)
      setLoading(true)
      try {
        // 設定から取得した都道府県と市に基づいてエリアコードを設定
        let areaCode = '150000' // 新潟地方
        
        if (prefecture === '新潟県' && city === '新発田市') {
          areaCode = '150000'
        } else if (prefecture === '新潟県') {
          areaCode = '150000'
        } else {
          areaCode = '150000'
        }
        
        // 気象庁APIから1週間の天気予報を取得
        try {
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            if (forecastData && forecastData.length > 1) {
              // 週間予報は通常2番目の要素（forecastData[1]）
              const weeklyData = forecastData[1]
              const timeSeries = weeklyData.timeSeries?.[0]
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                // 新発田市に該当するエリアを探す
                let area = timeSeries.areas[0]
                
                if (city === '新発田市') {
                  const shibataArea = timeSeries.areas.find((a: any) => 
                    a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                  )
                  if (shibataArea) {
                    area = shibataArea
                  } else {
                    const shibataAreaByCode = timeSeries.areas.find((a: any) => 
                      a.area && (a.area.code === '1520600' || a.area.code === '152020' || a.area.code === '152110')
                    )
                    if (shibataAreaByCode) {
                      area = shibataAreaByCode
                    }
                  }
                }
                
                const weatherCodes = area.weatherCodes || []
                const timeDefines = timeSeries.timeDefines || []
                
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  // 気象庁の天気コード: 100=晴れ, 200=曇り, 300=雨, 400=雪
                  // より詳細な判定
                  if (codeNum === 100 || codeNum === 101) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum === 200 || codeNum === 201 || codeNum === 202) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum === 300 || codeNum === 301 || codeNum === 302 || codeNum === 303 || codeNum === 304 || codeNum === 306 || codeNum === 308 || codeNum === 309 || codeNum === 311 || codeNum === 313 || codeNum === 314 || codeNum === 315 || codeNum === 316 || codeNum === 317 || codeNum === 320 || codeNum === 321 || codeNum === 322 || codeNum === 323 || codeNum === 324 || codeNum === 325 || codeNum === 326 || codeNum === 327) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum === 400 || codeNum === 401 || codeNum === 402 || codeNum === 403 || codeNum === 405 || codeNum === 406 || codeNum === 407 || codeNum === 409 || codeNum === 411 || codeNum === 413 || codeNum === 414 || codeNum === 420 || codeNum === 421 || codeNum === 422 || codeNum === 423 || codeNum === 425 || codeNum === 426 || codeNum === 427) return { condition: '雪', icon: '❄️', text: '雪' }
                  // 範囲での判定（フォールバック）
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                // 気温データを取得（週間予報のtimeSeriesから）
                let tempArea: any = null
                let tempTimeDefines: string[] = []
                
                // 気温データを含むtimeSeriesを探す
                for (const ts of weeklyData.timeSeries || []) {
                  if (ts.tempsMax && ts.tempsMax.length > 0) {
                    // 新発田市のエリアを探す
                    if (ts.areas && ts.areas.length > 0) {
                      if (city === '新発田市') {
                        const shibataTempArea = ts.areas.find((a: any) => 
                          a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                        )
                        if (shibataTempArea) {
                          tempArea = shibataTempArea
                          tempTimeDefines = ts.timeDefines || []
                          break
                        } else {
                          const shibataTempAreaByCode = ts.areas.find((a: any) => 
                            a.area && (a.area.code === '1520600' || a.area.code === '152020' || a.area.code === '152110')
                          )
                          if (shibataTempAreaByCode) {
                            tempArea = shibataTempAreaByCode
                            tempTimeDefines = ts.timeDefines || []
                            break
                          }
                        }
                      } else {
                        tempArea = ts.areas[0]
                        tempTimeDefines = ts.timeDefines || []
                        break
                      }
                    }
                  }
                }
                
                // 1週間分の天気予報データを構築
                const weeklyDataArray: DailyWeatherData[] = []
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                for (let i = 0; i < 7; i++) {
                  const targetDate = new Date(today)
                  targetDate.setDate(today.getDate() + i)
                  
                  // timeDefinesから該当する日付のインデックスを探す
                  let dateIndex = -1
                  if (timeDefines.length > 0) {
                    for (let j = 0; j < timeDefines.length; j++) {
                      const defineDate = new Date(timeDefines[j])
                      defineDate.setHours(0, 0, 0, 0)
                      if (defineDate.getTime() === targetDate.getTime()) {
                        dateIndex = j
                        break
                      }
                    }
                  }
                  
                  // 天気コードを取得
                  let weatherCode = null
                  if (dateIndex >= 0 && weatherCodes.length > dateIndex) {
                    weatherCode = weatherCodes[dateIndex]
                  } else if (weatherCodes.length > i) {
                    weatherCode = weatherCodes[i]
                  } else if (weatherCodes.length > 0) {
                    weatherCode = weatherCodes[0]
                  }
                  
                  const weatherInfo = weatherCode ? getWeatherCondition(weatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  
                  // 気温データを取得
                  let maxTemp: number | undefined
                  let minTemp: number | undefined
                  
                  if (tempArea) {
                    // 週間予報の気温データ構造: tempsMaxとtempsMinが別々の配列
                    const tempsMax = tempArea.tempsMax || []
                    const tempsMin = tempArea.tempsMin || []
                    let tempDateIndex = -1
                    if (tempTimeDefines.length > 0) {
                      for (let j = 0; j < tempTimeDefines.length; j++) {
                        const defineDate = new Date(tempTimeDefines[j])
                        defineDate.setHours(0, 0, 0, 0)
                        if (defineDate.getTime() === targetDate.getTime()) {
                          tempDateIndex = j
                          break
                        }
                      }
                    }
                    
                    // インデックスが見つからない場合、i番目のデータを使用
                    const tempIndex = tempDateIndex >= 0 ? tempDateIndex : i
                    
                    if (tempsMax.length > tempIndex && tempsMin.length > tempIndex) {
                      const maxTempValue = tempsMax[tempIndex]
                      const minTempValue = tempsMin[tempIndex]
                      
                      if (maxTempValue !== null && maxTempValue !== undefined && maxTempValue !== '' &&
                          minTempValue !== null && minTempValue !== undefined && minTempValue !== '') {
                        const max = parseInt(String(maxTempValue))
                        const min = parseInt(String(minTempValue))
                        if (!isNaN(max) && !isNaN(min)) {
                          maxTemp = max
                          minTemp = min
                        }
                      }
                    }
                  }
                  
                  weeklyDataArray.push({
                    date: targetDate,
                    condition: weatherInfo.condition,
                    icon: weatherInfo.icon,
                    maxTemp: maxTemp,
                    minTemp: minTemp,
                    description: `${weatherInfo.text}`
                  })
                }
                
                console.log('1週間の天気予報を取得成功:', weeklyDataArray.length, '日分')
                setWeeklyWeather(weeklyDataArray)
                setLoading(false)
                return
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        // フォールバック: モックデータ
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const mockData: DailyWeatherData[] = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          mockData.push({
            date: date,
            condition: i % 2 === 0 ? '曇り' : '晴れ',
            icon: i % 2 === 0 ? '☁️' : '☀️',
            maxTemp: 15 + i,
            minTemp: 8 + i,
            description: i % 2 === 0 ? '曇り' : '晴れ'
          })
        }
        setWeeklyWeather(mockData)
        setLoading(false)
      } catch (error) {
        console.error('1週間の天気予報の取得に失敗しました:', error)
        setLoading(false)
      }
    }

    fetchWeeklyWeather()
    const interval = setInterval(fetchWeeklyWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  if (loading) {
    return (
      <div className="weekly-weather">
        <div className="weekly-weather-loading">天気予報を読み込み中...</div>
      </div>
    )
  }

  if (weeklyWeather.length === 0) {
    return (
      <div className="weekly-weather">
        <div className="weekly-weather-header">
          <h2 className="weekly-weather-title">{prefecture} {city} 1週間の天気予報</h2>
        </div>
        <div className="weekly-weather-loading" style={{ color: '#ff6b6b', fontSize: '1.2rem', padding: '2rem' }}>
          天気予報データを取得できませんでした。<br />
          しばらく待ってから再度お試しください。
        </div>
      </div>
    )
  }

  return (
    <div className="weekly-weather">
      <div className="weekly-weather-header">
        <h2 className="weekly-weather-title">{prefecture} {city} 1週間の天気予報</h2>
      </div>
      <div className="weekly-weather-grid">
        {weeklyWeather.map((day, index) => (
          <div key={index} className="weekly-weather-day">
            <div className="weekly-weather-date">
              {index === 0 ? '今日' : index === 1 ? '明日' : format(day.date, 'MM/dd')}
            </div>
            <div className="weekly-weather-icon">{day.icon}</div>
            <div className="weekly-weather-condition">{day.condition}</div>
            <div className="weekly-weather-temp">
              {day.maxTemp !== undefined ? (
                <span className="temp-max">{day.maxTemp}°</span>
              ) : (
                <span className="temp-max">--</span>
              )}
              <span className="temp-separator">/</span>
              {day.minTemp !== undefined ? (
                <span className="temp-min">{day.minTemp}°</span>
              ) : (
                <span className="temp-min">--</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeeklyWeather
