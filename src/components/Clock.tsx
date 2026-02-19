import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import ja from 'date-fns/locale/ja'
import { getSettings } from './Settings'
import WeatherIcon from './WeatherIcon'
import './Clock.css'

interface WeatherData {
  temp: number // 現在の気温または最高気温
  maxTemp?: number // 最高気温
  minTemp?: number // 最低気温
  condition: string
  icon: string
  weatherCode?: string // 天気コード（WeatherIcon用）
  precipitation: number // 降水確率（%）
  // 今日と明日の天気
  today?: {
    condition: string
    icon: string
    weatherCode?: string // 天気コード（WeatherIcon用）
    maxTemp?: number
    minTemp?: number
    precipitation?: number
  }
  tomorrow?: {
    condition: string
    icon: string
    weatherCode?: string // 天気コード（WeatherIcon用）
    maxTemp?: number
    minTemp?: number
    precipitation?: number
  }
}

interface WarningInfo {
  title: string
  status: string // '警報' | '注意報'
  kind: string // 警報の種類（例: '大雨', '洪水'など）
}

interface ClockProps {
  showTimeOnly?: boolean
}

interface WeeklyWeatherItem {
  date: string
  condition?: string
  icon?: string
  maxTemp?: number
  minTemp?: number
  rainProbability?: number
}

const Clock = ({ showTimeOnly = false }: ClockProps = {}) => {
  const [time, setTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')
  const [_warnings, setWarnings] = useState<WarningInfo[]>([])
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeatherItem[]>([])

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

  useEffect(() => {
    // 初期時刻を設定
    setTime(new Date())
    
    // 1秒ごとに更新（ドリフト補正付き）
    let expectedTime = Date.now() + 1000
    const timer = setInterval(() => {
      const now = Date.now()
      const drift = now - expectedTime
      
      // ドリフトが大きい場合は即座に修正
      if (Math.abs(drift) > 100) {
        setTime(new Date())
        expectedTime = now + 1000
      } else {
        setTime(new Date())
        expectedTime += 1000
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 警報・注意報を取得する関数
  const fetchWarnings = async (): Promise<WarningInfo[]> => {
    try {
      // 新潟県のエリアコード（150000は新潟県全体、150013は下越地方）
      const areaCodes = ['150000', '150013'] // 新潟県全体と下越地方を試す
      
      const areaWarnings: WarningInfo[] = []
      
      // 複数のエリアコードを試す
      for (const areaCode of areaCodes) {
        try {
          // 気象庁の警報・注意報API（詳細版）
          let warningResponse = await fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${areaCode}.json`)
          
          if (!warningResponse.ok) {
            // 詳細版が失敗した場合は概要版を試す
            warningResponse = await fetch(`https://www.jma.go.jp/bosai/warning/data/overview_warning/${areaCode}.json`)
          }
          
          if (warningResponse.ok) {
            const warningData = await warningResponse.json()
            console.log(`警報データ (${areaCode}):`, warningData)
            
            if (warningData && typeof warningData === 'object') {
              // 気象庁APIの構造: { "150013": { "0": { "areas": [...] } } }
              Object.keys(warningData).forEach((regionCode) => {
                const regionData = warningData[regionCode]
                
                if (regionData && typeof regionData === 'object') {
                  // タイムスタンプキー（通常 "0" が最新）を取得
                  Object.keys(regionData).forEach((timeKey) => {
                    const timeData = regionData[timeKey]
                    
                    if (timeData && timeData.areas && Array.isArray(timeData.areas)) {
                      // 各エリアを処理
                      timeData.areas.forEach((area: any) => {
                        // 新発田市を含むエリアを探す（コード 1510150 または名前で判定）
                        const areaName = area.name || ''
                        const areaCodeValue = area.code || ''
                        const isShibataArea = areaName.includes('新発田') || areaCodeValue === '1510150'
                        
                        if (area.warnings && typeof area.warnings === 'object') {
                          // 警告の種類ごとに処理
                          Object.keys(area.warnings).forEach((warningTypeKey) => {
                            const warningArray = area.warnings[warningTypeKey]
                            
                            if (Array.isArray(warningArray)) {
                              warningArray.forEach((warning: any) => {
                                if (warning && typeof warning === 'object') {
                                  const status = warning.status || ''
                                  const kindName = warning.kindName || warning.kind || ''
                                  
                                  // 警報または注意報の場合
                                  if ((status === '警報' || status === '注意報') && kindName) {
                                    // 新発田市のエリアのみ、またはすべてのエリアから取得
                                    if (isShibataArea || areaCodes.length === 1) {
                                      areaWarnings.push({
                                        title: kindName,
                                        status: status,
                                        kind: kindName
                                      })
                                    }
                                  }
                                }
                              })
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          }
        } catch (error) {
          console.error(`エリアコード ${areaCode} の警報取得エラー:`, error)
        }
      }
      
      // 重複を除去（同じ種類の警報が複数ある場合）
      const uniqueWarnings = areaWarnings.filter((warning, index, self) =>
        index === self.findIndex((w) => w.kind === warning.kind && w.status === warning.status)
      )
      
      console.log('抽出された警報:', uniqueWarnings)
      return uniqueWarnings
    } catch (error) {
      console.error('警報・注意報の取得に失敗しました:', error)
      return []
    }
  }

  // 天気情報を取得
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const lat = 37.95
        const lon = 139.33
        const areaCode = '150000'
        
        // ウェザーニューズAPIを試行（APIキーが必要な場合はエラーになる）
        const weathernewsApiKey = import.meta.env.VITE_WEATHERNEWS_API_KEY || ''
        if (weathernewsApiKey) {
          try {
            const weathernewsResponse = await fetch(
              `https://api.wxtech.weathernews.com/api/v1/ss1wx?lat=${lat}&lon=${lon}`,
              {
                headers: {
                  'X-API-Key': weathernewsApiKey
                }
              }
            )
            
            if (weathernewsResponse.ok) {
              const weathernewsData = await weathernewsResponse.json()
              
              if (weathernewsData.wxdata && weathernewsData.wxdata.length > 0) {
                const wx = weathernewsData.wxdata[0]
                const srf = wx.srf || [] // 短期予報
                const mrf = wx.mrf || [] // 中期予報
                
                // 今日のデータを取得
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                // 短期予報から現在時刻に最も近いデータを取得
                let currentForecast = srf[0]
                if (srf.length > 0) {
                  const now = new Date()
                  currentForecast = srf.reduce((prev: any, curr: any) => {
                    const prevTime = Math.abs(new Date(prev.date).getTime() - now.getTime())
                    const currTime = Math.abs(new Date(curr.date).getTime() - now.getTime())
                    return currTime < prevTime ? curr : prev
                  })
                }
                
                // 中期予報から今日のデータを取得
                let todayForecast = mrf.find((f: any) => {
                  const forecastDate = new Date(f.date)
                  forecastDate.setHours(0, 0, 0, 0)
                  return forecastDate.getTime() === today.getTime()
                }) || mrf[0]
                
                const getWeatherCondition = (wxCode: number) => {
                  if (wxCode >= 100 && wxCode < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (wxCode >= 200 && wxCode < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (wxCode >= 300 && wxCode < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (wxCode >= 400 && wxCode < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                const wxCode = currentForecast?.wx || todayForecast?.wx || 100
                const weatherInfo = getWeatherCondition(wxCode)
                const maxTemp = todayForecast?.maxtemp || currentForecast?.temp
                const minTemp = todayForecast?.mintemp
                const precipitation = todayForecast?.pop || 0
                
                setWeather({
                  temp: currentForecast?.temp || maxTemp || 12,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: weatherInfo.condition,
                  icon: weatherInfo.icon,
                  weatherCode: String(wxCode),
                  precipitation: precipitation
                })
                
                // 警報・注意報も取得
                const warningsData = await fetchWarnings()
                setWarnings(warningsData)
                
                // 今日の気温をlocalStorageに保存
                try {
                  const today = new Date()
                  const weatherData = {
                    date: today.toISOString(),
                    maxTemp: maxTemp,
                    minTemp: minTemp
                  }
                  localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
                } catch (e) {
                  // localStorageの保存エラーは無視
                }
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: weatherInfo.condition } 
                }))
                return
              }
            }
          } catch (weathernewsError) {
            console.log('ウェザーニューズAPIエラー:', weathernewsError)
            // フォールバック処理に進む
          }
        }
        
        // 気象庁のXMLフィードから新潟の天気予報を取得
        try {
          const feedResponse = await fetch('https://www.data.jma.go.jp/developer/xml/feed/regular_l.xml')
          if (feedResponse.ok) {
            const feedText = await feedResponse.text()
            const parser = new DOMParser()
            const feedDoc = parser.parseFromString(feedText, 'text/xml')
            
            // 新潟県の府県天気予報のリンクを探す
            const entries = feedDoc.querySelectorAll('entry')
            let niigataForecastUrl: string | null = null
            
            for (const entry of Array.from(entries)) {
              const title = entry.querySelector('title')?.textContent
              const link = entry.querySelector('link[type="application/xml"]')?.getAttribute('href')
              
              if (title?.includes('府県天気予報') && link?.includes('_150000.xml')) {
                niigataForecastUrl = link
                break
              }
            }
            
            // 新潟県の天気予報XMLを取得
            if (niigataForecastUrl) {
              const forecastXmlResponse = await fetch(niigataForecastUrl)
              if (forecastXmlResponse.ok) {
                const forecastXmlText = await forecastXmlResponse.text()
                const forecastDoc = parser.parseFromString(forecastXmlText, 'text/xml')
                
                // XMLから天気情報を抽出
                const timeSeries = forecastDoc.querySelector('TimeSeries')
                if (timeSeries) {
                  const weatherParts = timeSeries.querySelectorAll('WeatherPart')
                  const temps = timeSeries.querySelectorAll('Temperature')
                  
                  // 今日の天気を取得
                  if (weatherParts.length > 0) {
                    const todayWeather = weatherParts[0]
                    const weatherCode = todayWeather.querySelector('WeatherCode')?.textContent || '100'
                    // 気温を取得
                    let maxTemp: number | undefined
                    let minTemp: number | undefined
                    temps.forEach((temp) => {
                      const type = temp.querySelector('Type')?.textContent
                      const value = temp.querySelector('Value')?.textContent
                      if (type === '最高' && value) {
                        maxTemp = parseInt(value)
                      } else if (type === '最低' && value) {
                        minTemp = parseInt(value)
                      }
                    })
                    
                    const getWeatherCondition = (code: string) => {
                      const codeNum = parseInt(code)
                      if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                      if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                      if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                      if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                      return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                    }
                    
                    const weatherInfo = getWeatherCondition(weatherCode)
                    
                    setWeather({
                      temp: maxTemp || minTemp || 12,
                      maxTemp: maxTemp,
                      minTemp: minTemp,
                      condition: weatherInfo.condition,
                      icon: weatherInfo.icon,
                      weatherCode: weatherCode,
                      precipitation: 0
                    })
                    
                    // 警報・注意報も取得
                    const warningsData = await fetchWarnings()
                    setWarnings(warningsData)
                    
                    window.dispatchEvent(new CustomEvent('weatherChanged', { 
                      detail: { condition: weatherInfo.condition } 
                    }))
                    return
                  }
                }
              }
            }
          }
        } catch (xmlError) {
          console.log('XMLフィードからの取得エラー:', xmlError)
          // フォールバック処理に進む
        }
        
        try {
          const forecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            
            if (forecastData && forecastData.length > 0) {
              const areaData = forecastData[0]
              const timeSeries = areaData.timeSeries?.[0] // 天気と気温
              const timeSeriesPops = areaData.timeSeries?.[1] // 降水確率
              
              if (timeSeries && timeSeries.areas && timeSeries.areas.length > 0) {
                const area = timeSeries.areas[0]
                
                // 天気の解説を作成（複数の時間帯の天気を組み合わせる）
                const getWeatherCondition = (code: string) => {
                  const codeNum = parseInt(code)
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                // 今日の天気予報を取得（複数の時間帯がある場合）
                const weatherCodes = area.weatherCodes || []
                const timeDefines = timeSeries.timeDefines || []
                const temps = area.temps || []
                
                // 降水確率を取得（timeSeries[1]から）
                let pops: string[] = []
                if (timeSeriesPops && timeSeriesPops.areas && timeSeriesPops.areas.length > 0) {
                  const popsArea = timeSeriesPops.areas[0]
                  pops = popsArea.pops || []
                }
                
                // 気温の処理（temps配列には最高気温と最低気温が含まれる可能性がある）
                let maxTemp: number | undefined
                let minTemp: number | undefined
                let currentTemp = 12
                
                if (temps && temps.length > 0) {
                  // 最高気温と最低気温を取得
                  if (temps.length >= 2) {
                    maxTemp = parseInt(temps[0]) // 最高気温
                    minTemp = parseInt(temps[1]) // 最低気温
                    currentTemp = maxTemp // 表示用には最高気温を使用
                  } else if (temps.length === 1) {
                    currentTemp = parseInt(temps[0])
                  }
                }
                
                // 今日と明日の日付を取得
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                
                // 今日と明日の気温を取得（スコープ外で定義）
                let tomorrowMaxTemp: number | undefined
                let tomorrowMinTemp: number | undefined
                
                // 明日の天気コードを取得（スコープ外で定義）
                let tomorrowWeatherCode: string | null = null
                
                // 今日と明日の降水確率を取得（スコープ外で定義）
                let todayPop = 0
                let tomorrowPop = 0
                
                // 明日の気温を取得（temps配列から）
                if (temps && temps.length >= 4) {
                  // temps配列は[今日最高, 今日最低, 明日最高, 明日最低]の形式
                  tomorrowMaxTemp = parseInt(temps[2])
                  tomorrowMinTemp = parseInt(temps[3])
                }
                
                // 今日と明日の降水確率を取得
                if (pops && pops.length > 0 && timeDefines.length > 0) {
                  const todayPops: number[] = []
                  const tomorrowPops: number[] = []
                  for (let i = 0; i < Math.min(pops.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    const popValue = parseInt(pops[i])
                    if (!isNaN(popValue)) {
                      if (timeDefDate.getTime() === today.getTime()) {
                        todayPops.push(popValue)
                      } else if (timeDefDate.getTime() === tomorrow.getTime()) {
                        tomorrowPops.push(popValue)
                      }
                    }
                  }
                  if (todayPops.length > 0) {
                    todayPop = Math.max(...todayPops)
                  }
                  if (tomorrowPops.length > 0) {
                    tomorrowPop = Math.max(...tomorrowPops)
                  }
                }
                
                // 明日の天気コードを取得
                if (weatherCodes.length > 0 && timeDefines.length > 0) {
                  for (let i = 0; i < Math.min(weatherCodes.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    const isTomorrow = timeDefDate.getTime() === tomorrow.getTime()
                    if (isTomorrow && tomorrowWeatherCode === null) {
                      tomorrowWeatherCode = weatherCodes[i]
                    }
                  }
                }
                
                // 今日の天気予報を取得（複数の時間帯を考慮）
                let displayCondition = '晴れ'
                let displayIcon = '☀️'
                let todayWeatherCodeForIcon = '100' // デフォルトは晴れ
                
                // 今日の天気コードから表示用の天気を決定
                if (weatherCodes.length > 0 && timeDefines.length > 0) {
                  // 今日の日付に該当する天気コードを取得
                  const todayWeatherCodes: string[] = []
                  for (let i = 0; i < Math.min(weatherCodes.length, timeDefines.length); i++) {
                    const timeDef = new Date(timeDefines[i])
                    const timeDefDate = new Date(timeDef.getFullYear(), timeDef.getMonth(), timeDef.getDate())
                    if (timeDefDate.getTime() === today.getTime()) {
                      todayWeatherCodes.push(weatherCodes[i])
                    }
                  }
                  
                  if (todayWeatherCodes.length > 0) {
                    // 時間帯の順序を保持して天気を取得
                    interface WeatherItem {
                      order: number
                      text: string
                      code: string
                    }
                    const weatherTexts: WeatherItem[] = []
                    for (let i = 0; i < todayWeatherCodes.length; i++) {
                      const codeIndex = weatherCodes.indexOf(todayWeatherCodes[i])
                      if (codeIndex >= 0 && codeIndex < timeDefines.length) {
                        const timeDef = new Date(timeDefines[codeIndex])
                        const hour = timeDef.getHours()
                        // 時間帯の順序を考慮（午前→午後→夜の順）
                        const timeOrder = hour < 12 ? 0 : hour < 18 ? 1 : 2
                        const weatherInfo = getWeatherCondition(todayWeatherCodes[i])
                        weatherTexts.push({ order: timeOrder, text: weatherInfo.text, code: todayWeatherCodes[i] })
                      }
                    }
                    
                    // 時間帯の順序でソート
                    weatherTexts.sort((a, b) => a.order - b.order)
                    
                    // 重複を除去しつつ順序を保持
                    const uniqueWeathers: string[] = []
                    const seenWeathers = new Set<string>()
                    for (const item of weatherTexts) {
                      if (!seenWeathers.has(item.text)) {
                        uniqueWeathers.push(item.text)
                        seenWeathers.add(item.text)
                      }
                    }
                    
                    // 複数の時間帯で天気が変わる場合は「のち」で結合
                    if (uniqueWeathers.length > 1) {
                      displayCondition = uniqueWeathers.join('のち')
                      // 最後の天気のアイコンを使用
                      const lastWeatherInfo = getWeatherCondition(weatherTexts[weatherTexts.length - 1].code)
                      displayIcon = lastWeatherInfo.icon
                      todayWeatherCodeForIcon = weatherTexts[weatherTexts.length - 1].code
                    } else if (uniqueWeathers.length === 1) {
                      displayCondition = uniqueWeathers[0]
                      const weatherInfo = getWeatherCondition(todayWeatherCodes[0])
                      displayIcon = weatherInfo.icon
                      todayWeatherCodeForIcon = todayWeatherCodes[0]
                    } else {
                      // フォールバック
                      const firstWeatherInfo = getWeatherCondition(todayWeatherCodes[0])
                      displayCondition = firstWeatherInfo.condition
                      displayIcon = firstWeatherInfo.icon
                      todayWeatherCodeForIcon = todayWeatherCodes[0]
                    }
                  } else {
                    // フォールバック: 最初の天気コードを使用
                    const todayWeatherCode = weatherCodes[0]
                    const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                    displayCondition = weatherInfo.condition
                    displayIcon = weatherInfo.icon
                    todayWeatherCodeForIcon = todayWeatherCode || '100'
                  }
                } else {
                  // フォールバック
                  const todayWeatherCode = timeDefines.length > 0 && weatherCodes.length > 0 ? weatherCodes[0] : null
                  const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  displayCondition = weatherInfo.condition
                  displayIcon = weatherInfo.icon
                  todayWeatherCodeForIcon = todayWeatherCode || '100'
                }
                
                // 降水確率を取得（最大値を表示）
                let pop = 0
                if (pops && pops.length > 0) {
                  const popValues = pops.map((p: string) => parseInt(p)).filter((p: number) => !isNaN(p))
                  if (popValues.length > 0) {
                    pop = Math.max(...popValues)
                  }
                }
                
                // 今日の天気情報を構築
                const todayInfo = {
                  condition: displayCondition,
                  icon: displayIcon,
                  weatherCode: todayWeatherCodeForIcon,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  precipitation: todayPop
                }
                
                // 明日の天気情報を構築
                let tomorrowInfo = undefined
                if (tomorrowWeatherCode) {
                  const tomorrowWeatherInfo = getWeatherCondition(tomorrowWeatherCode)
                  tomorrowInfo = {
                    condition: tomorrowWeatherInfo.text,
                    icon: tomorrowWeatherInfo.icon,
                    weatherCode: tomorrowWeatherCode,
                    maxTemp: tomorrowMaxTemp,
                    minTemp: tomorrowMinTemp,
                    precipitation: tomorrowPop
                  }
                }
                
                setWeather({
                  temp: currentTemp,
                  maxTemp: maxTemp,
                  minTemp: minTemp,
                  condition: displayCondition,
                  icon: displayIcon,
                  weatherCode: todayWeatherCodeForIcon,
                  precipitation: pop,
                  today: todayInfo,
                  tomorrow: tomorrowInfo
                })
                
                // 警報・注意報も取得
                const warningsData = await fetchWarnings()
                setWarnings(warningsData)
                
                // 今日の気温をlocalStorageに保存（明日の比較用）
                try {
                  const today = new Date()
                  const weatherData = {
                    date: today.toISOString(),
                    maxTemp: maxTemp,
                    minTemp: minTemp
                  }
                  localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
                } catch (e) {
                  // localStorageの保存エラーは無視
                }
                
                window.dispatchEvent(new CustomEvent('weatherChanged', { 
                  detail: { condition: displayCondition } 
                }))
                return
              }
            }
          }
        } catch (apiError) {
          console.error('気象庁APIエラー:', apiError)
        }
        
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
        
        if (apiKey) {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
          )
          
          if (response.ok) {
            const data = await response.json()
            
            const getWeatherIcon = (condition: string) => {
              if (condition.includes('Rain') || condition.includes('雨')) return '🌧️'
              if (condition.includes('Cloud') || condition.includes('曇')) return '☁️'
              if (condition.includes('Snow') || condition.includes('雪')) return '❄️'
              return '☀️'
            }
            
            const getWeatherCodeFromOpenWeather = (main: string) => {
              // OpenWeatherMapの天気状態から天気コードを推測
              if (main.includes('Rain')) return '300'
              if (main.includes('Snow')) return '400'
              if (main.includes('Cloud')) return '200'
              return '100' // デフォルトは晴れ
            }
            
            // 降水確率を取得（OpenWeatherMapの場合は3時間予報から取得）
            const forecastResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
            )
            
            let precipitation = 0
            if (forecastResponse.ok) {
              const forecastData = await forecastResponse.json()
              if (forecastData.list && forecastData.list.length > 0) {
                precipitation = Math.round(forecastData.list[0].pop * 100) // 降水確率（0-1を0-100に変換）
              }
            }
            
            // 最高気温と最低気温を取得
            const maxTemp = data.main.temp_max ? Math.round(data.main.temp_max) : undefined
            const minTemp = data.main.temp_min ? Math.round(data.main.temp_min) : undefined
            
            const conditionText = data.weather?.[0]?.description || data.weather?.[0]?.main || '晴れ'

            // 今日と明日の天気情報を構築（OpenWeatherMap APIでは簡易版）
            const weatherCode = getWeatherCodeFromOpenWeather(data.weather[0].main)
            const todayInfo = {
              condition: conditionText,
              icon: getWeatherIcon(data.weather[0].main),
              weatherCode: weatherCode,
              maxTemp: maxTemp,
              minTemp: minTemp
            }
            
            setWeather({
              temp: Math.round(data.main.temp),
              maxTemp: maxTemp,
              minTemp: minTemp,
              condition: conditionText,
              icon: getWeatherIcon(data.weather[0].main),
              weatherCode: weatherCode,
              precipitation: precipitation,
              today: todayInfo
            })
            
            // 警報・注意報も取得
            const warningsData = await fetchWarnings()
            setWarnings(warningsData)
            
            // 今日の気温をlocalStorageに保存（明日の比較用）
            try {
              const today = new Date()
              const weatherData = {
                date: today.toISOString(),
                maxTemp: maxTemp,
                minTemp: minTemp
              }
              localStorage.setItem('yesterdayWeather', JSON.stringify(weatherData))
            } catch (e) {
              // localStorageの保存エラーは無視
            }
            
            window.dispatchEvent(new CustomEvent('weatherChanged', { 
              detail: { condition: data.weather[0].main } 
            }))
            return
          }
        }
        
        // フォールバック
        setWeather({
          temp: 12,
          condition: '曇り',
          icon: '☁️',
          weatherCode: '200',
          precipitation: 30,
        })
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
        setWeather({
          temp: 12,
          condition: '曇り',
          icon: '☁️',
          weatherCode: '200',
          precipitation: 30
        })
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000)

    return () => clearInterval(interval)
  }, [prefecture, city])

  // 週間（10日間）天気を取得
  useEffect(() => {
    const fetchWeeklyWeather = async () => {
      try {
        // 都道府県と市町村をクエリパラメータで渡す
        const params = new URLSearchParams({
          prefecture: prefecture || '新潟県',
          city: city || '新潟市'
        })
        const response = await fetch(`/api/nhk-weekly-weather?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          console.error('週間天気取得エラー: status=', response.status)
          return
        }

        const data = await response.json()
        
        console.log('週間天気データ:', data)
        
        if (data.weekly && Array.isArray(data.weekly)) {
          console.log('週間天気取得成功:', data.weekly.length, '件')
          console.log('週間天気データ詳細:', data.weekly.map((w: WeeklyWeatherItem) => ({ 
            date: w.date, 
            maxTemp: w.maxTemp, 
            minTemp: w.minTemp, 
            rainProbability: w.rainProbability 
          })))
          setWeeklyWeather(data.weekly.slice(0, 6)) // 最大6日分
        } else {
          console.log('週間天気データが空または不正な形式')
          // デバッグ用：とりあえず空の配列でも表示エリアを出す
          setWeeklyWeather([])
        }
      } catch (err) {
        console.error('週間天気取得エラー:', err)
        setWeeklyWeather([])
      }
    }

    fetchWeeklyWeather()
    const interval = setInterval(fetchWeeklyWeather, 3600000) // 1時間ごとに更新（Vercel無料枠節約）

    return () => clearInterval(interval)
  }, [prefecture, city])

  // 天気コードから天気タイプを取得する関数
  const getWeatherTypeClass = (code?: string) => {
    if (!code) return 'weather-sunny'
    const codeNum = parseInt(code)
    if (codeNum >= 100 && codeNum < 200) return 'weather-sunny'
    if (codeNum >= 200 && codeNum < 300) return 'weather-cloudy'
    if (codeNum >= 300 && codeNum < 400) return 'weather-rainy'
    if (codeNum >= 400 && codeNum < 500) return 'weather-snowy'
    return 'weather-sunny'
  }

  const getDateLabel = (date: Date) => format(date, 'M/d(E)', { locale: ja })

  const normalizeDateLabel = (label: string) => {
    // 日付ラベルを正規化（0埋めを削除、空白を削除）
    // 例: "01/25(日)" → "1/25(日)", "1/25(日)" → "1/25(日)"
    let normalized = label.replace(/\s+/g, '')
    // 月の0埋めを削除: "01/25" → "1/25"
    normalized = normalized.replace(/^0+(\d+)\//, '$1/')
    // 日の0埋めを削除: "1/05" → "1/5"
    normalized = normalized.replace(/\/(0+)(\d+)/, '/$2')
    return normalized
  }

  const getConditionLabel = (condition?: string) => {
    const trimmed = condition?.trim()
    return trimmed ? trimmed : '天気未取得'
  }

  const getDayCondition = (day: WeeklyWeatherItem, index: number) => {
    if (day.condition) return getConditionLabel(day.condition)
    if (index === 0) return getConditionLabel(weather?.today?.condition ?? weather?.condition)
    if (index === 1) return getConditionLabel(weather?.tomorrow?.condition)
    return '天気未取得'
  }

  const getDayTemps = (day: WeeklyWeatherItem, index: number) => {
    // まずdayオブジェクトから気温を取得
    if (day.maxTemp !== undefined || day.minTemp !== undefined) {
      console.log(`[Clock Debug] getDayTemps: Using day data for index ${index}:`, { maxTemp: day.maxTemp, minTemp: day.minTemp })
      return { maxTemp: day.maxTemp, minTemp: day.minTemp }
    }
    // dayオブジェクトに気温がない場合はフォールバック
    console.log(`[Clock Debug] getDayTemps: Using fallback for index ${index}`)
    if (index === 0) {
      const fallback = { maxTemp: weather?.today?.maxTemp ?? weather?.maxTemp, minTemp: weather?.today?.minTemp ?? weather?.minTemp }
      console.log(`[Clock Debug] getDayTemps: Fallback for today:`, fallback)
      return fallback
    }
    if (index === 1) {
      const fallback = { maxTemp: weather?.tomorrow?.maxTemp, minTemp: weather?.tomorrow?.minTemp }
      console.log(`[Clock Debug] getDayTemps: Fallback for tomorrow:`, fallback)
      return fallback
    }
    return { maxTemp: undefined, minTemp: undefined }
  }

  const getDisplayWeeklyWeather = (): WeeklyWeatherItem[] => {
    const today = new Date()
    const todayLabel = normalizeDateLabel(getDateLabel(today))
    const tomorrowDate = new Date(today)
    tomorrowDate.setDate(today.getDate() + 1)
    const tomorrowLabel = normalizeDateLabel(getDateLabel(tomorrowDate))

    // 「今日」「明日」を優先的にマッチングするマップを作成
    const normalizedMap = new Map<string, WeeklyWeatherItem>()
    
    // 今日と明日の日付ラベルを生成（0埋めなしとありの両方を試す）
    const todayLabelWithZero = normalizeDateLabel(getDateLabel(today).replace(/\/(\d)\//, '/0$1/').replace(/^(\d)\//, '0$1/'))
    const tomorrowLabelWithZero = normalizeDateLabel(getDateLabel(tomorrowDate).replace(/\/(\d)\//, '/0$1/').replace(/^(\d)\//, '0$1/'))
    
    const todayItem = weeklyWeather.find(item => {
      const normalized = normalizeDateLabel(item.date)
      const matches = item.date === '今日' || normalized === todayLabel || normalized === todayLabelWithZero
      if (matches) {
        console.log(`[Clock Debug] Found todayItem:`, { 
          originalDate: item.date, 
          normalized, 
          todayLabel, 
          todayLabelWithZero,
          maxTemp: item.maxTemp,
          minTemp: item.minTemp,
          rainProbability: item.rainProbability
        })
      }
      return matches
    })
    // 明日の日付を数値で取得（月/日）
    const tomorrowMonth = tomorrowDate.getMonth() + 1
    const tomorrowDay = tomorrowDate.getDate()
    
    const tomorrowItem = weeklyWeather.find(item => {
      // 「明日」という文字列でマッチ
      if (item.date === '明日') {
        console.log(`[Clock Debug] Found tomorrowItem by text "明日":`, { 
          originalDate: item.date, 
          maxTemp: item.maxTemp,
          minTemp: item.minTemp,
          rainProbability: item.rainProbability
        })
        return true
      }
      
      // 日付文字列から月と日を抽出
      const dateMatch = item.date.match(/(\d+)\/(\d+)/)
      if (dateMatch) {
        const itemMonth = parseInt(dateMatch[1], 10)
        const itemDay = parseInt(dateMatch[2], 10)
        const matches = itemMonth === tomorrowMonth && itemDay === tomorrowDay
        
        if (matches) {
          console.log(`[Clock Debug] Found tomorrowItem by date match:`, { 
            originalDate: item.date, 
            itemMonth,
            itemDay,
            tomorrowMonth,
            tomorrowDay,
            maxTemp: item.maxTemp,
            minTemp: item.minTemp,
            rainProbability: item.rainProbability
          })
        }
        return matches
      }
      
      // 正規化後の日付でも試す
      const normalized = normalizeDateLabel(item.date)
      const normalizedMatch = normalized.match(/(\d+)\/(\d+)/)
      if (normalizedMatch) {
        const itemMonth = parseInt(normalizedMatch[1], 10)
        const itemDay = parseInt(normalizedMatch[2], 10)
        const matches = itemMonth === tomorrowMonth && itemDay === tomorrowDay
        
        if (matches) {
          console.log(`[Clock Debug] Found tomorrowItem by normalized date match:`, { 
            originalDate: item.date,
            normalized,
            itemMonth,
            itemDay,
            tomorrowMonth,
            tomorrowDay,
            maxTemp: item.maxTemp,
            minTemp: item.minTemp,
            rainProbability: item.rainProbability
          })
        }
        return matches
      }
      
      return false
    })
    
    // デバッグ: すべてのweeklyWeatherアイテムを確認
    console.log('[Clock Debug] All weeklyWeather items:', weeklyWeather.map((w: WeeklyWeatherItem) => {
      const normalized = normalizeDateLabel(w.date)
      return {
        date: w.date,
        normalized,
        maxTemp: w.maxTemp,
        minTemp: w.minTemp,
        rainProbability: w.rainProbability,
        compareToday: {
          normalized,
          todayLabel,
          todayLabelWithZero,
          matches: normalized === todayLabel || normalized === todayLabelWithZero || w.date === '今日'
        },
        compareTomorrow: {
          normalized,
          tomorrowLabel,
          tomorrowLabelWithZero,
          matches: normalized === tomorrowLabel || normalized === tomorrowLabelWithZero || w.date === '明日' || (normalized.match(/^\d+\/\d+/) && tomorrowLabel.match(/^\d+\/\d+/) && normalized.match(/^\d+\/\d+/)?.[0] === tomorrowLabel.match(/^\d+\/\d+/)?.[0])
        }
      }
    }))
    
    const weeklyWeatherDatesDebug = weeklyWeather.map((w: WeeklyWeatherItem) => {
      const normalized = normalizeDateLabel(w.date)
      return {
        date: w.date, 
        normalized, 
        maxTemp: w.maxTemp, 
        minTemp: w.minTemp,
        rainProbability: w.rainProbability,
        matchesToday: normalized === todayLabel || normalized === todayLabelWithZero || w.date === '今日',
        matchesTomorrow: normalized === tomorrowLabel || normalized === tomorrowLabelWithZero || w.date === '明日',
        todayLabel,
        todayLabelWithZero,
        tomorrowLabel,
        tomorrowLabelWithZero
      }
    })
    
    console.log('[Clock Debug] getDisplayWeeklyWeather: Matching items', {
      todayLabel,
      todayLabelWithZero,
      tomorrowLabel,
      tomorrowLabelWithZero,
      todayItem: todayItem ? { date: todayItem.date, normalized: normalizeDateLabel(todayItem.date), maxTemp: todayItem.maxTemp, minTemp: todayItem.minTemp, rainProbability: todayItem.rainProbability } : null,
      tomorrowItem: tomorrowItem ? { date: tomorrowItem.date, normalized: normalizeDateLabel(tomorrowItem.date), maxTemp: tomorrowItem.maxTemp, minTemp: tomorrowItem.minTemp, rainProbability: tomorrowItem.rainProbability } : null,
      weeklyWeatherCount: weeklyWeather.length,
      weeklyWeatherDates: weeklyWeatherDatesDebug
    })
    
    // 「今日」「明日」をマップに追加（気温データと降水確率も含める）
    if (todayItem) {
      console.log(`[Clock Debug] Adding todayItem to map:`, { 
        date: todayItem.date, 
        maxTemp: todayItem.maxTemp, 
        minTemp: todayItem.minTemp,
        rainProbability: todayItem.rainProbability 
      })
      normalizedMap.set(todayLabel, { 
        ...todayItem, 
        date: todayLabel,
        maxTemp: todayItem.maxTemp,
        minTemp: todayItem.minTemp,
        rainProbability: todayItem.rainProbability
      })
      // 0埋めありのキーでも追加
      normalizedMap.set(todayLabelWithZero, { 
        ...todayItem, 
        date: todayLabel,
        maxTemp: todayItem.maxTemp,
        minTemp: todayItem.minTemp,
        rainProbability: todayItem.rainProbability
      })
    }
    if (tomorrowItem) {
      console.log(`[Clock Debug] Adding tomorrowItem to map:`, { 
        date: tomorrowItem.date, 
        maxTemp: tomorrowItem.maxTemp, 
        minTemp: tomorrowItem.minTemp,
        rainProbability: tomorrowItem.rainProbability 
      })
      normalizedMap.set(tomorrowLabel, { 
        ...tomorrowItem, 
        date: tomorrowLabel,
        maxTemp: tomorrowItem.maxTemp,
        minTemp: tomorrowItem.minTemp,
        rainProbability: tomorrowItem.rainProbability
      })
      // 0埋めありのキーでも追加
      normalizedMap.set(tomorrowLabelWithZero, { 
        ...tomorrowItem, 
        date: tomorrowLabel,
        maxTemp: tomorrowItem.maxTemp,
        minTemp: tomorrowItem.minTemp,
        rainProbability: tomorrowItem.rainProbability
      })
    } else {
      // tomorrowItemが見つからない場合、weeklyWeatherから直接探す
      console.log(`[Clock Debug] tomorrowItem not found, searching in weeklyWeather directly...`)
      const fallbackTomorrowItem = weeklyWeather.find(item => {
        // 日付文字列から月と日を抽出
        const dateMatch = item.date.match(/(\d+)\/(\d+)/)
        if (dateMatch) {
          const itemMonth = parseInt(dateMatch[1], 10)
          const itemDay = parseInt(dateMatch[2], 10)
          return itemMonth === tomorrowMonth && itemDay === tomorrowDay
        }
        // 正規化後の日付でも試す
        const normalized = normalizeDateLabel(item.date)
        const normalizedMatch = normalized.match(/(\d+)\/(\d+)/)
        if (normalizedMatch) {
          const itemMonth = parseInt(normalizedMatch[1], 10)
          const itemDay = parseInt(normalizedMatch[2], 10)
          return itemMonth === tomorrowMonth && itemDay === tomorrowDay
        }
        return false
      })
      
      if (fallbackTomorrowItem) {
        console.log(`[Clock Debug] Found fallback tomorrowItem:`, { 
          date: fallbackTomorrowItem.date, 
          maxTemp: fallbackTomorrowItem.maxTemp, 
          minTemp: fallbackTomorrowItem.minTemp,
          rainProbability: fallbackTomorrowItem.rainProbability 
        })
        normalizedMap.set(tomorrowLabel, { 
          ...fallbackTomorrowItem, 
          date: tomorrowLabel,
          maxTemp: fallbackTomorrowItem.maxTemp,
          minTemp: fallbackTomorrowItem.minTemp,
          rainProbability: fallbackTomorrowItem.rainProbability
        })
        normalizedMap.set(tomorrowLabelWithZero, { 
          ...fallbackTomorrowItem, 
          date: tomorrowLabel,
          maxTemp: fallbackTomorrowItem.maxTemp,
          minTemp: fallbackTomorrowItem.minTemp,
          rainProbability: fallbackTomorrowItem.rainProbability
        })
      } else {
        console.log(`[Clock Debug] Fallback tomorrowItem also not found. tomorrowMonth=${tomorrowMonth}, tomorrowDay=${tomorrowDay}`)
        console.log(`[Clock Debug] Available dates in weeklyWeather:`, weeklyWeather.map(w => ({ date: w.date, normalized: normalizeDateLabel(w.date) })))
      }
    }
    
    // その他の日付もマップに追加（0埋めなしとありの両方のキーで追加）
    weeklyWeather.forEach((item) => {
      if (item.date !== '今日' && item.date !== '明日') {
        const key = normalizeDateLabel(item.date)
        // 0埋めなしのキーで追加
        if (!normalizedMap.has(key)) {
          normalizedMap.set(key, item)
        }
        // 0埋めありのキーでも追加（互換性のため）
        const keyWithZero = key.replace(/\/(\d)\//, '/0$1/').replace(/^(\d)\//, '0$1/')
        if (keyWithZero !== key && !normalizedMap.has(keyWithZero)) {
          normalizedMap.set(keyWithZero, item)
        }
        // 0埋めなしのキーでも追加（逆方向の互換性）
        const keyWithoutZero = key.replace(/\/0(\d)\//, '/$1/').replace(/^0(\d)\//, '$1/')
        if (keyWithoutZero !== key && !normalizedMap.has(keyWithoutZero)) {
          normalizedMap.set(keyWithoutZero, item)
        }
      }
    })

    return Array.from({ length: 3 }, (_, index): WeeklyWeatherItem => {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      const label = getDateLabel(date)
      const key = normalizeDateLabel(label)
      const keyWithZero = normalizeDateLabel(label.replace(/\/(\d)\//, '/0$1/').replace(/^(\d)\//, '0$1/'))
      
      // まず通常のキーで検索、見つからない場合は0埋めありのキーで検索
      let item = normalizedMap.get(key)
      if (!item) {
        item = normalizedMap.get(keyWithZero)
      }
      // それでも見つからない場合は、逆方向（0埋め削除）で検索
      if (!item && keyWithZero !== key) {
        const keyWithoutZero = keyWithZero.replace(/\/0(\d)\//, '/$1/').replace(/^0(\d)\//, '$1/')
        item = normalizedMap.get(keyWithoutZero)
      }

      console.log(`[Clock Debug] getDisplayWeeklyWeather: index ${index}, label="${label}", key="${key}", keyWithZero="${keyWithZero}", item=`, item ? { date: item.date, maxTemp: item.maxTemp, minTemp: item.minTemp, rainProbability: item.rainProbability } : null)

      if (item) {
        // 気温データが存在する場合はそのまま返す（dateはlabelに上書き）
        console.log(`[Clock Debug] getDisplayWeeklyWeather: Found item for index ${index}:`, {
          date: item.date,
          label,
          key,
          maxTemp: item.maxTemp,
          minTemp: item.minTemp,
          rainProbability: item.rainProbability,
          hasMaxTemp: item.maxTemp !== undefined,
          hasMinTemp: item.minTemp !== undefined
        })
        if (item.maxTemp !== undefined || item.minTemp !== undefined) {
          console.log(`[Clock Debug] getDisplayWeeklyWeather: Returning item with temps for index ${index}`)
          return { ...item, date: label, maxTemp: item.maxTemp, minTemp: item.minTemp, rainProbability: item.rainProbability }
        }
        // 気温データがない場合はフォールバック
        console.log(`[Clock Debug] getDisplayWeeklyWeather: Item found but no temps for index ${index}, using fallback`)
        const fallbackMax = index === 0 ? (weather?.today?.maxTemp ?? weather?.maxTemp) : (index === 1 ? weather?.tomorrow?.maxTemp : undefined)
        const fallbackMin = index === 0 ? (weather?.today?.minTemp ?? weather?.minTemp) : (index === 1 ? weather?.tomorrow?.minTemp : undefined)
        return {
          date: label,
          condition: item.condition || getConditionLabel(index === 0 ? (weather?.today?.condition ?? weather?.condition) : (index === 1 ? weather?.tomorrow?.condition : undefined)),
          maxTemp: fallbackMax,
          minTemp: fallbackMin,
          rainProbability: item.rainProbability
        }
      }

      // マップにない場合はフォールバック
      if (index === 0) {
        return {
          date: label,
          condition: getConditionLabel(weather?.today?.condition ?? weather?.condition),
          maxTemp: weather?.today?.maxTemp ?? weather?.maxTemp,
          minTemp: weather?.today?.minTemp ?? weather?.minTemp,
          rainProbability: undefined
        }
      }

      if (index === 1) {
        return {
          date: label,
          condition: getConditionLabel(weather?.tomorrow?.condition),
          maxTemp: weather?.tomorrow?.maxTemp,
          minTemp: weather?.tomorrow?.minTemp,
          rainProbability: undefined
        }
      }

      return {
        date: label,
        condition: '天気未取得',
        maxTemp: undefined,
        minTemp: undefined,
        rainProbability: undefined
      }
    })
  }

  // 時刻のみ表示モード（今日と明日の天気も表示）
  if (showTimeOnly) {
    console.log('[Clock Debug] showTimeOnly mode - 週間天気予報表示中')
    console.log('[Clock Debug] weather data:', { 
      hasWeather: !!weather, 
      hasToday: !!weather?.today, 
      hasTomorrow: !!weather?.tomorrow,
      weeklyWeatherCount: weeklyWeather.length,
      weeklyWeather: weeklyWeather
    })
    const displayWeekly = getDisplayWeeklyWeather()
    console.log('[Clock Debug] displayWeekly:', displayWeekly.map((day, idx) => ({
      index: idx,
      date: day.date,
      condition: day.condition,
      maxTemp: 'maxTemp' in day ? day.maxTemp : undefined,
      minTemp: 'minTemp' in day ? day.minTemp : undefined,
      rainProbability: 'rainProbability' in day ? day.rainProbability : undefined
    })))

    return (
      <div className="clock clock-time-only">
        <div className="clock-time-section">
          <div className="clock-date-large">
            {format(time, 'yyyy年M月d日', { locale: ja })} {format(time, 'EEEE', { locale: ja })}
          </div>
          <div className="clock-time-large">
            {format(time, 'HH:mm:ss')}
          </div>
        </div>
        <div className="clock-weekly-weather">
          {displayWeekly.length === 0 ? (
            <div className="clock-weekly-weather-loading">週間天気を取得中...</div>
          ) : (
            <div className="clock-weekly-weather-list">
              {displayWeekly.map((day, index) => {
                const temps = getDayTemps(day, index)
                // 日付ラベルから曜日を削除（M/d形式のみ）
                let displayDate = day.date
                // 曜日部分を削除（括弧とその中身を削除）
                displayDate = displayDate.replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '').trim()
                // 日付が空の場合は、現在の日付から生成
                if (!displayDate || displayDate.length < 2) {
                  const date = new Date()
                  date.setDate(date.getDate() + index)
                  displayDate = format(date, 'M/d', { locale: ja })
                }
                // 曜日を取得
                const date = new Date()
                date.setDate(date.getDate() + index)
                const weekday = format(date, 'E', { locale: ja })
                console.log(`[Clock Debug] Day ${index}:`, {
                  date: day.date,
                  displayDate,
                  weekday,
                  maxTemp: 'maxTemp' in day ? day.maxTemp : undefined,
                  minTemp: 'minTemp' in day ? day.minTemp : undefined,
                  tempsMax: temps.maxTemp,
                  tempsMin: temps.minTemp
                })
                return (
                  <div key={`${day.date}-${index}`} className="clock-weekly-weather-item">
                    <div className="clock-weekly-weather-date-wrapper">
                      <div className="clock-weekly-weather-date">{displayDate}</div>
                      <div className="clock-weekly-weather-weekday">({weekday})</div>
                    </div>
                    <div className="clock-weekly-weather-condition">
                      {getDayCondition(day, index)}
                    </div>
                    <div className="clock-weekly-weather-temps-wrapper">
                      {day.rainProbability !== undefined && (
                        <span className="clock-weekly-weather-rain">
                          {day.rainProbability}%
                        </span>
                      )}
                      <div className="clock-weekly-weather-temps">
                        <span className="clock-weekly-weather-max">
                          {temps.maxTemp !== undefined ? `${temps.maxTemp}°` : '--'}
                        </span>
                        <span className="clock-weekly-weather-separator">/</span>
                        <span className="clock-weekly-weather-min">
                          {temps.minTemp !== undefined ? `${temps.minTemp}°` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 通常モード（時刻と天気の両方）
  return (
    <div className="clock clock-large">
      {/* 左上: 日付 */}
      <div className="clock-location">
        <div className="clock-location-date">
          {format(time, 'yyyy年M月d日', { locale: ja })} {format(time, 'EEEE', { locale: ja })}
        </div>
      </div>
      
      <div className="clock-time-section">
        <div className="clock-time">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>
      {weather && (
        <div className="clock-weather-summary">
          {/* 今日と明日の天気表示 */}
          <div className="clock-weather-today-tomorrow">
            {weather.today && (
              <div className={`clock-weather-day-card today ${getWeatherTypeClass(weather.today.weatherCode)}`}>
                <div className="clock-weather-day-background">
                  <WeatherIcon code={weather.today.weatherCode || '100'} size={200} className="weather-background-icon" />
                </div>
                <div className="clock-weather-day-content">
                  <div className="clock-weather-day-label">今日</div>
                  <div className="clock-weather-day-condition">{weather.today.condition}</div>
                </div>
              </div>
            )}
            {weather.tomorrow && (
              <div className={`clock-weather-day-card tomorrow ${getWeatherTypeClass(weather.tomorrow.weatherCode)}`}>
                <div className="clock-weather-day-background">
                  <WeatherIcon code={weather.tomorrow.weatherCode || '100'} size={200} className="weather-background-icon" />
                </div>
                <div className="clock-weather-day-content">
                  <div className="clock-weather-day-label">明日</div>
                  <div className="clock-weather-day-condition">{weather.tomorrow.condition}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Clock
