import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import './Clock.css'

interface TodayWeatherData {
  condition: string
  icon: string
  maxTemp?: number
  minTemp?: number
  description?: string
  prefecture: string
  city: string
}

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
  precipitation: number
}

const Clock = () => {
  const [time, setTime] = useState(new Date())
  const [todayWeather, setTodayWeather] = useState<TodayWeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')

  // 時刻更新
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  // 天気情報を取得
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 設定から取得した都道府県と市に基づいて座標とエリアコードを設定
        // 新潟県新発田市の座標とエリアコード
        let lat = 37.95
        let lon = 139.33
        let areaCode = '150000' // 新潟地方
        
        // 都道府県と市に応じて座標とエリアコードを変更
        if (prefecture === '新潟県' && city === '新発田市') {
          lat = 37.95
          lon = 139.33
          areaCode = '150000' // 新潟地方
        } else if (prefecture === '新潟県') {
          // 新潟県の他の市の場合
          lat = 37.9161
          lon = 139.0364
          areaCode = '150000' // 新潟地方
        } else {
          // その他の都道府県の場合（デフォルトは新潟県新発田市）
          lat = 37.95
          lon = 139.33
          areaCode = '150000'
        }
        
        // 気象庁APIから本日の天気予報を取得
        try {
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            if (forecastData && forecastData.length > 0) {
              const areaData = forecastData[0]
              const timeSeries = areaData.timeSeries?.[0]
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                // 新発田市に該当するエリアを探す
                // エリア名に「新発田」が含まれるエリアを優先的に選択
                let area = timeSeries.areas[0] // デフォルトは最初のエリア
                
                // 新発田市に該当するエリアを探す
                if (city === '新発田市') {
                  const shibataArea = timeSeries.areas.find((a: any) => 
                    a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                  )
                  if (shibataArea) {
                    area = shibataArea
                    console.log('新発田市の天気エリアを発見（名前）:', area.area?.name, area.area?.code)
                  } else {
                    // エリア名で見つからない場合は、エリアコードで探す
                    // 新発田市のエリアコードは1520600
                    const shibataAreaByCode = timeSeries.areas.find((a: any) => 
                      a.area && (a.area.code === '1520600' || a.area.code === '152020' || a.area.code === '152110')
                    )
                    if (shibataAreaByCode) {
                      area = shibataAreaByCode
                      console.log('新発田市の天気エリアを発見（コード）:', area.area?.name, area.area?.code)
                    }
                  }
                }
                
                const weatherCodes = area.weatherCodes || []
                const temps = area.temps || []
                const timeDefines = timeSeries.timeDefines || []
                
                // 今日の日付を取得
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                // timeDefinesから今日のデータのインデックスを探す
                let todayIndex = 0
                if (timeDefines.length > 0) {
                  for (let i = 0; i < timeDefines.length; i++) {
                    const defineDate = new Date(timeDefines[i])
                    defineDate.setHours(0, 0, 0, 0)
                    if (defineDate.getTime() === today.getTime()) {
                      todayIndex = i
                      break
                    }
                  }
                }
                
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                // 今日の天気コードを取得
                const todayWeatherCode = weatherCodes.length > todayIndex ? weatherCodes[todayIndex] : (weatherCodes.length > 0 ? weatherCodes[0] : null)
                const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                
                // 今日の気温データの取得
                let maxTemp: number | undefined
                let minTemp: number | undefined
                
                // 気象庁APIの構造: timeSeries[1]に気温データがある場合が多い
                // 気温データは通常、最高気温と最低気温が別々の配列として格納される
                // または、最高気温と最低気温が別々のtimeSeriesに格納される場合もある
                // まず、気温データを含むtimeSeriesを探す
                console.log('気温データ取得開始: timeSeries数', areaData.timeSeries?.length)
                for (let tsIndex = 0; tsIndex < (areaData.timeSeries?.length || 0); tsIndex++) {
                  const ts = areaData.timeSeries[tsIndex]
                  if (!ts || !ts.areas || ts.areas.length === 0) continue
                  
                  // このtimeSeriesに気温データがあるか確認
                  const hasTempData = ts.areas.some((a: any) => a.temps && Array.isArray(a.temps) && a.temps.length > 0)
                  if (!hasTempData) continue
                  
                  console.log(`timeSeries[${tsIndex}]に気温データを発見`)
                  
                  // 新発田市に該当するエリアを探す（天気コードと同じロジック）
                  let tempArea = ts.areas[0] // デフォルトは最初のエリア
                  
                  if (city === '新発田市') {
                    const shibataTempArea = ts.areas.find((a: any) => 
                      a.area && (a.area.name && (a.area.name.includes('新発田') || a.area.name.includes('新発田市')))
                    )
                    if (shibataTempArea) {
                      tempArea = shibataTempArea
                      console.log('新発田市の気温エリアを発見（名前）:', tempArea.area?.name, tempArea.area?.code)
                    } else {
                      // エリア名で見つからない場合は、エリアコードで探す
                      // 新発田市のエリアコードは1520600
                      const shibataTempAreaByCode = ts.areas.find((a: any) => 
                        a.area && (a.area.code === '1520600' || a.area.code === '152020' || a.area.code === '152110')
                      )
                      if (shibataTempAreaByCode) {
                        tempArea = shibataTempAreaByCode
                        console.log('新発田市の気温エリアを発見（コード）:', tempArea.area?.name, tempArea.area?.code)
                      }
                    }
                  } else {
                    // その他の市の場合も、エリア名で検索
                    const cityTempArea = ts.areas.find((a: any) => 
                      a.area && (a.area.name && (a.area.name.includes(city) || a.area.name.includes(city.replace('市', ''))))
                    )
                    if (cityTempArea) {
                      tempArea = cityTempArea
                    }
                  }
                  
                  if (tempArea && tempArea.temps && Array.isArray(tempArea.temps)) {
                    const tempTimeDefines = ts.timeDefines || []
                    let tempTodayIndex = 0
                    if (tempTimeDefines.length > 0) {
                      for (let i = 0; i < tempTimeDefines.length; i++) {
                        const defineDate = new Date(tempTimeDefines[i])
                        defineDate.setHours(0, 0, 0, 0)
                        if (defineDate.getTime() === today.getTime()) {
                          tempTodayIndex = i
                          break
                        }
                      }
                    }
                    
                    console.log('気温データ取得試行:', {
                      areaName: tempArea.area?.name,
                      areaCode: tempArea.area?.code,
                      temps: tempArea.temps,
                      tempTimeDefines: tempTimeDefines,
                      tempTodayIndex: tempTodayIndex
                    })
                    
                    // 気象庁APIの構造: 気温データは通常、最高気温と最低気温が交互に格納される
                    // 例: temps[0] = 今日の最高気温, temps[1] = 今日の最低気温, temps[2] = 明日の最高気温, temps[3] = 明日の最低気温
                    // または、timeDefinesのインデックスに対応して格納される場合もある
                    // 今日のデータを取得（tempTodayIndex * 2 が最高気温、tempTodayIndex * 2 + 1 が最低気温の可能性）
                    
                    // まず、今日のインデックスに対応する気温データを取得
                    const todayMaxIndex = tempTodayIndex * 2
                    const todayMinIndex = tempTodayIndex * 2 + 1
                    
                    // 方法1: 交互に格納されている場合
                    if (tempArea.temps.length > todayMaxIndex && tempArea.temps.length > todayMinIndex) {
                      const maxTempValue = tempArea.temps[todayMaxIndex]
                      const minTempValue = tempArea.temps[todayMinIndex]
                      
                      if (maxTempValue !== null && maxTempValue !== undefined && maxTempValue !== '' &&
                          minTempValue !== null && minTempValue !== undefined && minTempValue !== '') {
                        const max = parseInt(String(maxTempValue))
                        const min = parseInt(String(minTempValue))
                        if (!isNaN(max) && !isNaN(min)) {
                          maxTemp = max
                          minTemp = min
                          console.log('気温データ取得成功（交互）:', { maxTemp, minTemp, todayMaxIndex, todayMinIndex })
                        }
                      }
                    }
                    
                    // 方法2: timeDefinesのインデックスに対応している場合
                    if ((maxTemp === undefined || minTemp === undefined) && tempArea.temps.length > tempTodayIndex) {
                      const todayTemp = tempArea.temps[tempTodayIndex]
                      if (todayTemp !== null && todayTemp !== undefined && todayTemp !== '') {
                        const tempValue = parseInt(String(todayTemp))
                        if (!isNaN(tempValue)) {
                          // 単一の値の場合、最高と最低を同じ値として扱う
                          if (maxTemp === undefined) maxTemp = tempValue
                          if (minTemp === undefined) minTemp = tempValue
                          console.log('気温データ取得成功（単一）:', { maxTemp, minTemp, tempTodayIndex })
                        }
                      }
                    }
                    
                    // 方法3: すべての気温データを確認して、最高と最低を探す（フォールバック）
                    if (maxTemp === undefined || minTemp === undefined) {
                      const validTemps = tempArea.temps
                        .filter((_t: any, idx: number) => {
                          // 今日のインデックスに該当するか、または最初のデータが今日の可能性がある
                          return idx === tempTodayIndex || idx === todayMaxIndex || idx === todayMinIndex || (tempTodayIndex === 0 && idx < 2)
                        })
                        .filter((t: any) => t !== null && t !== undefined && t !== '')
                        .map((t: any) => parseInt(String(t)))
                        .filter((t: number) => !isNaN(t))
                      
                      if (validTemps.length > 0) {
                        if (maxTemp === undefined) maxTemp = Math.max(...validTemps)
                        if (minTemp === undefined) minTemp = Math.min(...validTemps)
                        console.log('気温データ取得成功（フォールバック）:', { maxTemp, minTemp, validTemps })
                      }
                    }
                    
                    // データが見つかったらループを抜ける
                    if (maxTemp !== undefined && minTemp !== undefined) {
                      break
                    }
                  }
                }
                
                // 気温データが取得できなかった場合、timeSeries[0]のtempsから今日のデータを取得
                if (maxTemp === undefined && minTemp === undefined && temps && Array.isArray(temps) && temps.length > 0) {
                  const validTemps = temps
                    .filter((_t: any, idx: number) => idx === todayIndex || (todayIndex === 0 && idx === 0))
                    .filter((t: any) => t !== null && t !== undefined && t !== '')
                    .map((t: any) => parseInt(String(t)))
                    .filter((t: number) => !isNaN(t))
                  
                  if (validTemps.length > 0) {
                    maxTemp = Math.max(...validTemps)
                    minTemp = Math.min(...validTemps)
                    console.log('timeSeries[0]から気温データ取得:', { maxTemp, minTemp, validTemps })
                  }
                }
                
                // それでも取得できなかった場合、OpenWeatherMap APIから取得を試す
                if (maxTemp === undefined && minTemp === undefined) {
                  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
                  if (apiKey) {
                    try {
                      const currentResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
                      )
                      
                      if (currentResponse.ok) {
                        const currentData = await currentResponse.json()
                        const currentTemp = Math.round(currentData.main.temp)
                        // 現在の気温から最高・最低を推定（簡易的な方法）
                        maxTemp = currentTemp + 3
                        minTemp = currentTemp - 3
                      }
                    } catch (owmError) {
                      console.error('OpenWeatherMap APIエラー:', owmError)
                    }
                  }
                }
                
                // 無料のルールベース方式で説明を生成（フォールバック）
                const generateRuleBasedDescription = (): string => {
                  const avgTemp = maxTemp !== undefined && minTemp !== undefined ? Math.round((maxTemp + minTemp) / 2) : null
                  
                  // ルールベースで生成したことが分かるようにラベルを付与
                  let description = `【ルール】今日の${prefecture}${city}は${weatherInfo.text}`
                  
                  if (avgTemp !== null) {
                    if (avgTemp >= 25) {
                      description += `。暑い一日になりそうです。熱中症にご注意ください`
                    } else if (avgTemp >= 20) {
                      description += `。過ごしやすい気温です。お出かけに最適な天気です`
                    } else if (avgTemp >= 15) {
                      description += `。少し肌寒いかもしれません。上着があると安心です`
                    } else if (avgTemp >= 10) {
                      description += `。寒い一日になりそうです。暖かい服装でお出かけください`
                    } else {
                      description += `。とても寒い一日になりそうです。防寒対策をしっかりと`
                    }
                  }
                  
                  if (weatherInfo.text === '雨') {
                    description += `。傘をお忘れなく`
                  } else if (weatherInfo.text === '雪') {
                    description += `。路面が滑りやすくなります。お気をつけて`
                  } else if (weatherInfo.text === '曇り') {
                    description += `。雲が多いですが、お出かけには問題ありません`
                  }
                  
                  if (maxTemp !== undefined && minTemp !== undefined) {
                    description += `（最高${maxTemp}度、最低${minTemp}度）`
                  }
                  
                  return description
                }
                
                // 天気の解説をルールベースで生成（AIは使わない）
                const description = generateRuleBasedDescription()

                setTodayWeather({
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  description: description,
                  prefecture: prefecture,
                  city: city
                })
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherInfo.condition } 
                }))
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        // 2時間ごとの予報を取得（OpenWeatherMap API）
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
            
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            // 今日のデータのみをフィルタリング
            const todayForecasts = data.list.filter((item: any) => {
              const itemDate = new Date(item.dt_txt)
              itemDate.setHours(0, 0, 0, 0)
              return itemDate.getTime() === today.getTime()
            })
            
            const forecast: HourlyForecast[] = []
            
            // 今日のデータから2時間ごとの予報を取得（最大6件）
            for (let i = 0; i < Math.min(6, todayForecasts.length); i++) {
              const item = todayForecasts[i]
              const forecastTime = new Date(item.dt_txt)
              
              forecast.push({
                time: forecastTime,
                temp: Math.round(item.main.temp),
                condition: getWeatherCondition(item.weather[0].main),
                icon: getWeatherIcon(item.weather[0].main),
                precipitation: Math.round(item.pop * 100)
              })
            }
            
            setHourlyForecast(forecast)
            return
          }
        }
        
        // フォールバック: モックデータ（説明も生成）
        const mockMaxTemp = 15
        const mockMinTemp = 8
        const mockAvgTemp = Math.round((mockMaxTemp + mockMinTemp) / 2)
        
        let mockDescription = `今日の${prefecture}${city}は曇り`
        if (mockAvgTemp >= 25) {
          mockDescription += `。暑い一日になりそうです。熱中症にご注意ください`
        } else if (mockAvgTemp >= 20) {
          mockDescription += `。過ごしやすい気温です。お出かけに最適な天気です`
        } else if (mockAvgTemp >= 15) {
          mockDescription += `。少し肌寒いかもしれません。上着があると安心です`
        } else if (mockAvgTemp >= 10) {
          mockDescription += `。寒い一日になりそうです。暖かい服装でお出かけください`
        } else {
          mockDescription += `。とても寒い一日になりそうです。防寒対策をしっかりと`
        }
        mockDescription += `。雲が多いですが、お出かけには問題ありません（最高${mockMaxTemp}度、最低${mockMinTemp}度）`
        
        setTodayWeather({
          condition: '曇り',
          icon: '☁️',
          maxTemp: mockMaxTemp,
          minTemp: mockMinTemp,
          description: mockDescription,
          prefecture: prefecture,
          city: city
        })
        
        const now = new Date()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const mockForecast: HourlyForecast[] = []
        
        // 今日の残りの時間から2時間ごとの予報を生成（最大6件）
        let currentHour = now.getHours()
        // 次の偶数時に調整
        if (currentHour % 2 !== 0) {
          currentHour = currentHour + 1
        }
        
        for (let i = 0; i < 6; i++) {
          const forecastTime = new Date(today)
          forecastTime.setHours(currentHour + (i * 2), 0, 0, 0)
          
          // 今日の日付を超えないようにする
          if (forecastTime.getTime() > today.getTime() + 24 * 60 * 60 * 1000) {
            break
          }
          
          mockForecast.push({
            time: forecastTime,
            temp: 12 - i,
            condition: i % 2 === 0 ? '曇り' : '晴れ',
            icon: i % 2 === 0 ? '☁️' : '☀️',
            precipitation: 30 + i * 10
          })
        }
        setHourlyForecast(mockForecast)
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])


  return (
    <div className="clock">
      {/* 上: 日時 */}
      <div className="clock-datetime">
        <div className="clock-date">
          {format(time, 'yyyy年MM月dd日')}
        </div>
        <div className="clock-time">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>

      {/* 下: 天気 */}
      {todayWeather && (
        <div className="clock-weather">
          <div className="clock-weather-summary">
            <div className="clock-weather-main">
              <div className="clock-weather-header">
                <div className="clock-weather-icon">{todayWeather.icon}</div>
                <div className="clock-weather-info">
                  <div className="clock-weather-location">
                    {todayWeather.prefecture} {todayWeather.city}
                  </div>
                  <div className="clock-weather-condition">{todayWeather.condition}</div>
                  {todayWeather.maxTemp !== undefined && todayWeather.minTemp !== undefined && (
                    <div className="clock-weather-temp">
                      <span className="temp-max">{todayWeather.maxTemp}°</span>
                      <span className="temp-separator">/</span>
                      <span className="temp-min">{todayWeather.minTemp}°</span>
                    </div>
                  )}
                </div>
              </div>
              {todayWeather.description && (
                <div className="clock-weather-description">{todayWeather.description}</div>
              )}
            </div>
          </div>

          {/* 2時間ごとの天気と降水確率 */}
          <div className="clock-weather-hourly-list">
            {hourlyForecast.map((forecast, index) => (
              <div key={index} className="clock-weather-hourly-item">
                <div className="clock-weather-hourly-time">{format(forecast.time, 'HH時')}</div>
                <div className="clock-weather-hourly-icon">{forecast.icon}</div>
                <div className="clock-weather-hourly-condition">{forecast.condition}</div>
                <div className="clock-weather-hourly-precipitation">💧{forecast.precipitation}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Clock
