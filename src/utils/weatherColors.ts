// 天気と時間帯に応じた背景色を取得
export const getWeatherBackground = (condition: string, hour: number): string => {
  const isDay = hour >= 6 && hour < 18 // 6時から18時までを昼とする
  
  // 天気の状態に応じた色
  const weatherColors: { [key: string]: { day: string; night: string } } = {
    '晴れ': {
      day: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 50%, #FFD700 100%)', // 青空から太陽の色
      night: 'linear-gradient(135deg, #191970 0%, #000033 50%, #1a1a2e 100%)' // 夜空
    },
    '曇り': {
      day: 'linear-gradient(135deg, #B0C4DE 0%, #D3D3D3 50%, #C0C0C0 100%)', // グレー系
      night: 'linear-gradient(135deg, #2F4F4F 0%, #1C1C1C 50%, #2d2d2d 100%)' // 暗いグレー
    },
    '雨': {
      day: 'linear-gradient(135deg, #708090 0%, #778899 50%, #696969 100%)', // 雨雲
      night: 'linear-gradient(135deg, #2F4F4F 0%, #1C1C1C 50%, #000000 100%)' // 暗い雨雲
    },
    '雪': {
      day: 'linear-gradient(135deg, #E6E6FA 0%, #F0F8FF 50%, #FFFFFF 100%)', // 雪
      night: 'linear-gradient(135deg, #4B0082 0%, #2F4F4F 50%, #1C1C1C 100%)' // 暗い雪
    }
  }
  
  const colors = weatherColors[condition] || weatherColors['晴れ']
  return isDay ? colors.day : colors.night
}

// 天気の状態を判定（アイコンから）
export const getConditionFromIcon = (icon: string): string => {
  if (icon.includes('☀️') || icon.includes('☀')) return '晴れ'
  if (icon.includes('☁️') || icon.includes('☁')) return '曇り'
  if (icon.includes('🌧️') || icon.includes('🌧') || icon.includes('🌦')) return '雨'
  if (icon.includes('❄️') || icon.includes('❄') || icon.includes('🌨')) return '雪'
  return '晴れ'
}

