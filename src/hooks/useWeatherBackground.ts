import { useState, useEffect } from 'react'
import { getWeatherBackground } from '../utils/weatherColors'

// 天気情報を取得して背景色を設定するカスタムフック
export const useWeatherBackground = () => {
  const [background, setBackground] = useState<string>('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')

  useEffect(() => {
    const updateBackground = () => {
      const hour = new Date().getHours()
      
      // 天気情報を取得（モックデータ）
      // 実際の実装ではWeatherコンポーネントから取得するか、状態管理を使用
      const condition = '晴れ' // デフォルト
      const bg = getWeatherBackground(condition, hour)
      setBackground(bg)
    }

    updateBackground()
    const interval = setInterval(updateBackground, 60000) // 1分ごとに更新

    return () => clearInterval(interval)
  }, [])

  // 天気情報が変更されたときに背景色を更新
  const updateBackgroundFromWeather = (condition: string) => {
    const hour = new Date().getHours()
    const bg = getWeatherBackground(condition, hour)
    setBackground(bg)
  }

  return { background, updateBackgroundFromWeather }
}

