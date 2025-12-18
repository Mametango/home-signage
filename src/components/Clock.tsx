import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { getSettings } from './Settings'
import './Clock.css'

interface HourlyForecast {
  time: Date
  temp: number
  condition: string
  icon: string
  precipitation: number
}

const Clock = () => {
  const [time, setTime] = useState(new Date())
  // 以前は今日の天気表示にも使用していたが、Geminiデバッグ中は非表示のためコメントアウト
  // const [todayWeather, setTodayWeather] = useState<TodayWeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [prefecture, setPrefecture] = useState<string>('新潟県')
  const [city, setCity] = useState<string>('新発田市')
  const [geminiPrompt, setGeminiPrompt] = useState<string>('')
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const [ojisanMessage, setOjisanMessage] = useState<string | null>(null)
  const [ojisanMaxTemp, setOjisanMaxTemp] = useState<number | null>(null)
  const [ojisanMinTemp, setOjisanMinTemp] = useState<number | null>(null)
  const [ojisanHistory, setOjisanHistory] = useState<string[]>([])
  // const [geminiLoading, setGeminiLoading] = useState(false) // 自動問い合わせ状態の管理用（UIでは現在未使用）
  const geminiAutoTriggered = useRef(false)

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
        let cityId = '150020' // 新発田市のlocation ID (weather.tsukumijima.net用)
        
        // 都道府県と市に応じて座標とエリアコードを変更
        if (prefecture === '新潟県' && city === '新発田市') {
          lat = 37.95
          lon = 139.33
          areaCode = '150000' // 新潟地方
          cityId = '150020' // 新発田市
        } else if (prefecture === '新潟県') {
          // 新潟県の他の市の場合
          lat = 37.9161
          lon = 139.0364
          areaCode = '150000' // 新潟地方
          cityId = '150010' // 新潟市（デフォルト）
        } else {
          // その他の都道府県の場合（デフォルトは新潟県新発田市）
          lat = 37.95
          lon = 139.33
          areaCode = '150000'
          cityId = '150020'
        }
        
        // weather.tsukumijima.net APIから天気予報を取得（優先）
        try {
          const tsukumijimaResponse = await fetch(`https://weather.tsukumijima.net/api/forecast/city/${cityId}`)
          
          if (tsukumijimaResponse.ok) {
            const tsukumijimaData = await tsukumijimaResponse.json()
            
            if (tsukumijimaData && tsukumijimaData.forecasts && tsukumijimaData.forecasts.length > 0) {
              // 今日の天気予報を取得（forecasts[0]が今日）
              const todayForecast = tsukumijimaData.forecasts[0]
              
              // 天気コードから天気情報を取得
              const getWeatherCondition = (telop: string) => {
                if (telop.includes('雨') || telop.includes('雷')) return { condition: '雨', icon: '🌧️', text: '雨' }
                if (telop.includes('雪')) return { condition: '雪', icon: '❄️', text: '雪' }
                if (telop.includes('曇')) return { condition: '曇り', icon: '☁️', text: '曇り' }
                return { condition: '晴れ', icon: '☀️', text: '晴れ' }
              }
              
              const weatherInfo = getWeatherCondition(todayForecast.telop || '')
              
              // 最高気温・最低気温を取得
              let maxTemp: number | undefined
              let minTemp: number | undefined
              
              if (todayForecast.temperature && todayForecast.temperature.max) {
                const maxCelsius = todayForecast.temperature.max.celsius
                if (maxCelsius !== null && maxCelsius !== undefined && maxCelsius !== '') {
                  maxTemp = parseInt(String(maxCelsius))
                }
              }
              
              if (todayForecast.temperature && todayForecast.temperature.min) {
                const minCelsius = todayForecast.temperature.min.celsius
                if (minCelsius !== null && minCelsius !== undefined && minCelsius !== '') {
                  minTemp = parseInt(String(minCelsius))
                }
              }
              
              console.log('【デバッグ】weather.tsukumijima.net API取得成功:', {
                telop: todayForecast.telop,
                maxTemp,
                minTemp,
                weatherInfo
              })

              // 無料のルールベース方式で説明を生成して、お天気おじさんのデフォルト発話にする
              const generateRuleBasedDescription = (): string => {
                const avgTemp = maxTemp !== undefined && minTemp !== undefined ? Math.round((maxTemp + minTemp) / 2) : null
                
                let description = `今日の${prefecture}${city}は${weatherInfo.text}で、`
                
                if (avgTemp !== null) {
                  if (avgTemp >= 25) {
                    description += `暑い一日になりそうです。熱中症に注意してください。`
                  } else if (avgTemp >= 20) {
                    description += `過ごしやすい体感でお出かけ日和です。`
                  } else if (avgTemp >= 15) {
                    description += `ややひんやりする時間もあるので、薄手の上着があると安心です。`
                  } else if (avgTemp >= 10) {
                    description += `肌寒い体感になりそうです。暖かい服装がおすすめです。`
                  } else {
                    description += `かなり冷え込みます。マフラーやコートなど防寒対策をしっかり行ってください。`
                  }
                } else {
                  description += `気温は平年並みの見込みです。`
                }
                
                if (weatherInfo.text === '雨') {
                  description += `雨具を持って出かけると安心です。`
                } else if (weatherInfo.text === '雪') {
                  description += `路面の凍結や積雪に注意してください。`
                } else if (weatherInfo.text === '曇り') {
                  description += `日差しは少ないものの、大きな崩れはなさそうです。`
                } else if (weatherInfo.text === '晴れ') {
                  description += `日差しがしっかり届き、洗濯日和になりそうです。`
                }
                
                if (maxTemp !== undefined && minTemp !== undefined) {
                  description += `最高気温は${maxTemp}度前後、最低気温は${minTemp}度前後の見込みです。`
                }
                
                return description
              }

              // Tsukumijimaで最低気温が取れなかった場合、JMAフォールバックを試す
              let finalMaxTemp = maxTemp
              let finalMinTemp = minTemp
              
              // 最低気温が未取得の場合、JMA APIから補完を試みる
              if (finalMinTemp === undefined) {
                try {
                  const jmaForecastResponse = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${areaCode}.json`)
                  if (jmaForecastResponse.ok) {
                    const jmaData = await jmaForecastResponse.json()
                    if (jmaData && jmaData.length > 0) {
                      const jmaAreaData = jmaData[0]
                      const jmaTimeSeries = jmaAreaData.timeSeries?.[0]
                      
                      if (jmaTimeSeries && jmaTimeSeries.areas && jmaTimeSeries.areas.length > 0) {
                        const jmaArea = jmaTimeSeries.areas[0]
                        const jmaTemps = jmaArea.temps || []
                        const jmaTimeDefines = jmaTimeSeries.timeDefines || []
                        
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        let jmaTodayIndex = 0
                        for (let i = 0; i < jmaTimeDefines.length; i++) {
                          const defineDate = new Date(jmaTimeDefines[i])
                          defineDate.setHours(0, 0, 0, 0)
                          if (defineDate.getTime() === today.getTime()) {
                            jmaTodayIndex = i
                            break
                          }
                        }
                        
                        // 気温データは交互に格納されている可能性
                        const jmaTodayMaxIndex = jmaTodayIndex * 2
                        const jmaTodayMinIndex = jmaTodayIndex * 2 + 1
                        
                        if (jmaTemps.length > jmaTodayMinIndex) {
                          const jmaMinValue = jmaTemps[jmaTodayMinIndex]
                          if (jmaMinValue !== null && jmaMinValue !== undefined && jmaMinValue !== '') {
                            const jmaMin = parseInt(String(jmaMinValue))
                            if (!isNaN(jmaMin)) {
                              finalMinTemp = jmaMin
                              console.log('JMA APIから最低気温を補完:', finalMinTemp)
                            }
                          }
                        }
                        
                        if (finalMaxTemp === undefined && jmaTemps.length > jmaTodayMaxIndex) {
                          const jmaMaxValue = jmaTemps[jmaTodayMaxIndex]
                          if (jmaMaxValue !== null && jmaMaxValue !== undefined && jmaMaxValue !== '') {
                            const jmaMax = parseInt(String(jmaMaxValue))
                            if (!isNaN(jmaMax)) {
                              finalMaxTemp = jmaMax
                              console.log('JMA APIから最高気温を補完:', finalMaxTemp)
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (jmaError) {
                  console.error('JMA API補完エラー:', jmaError)
                }
              }

              const ruleText = generateRuleBasedDescription()
              setOjisanMessage(ruleText)
              setOjisanHistory((prev) => [...prev, ruleText])
              setOjisanMaxTemp(finalMaxTemp ?? null)
              setOjisanMinTemp(finalMinTemp ?? null)
              
              // setTodayWeather({
              //   condition: weatherInfo.condition,
              //   icon: weatherInfo.icon,
              //   maxTemp: maxTemp,
              //   minTemp: minTemp,
              //   description: description,
              //   prefecture: prefecture,
              //   city: city
              // })
              
              window.dispatchEvent(new CustomEvent('weatherChanged', { 
                detail: { condition: weatherInfo.condition } 
              }))
              
              // 2時間ごとの予報も取得（OpenWeatherMap API）
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
                }
              }
              
              return // weather.tsukumijima.net APIで成功したら終了
            }
          }
        } catch (tsukumijimaError) {
          console.error('weather.tsukumijima.net APIエラー:', tsukumijimaError)
          // エラーが発生した場合は、従来のJMA APIにフォールバック
        }
        
        // アメダス観測データを取得（新発田市の観測地点コード: 54232）
        let amedasData: any = null
        try {
          // アメダス観測地点一覧を取得して新発田市の地点を探す
          const amedasResponse = await fetch('https://www.jma.go.jp/bosai/amedas/data/map/amedas.json')
          if (amedasResponse.ok) {
            const amedasMapData = await amedasResponse.json()
            // 新発田市の観測地点を探す（緯度経度から近い地点を探す）
            if (amedasMapData && typeof amedasMapData === 'object') {
              let nearestStation: any = null
              let minDistance = Infinity
              
              for (const [stationCode, stationData] of Object.entries(amedasMapData)) {
                const station = stationData as any
                if (station && station.lat && station.lon) {
                  const distance = Math.sqrt(
                    Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2)
                  )
                  if (distance < minDistance) {
                    minDistance = distance
                    nearestStation = { code: stationCode, ...station }
                  }
                }
              }
              
              if (nearestStation) {
                // 最新のアメダス観測データを取得
                const amedasDataResponse = await fetch(
                  `https://www.jma.go.jp/bosai/amedas/data/map/${nearestStation.code}.json`
                )
                if (amedasDataResponse.ok) {
                  amedasData = await amedasDataResponse.json()
                  console.log('アメダス観測データ取得成功:', nearestStation.code, nearestStation.name)
                }
              }
            }
          }
        } catch (amedasError) {
          console.error('アメダスデータ取得エラー:', amedasError)
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
                  // 気象庁の天気コード: 100=晴れ, 200=曇り, 300=雨, 400=雪
                  // より詳細な判定（雨のコードを優先的に判定）
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  // フォールバック: 範囲での判定
                  if (codeNum >= 100 && codeNum < 200) return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                  if (codeNum >= 200 && codeNum < 300) return { condition: '曇り', icon: '☁️', text: '曇り' }
                  if (codeNum >= 300 && codeNum < 400) return { condition: '雨', icon: '🌧️', text: '雨' }
                  if (codeNum >= 400 && codeNum < 500) return { condition: '雪', icon: '❄️', text: '雪' }
                  return { condition: '晴れ', icon: '☀️', text: '晴れ' }
                }
                
                // 今日の天気コードを取得
                const todayWeatherCode = weatherCodes.length > todayIndex ? weatherCodes[todayIndex] : (weatherCodes.length > 0 ? weatherCodes[0] : null)
                console.log('【デバッグ】今日の天気コード:', {
                  todayIndex,
                  weatherCodes,
                  todayWeatherCode,
                  timeDefines: timeDefines.map((d: string) => new Date(d).toLocaleDateString())
                })
                const weatherInfo = todayWeatherCode ? getWeatherCondition(todayWeatherCode) : { condition: '晴れ', icon: '☀️', text: '晴れ' }
                console.log('【デバッグ】天気情報:', weatherInfo)
                
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
                
                // アメダス観測データから現在の気温を取得（予報より優先）
                if (amedasData && amedasData.temp) {
                  const currentTemp = parseFloat(amedasData.temp)
                  if (!isNaN(currentTemp)) {
                    // アメダスの現在気温を取得
                    // 最高・最低気温が未取得の場合、現在気温から推定
                    if (maxTemp === undefined) {
                      maxTemp = Math.round(currentTemp + 2)
                    }
                    if (minTemp === undefined) {
                      minTemp = Math.round(currentTemp - 2)
                    }
                    console.log('アメダス観測データから気温取得:', { currentTemp, maxTemp, minTemp })
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
                
                // 無料のルールベース方式で説明を生成（フォールバック・現在は未使用）
                // const generateRuleBasedDescription = (): string => {
                //   const avgTemp = maxTemp !== undefined && minTemp !== undefined ? Math.round((maxTemp + minTemp) / 2) : null
                //   
                //   // ルールベースで生成したことが分かるようにラベルを付与
                //   let description = `【ルール】今日の${prefecture}${city}は${weatherInfo.text}`
                //   
                //   if (avgTemp !== null) {
                //     if (avgTemp >= 25) {
                //       description += `。暑い一日になりそうです。熱中症にご注意ください`
                //     } else if (avgTemp >= 20) {
                //       description += `。過ごしやすい気温です。お出かけに最適な天気です`
                //     } else if (avgTemp >= 15) {
                //       description += `。少し肌寒いかもしれません。上着があると安心です`
                //     } else if (avgTemp >= 10) {
                //       description += `。寒い一日になりそうです。暖かい服装でお出かけください`
                //     } else {
                //       description += `。とても寒い一日になりそうです。防寒対策をしっかりと`
                //     }
                //   }
                //   
                //   if (weatherInfo.text === '雨') {
                //     description += `。傘をお忘れなく`
                //   } else if (weatherInfo.text === '雪') {
                //     description += `。路面が滑りやすくなります。お気をつけて`
                //   } else if (weatherInfo.text === '曇り') {
                //     description += `。雲が多いですが、お出かけには問題ありません`
                //   }
                //   
                //   if (maxTemp !== undefined && minTemp !== undefined) {
                //     description += `（最高${maxTemp}度、最低${minTemp}度）`
                //   }
                //   
                //   return description
                // }

                // 以前はここで今日の天気を画面に表示していたが、
                // 現在はGeminiデバッグ専用表示のため状態更新のみコメントアウト
                // setTodayWeather({
                //   condition: weatherInfo.condition,
                //   icon: weatherInfo.icon,
                //   maxTemp: maxTemp,
                //   minTemp: minTemp,
                //   description: description,
                //   prefecture: prefecture,
                //   city: city
                // })
                // window.dispatchEvent(new CustomEvent('weatherChanged', { 
                //   detail: { condition: weatherInfo.condition } 
                // }))
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
        
        // すべてのAPIが失敗した場合、エラーメッセージのみログに出力
        console.error('すべての天気APIからのデータ取得に失敗しました')
        setHourlyForecast([])
      } catch (error) {
        console.error('天気情報の取得に失敗しました:', error)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 600000) // 10分ごとに更新

    return () => clearInterval(interval)
  }, [prefecture, city])

  const handleGeminiTest = async () => {
    try {
      const trimmed = geminiPrompt.trim()
      // Gemini には常に「新潟県新発田市」の天気予報を問い合わせる
      const targetPrefecture = '新潟県'
      const targetCity = '新発田市'

      const hasForecast = hourlyForecast.length > 0
      const forecastDataForPrompt = hasForecast
        ? JSON.stringify(
            hourlyForecast.map((f) => ({
              time: format(f.time, 'HH時'),
              temp: f.temp,
              condition: f.condition,
              precipitation: f.precipitation
            }))
          )
        : '（2時間ごとの天気データは取得できませんでした）'

      const userQuestion =
        trimmed || '新潟県新発田市の今日と今後24時間の天気をわかりやすく教えてください。'

      const promptToSend =
        `あなたは日本の気象予報士です。` +
        `以下の天気データとユーザーからの質問にもとづいて、` +
        `現在からおおよそ24時間程度の天気の概要を日本語で1行の短い文章で説明してください。` +
        `改行は入れず、全体を1行の文として出力してください。` +
        `地名だけ（例:「新潟」「新発田市」など）で答えてはいけません。` +
        `必ず「現在〜今後24時間の天気の傾向」を含む説明文として40文字以上で出力してください。\n\n` +
        `【地点】${targetPrefecture}${targetCity}\n` +
        `【現在時刻】${format(time, 'yyyy年MM月dd日 HH:mm')}\n` +
        `【2時間ごとの天気データ】\n${forecastDataForPrompt}\n\n` +
        `【ユーザーからの質問】${userQuestion}\n\n` +
        `必ず、新潟県新発田市の天気として、気温の傾向（暑い・寒いなど）や雨・雪の可能性にも触れてください。`

      if (!promptToSend) {
        setGeminiError('Geminiに送るプロンプトを入力してください。')
        return
      }

      // setGeminiLoading(true)
      setGeminiError(null)

      console.log('[Gemini Debug] sending request to /api/gemini-weather', {
        promptLength: promptToSend.length,
        promptSample: promptToSend.slice(0, 120)
      })

      const res = await fetch('/api/gemini-weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptToSend })
      })

      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        console.warn('[Gemini Debug] response is not valid JSON, raw text:', text)
      }

      if (!res.ok) {
        console.error('[Gemini Debug] HTTP error from /api/gemini-weather', {
          status: res.status,
          statusText: res.statusText,
          bodySample: text.slice(0, 300)
        })
        const lines: string[] = []
        lines.push(`HTTP ${res.status} ${res.statusText || ''}`.trim())
        if (json && (json.error || json.message)) {
          lines.push(`error: ${json.error || json.message}`)
        }
        if (text) {
          lines.push(`body: ${text.slice(0, 200)}`)
        }
        setGeminiError(lines.join('\n'))
        return
      }

      console.log('[Gemini Debug] success response from /api/gemini-weather', json)

      const description =
        (json && typeof json.description === 'string' && json.description.trim()) ||
        '(description フィールドが空です)'

      console.log('[Gemini Debug] final description string', description, 'current ojisanMessage:', ojisanMessage)

      // Geminiの返答が短すぎる（地名だけ等）の場合は、お天気おじさんの
      // ルールベース解説を優先し、Geminiの結果は無視する
      const visibleText = description.replace(/^【Gemini】/, '').trim()
      const isTooShort = visibleText.length < 15 || !/[。．\.\!！]/.test(visibleText)
      if (isTooShort) {
        console.warn('[Gemini Debug] response considered too short/unhelpful, keeping ojisanMessage', {
          description,
          visibleTextLength: visibleText.length
        })
        return
      }

      // 画面上で確実に見えるように、履歴に追加してお天気おじさんにしゃべってもらう
      setGeminiPrompt(description)
      setOjisanHistory((prev) => [...prev, description])
    } catch (error) {
      console.error('[Gemini Debug] fetch to /api/gemini-weather failed', error)
      setGeminiError(String(error))
    } finally {
      // setGeminiLoading(false)
    }
  }

  // 一度だけ自動でGeminiに問い合わせて、お天気おじさんにしゃべってもらう
  useEffect(() => {
    if (geminiAutoTriggered.current) return
    geminiAutoTriggered.current = true
    handleGeminiTest()
  }, [prefecture, city])


  return (
    <div className="clock">
      {/* 上: 日時 */}
      <div className="clock-datetime">
        <div className="clock-date">
          {format(time, 'yyyy年MM月dd日')} {['日', '月', '火', '水', '木', '金', '土'][time.getDay()]}曜日
        </div>
        <div className="clock-time">
          {format(time, 'HH:mm:ss')}
        </div>
      </div>

      {/* 下: お天気おじさんによる解説（吹き出しが増えていくイメージ） */}
      <div className="weather-ojisan">
        <div className="weather-ojisan-avatar">
          <div className="weather-ojisan-face">👴</div>
          <div className="weather-ojisan-name">お天気おじさん</div>
        </div>
        <div className="weather-ojisan-bubbles">
          {ojisanHistory.length === 0 && !geminiError && (
            <div className="weather-ojisan-bubble">
              <span>お天気おじさんが最新の天気を集めています…</span>
            </div>
          )}
          {ojisanHistory.map((text, index) => {
            const isLast = index === ojisanHistory.length - 1
            return (
              <div key={index} className="weather-ojisan-bubble">
                <span>{text}</span>
                {isLast && (
                  <div className="weather-ojisan-temps">
                    <span className="temp-max">
                      {ojisanMaxTemp !== null ? `${ojisanMaxTemp}°` : '--'}
                    </span>
                    <span className="temp-separator">/</span>
                    <span className="temp-min">
                      {ojisanMinTemp !== null ? `${ojisanMinTemp}°` : '--'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
          {geminiError && (
            <div className="weather-ojisan-bubble">
              <span>
                今日はAIのお天気おじさんがうまく天気をしゃべれないみたいです。時間をおいてからまた見てみてください。
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Clock
