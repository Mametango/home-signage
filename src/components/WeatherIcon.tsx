import './WeatherIcon.css'

interface WeatherIconProps {
  code: string
  size?: number
  className?: string
}

const WeatherIcon = ({ code, size = 64, className = '' }: WeatherIconProps) => {
  const iconSize = size
  const codeNum = parseInt(code)

  // 天気コードに基づいてアイコンを決定
  const getIconType = () => {
    if (codeNum >= 100 && codeNum < 200) {
      // 晴れ系
      if (codeNum === 100) return 'sunny'
      if (codeNum === 101 || codeNum === 201) return 'partly-cloudy'
      if (codeNum === 102 || codeNum === 103) return 'sunny-cloudy'
      if (codeNum === 104 || codeNum === 105) return 'sunny-rain'
      if (codeNum === 106 || codeNum === 107) return 'sunny-snow'
      return 'sunny'
    }
    if (codeNum >= 200 && codeNum < 300) {
      // 曇り系
      if (codeNum === 200) return 'cloudy'
      if (codeNum === 202 || codeNum === 203) return 'cloudy-rain'
      if (codeNum === 204 || codeNum === 205) return 'cloudy-snow'
      return 'cloudy'
    }
    if (codeNum >= 300 && codeNum < 400) {
      // 雨系
      return 'rainy'
    }
    if (codeNum >= 400 && codeNum < 500) {
      // 雪系
      return 'snowy'
    }
    return 'sunny' // デフォルト
  }

  const iconType = getIconType()

  const renderIcon = () => {
    switch (iconType) {
      case 'sunny':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <filter id="sunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽 */}
            <circle cx="50" cy="50" r="26" fill="url(#sunGradient)" stroke="#E65100" strokeWidth="4" filter="url(#sunGlow)" />
            {/* 太陽の光線 */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180
              const x1 = 50 + Math.cos(angle) * 27
              const y1 = 50 + Math.sin(angle) * 27
              const x2 = 50 + Math.cos(angle) * 40
              const y2 = 50 + Math.sin(angle) * 40
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#sunGlow)"
                />
              )
            })}
          </svg>
        )

      case 'cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="cloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#546E7A" />
            {/* 雲 */}
            <ellipse cx="50" cy="50" rx="36" ry="24" fill="url(#cloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#cloudShadow)" />
            <ellipse cx="40" cy="45" rx="28" ry="20" fill="url(#cloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#cloudShadow)" />
            <ellipse cx="60" cy="45" rx="28" ry="20" fill="url(#cloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#cloudShadow)" />
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="partlySunGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="partlySunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="partlyCloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽（左側） */}
            <circle cx="30" cy="30" r="19" fill="url(#partlySunGradient)" stroke="#E65100" strokeWidth="4" filter="url(#partlySunGlow)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 22
              const y1 = 30 + Math.sin(angle) * 22
              const x2 = 30 + Math.cos(angle) * 32
              const y2 = 30 + Math.sin(angle) * 32
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#partlySunGlow)"
                />
              )
            })}
            {/* 雲（右側） */}
            <ellipse cx="70" cy="50" rx="29" ry="19" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
            <ellipse cx="60" cy="45" rx="22" ry="16" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
            <ellipse cx="80" cy="45" rx="22" ry="16" fill="url(#partlyCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#partlyCloudShadow)" />
          </svg>
        )

      case 'sunny-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyCloudySun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnyCloudyCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="sunnyCloudySunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="sunnyCloudyCloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽 */}
            <circle cx="35" cy="35" r="24" fill="url(#sunnyCloudySun)" stroke="#E65100" strokeWidth="4" filter="url(#sunnyCloudySunGlow)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 35 + Math.cos(angle) * 27
              const y1 = 35 + Math.sin(angle) * 27
              const x2 = 35 + Math.cos(angle) * 36
              const y2 = 35 + Math.sin(angle) * 36
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#sunnyCloudySunGlow)"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="34" ry="22" fill="url(#sunnyCloudyCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnyCloudyCloudShadow)" />
            <ellipse cx="60" cy="45" rx="26" ry="19" fill="url(#sunnyCloudyCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnyCloudyCloudShadow)" />
            <ellipse cx="80" cy="45" rx="26" ry="19" fill="url(#sunnyCloudyCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnyCloudyCloudShadow)" />
          </svg>
        )

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9E9E9E" stopOpacity="1" />
                <stop offset="100%" stopColor="#212121" stopOpacity="1" />
              </linearGradient>
              <filter id="rainShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
              </filter>
              <filter id="rainGlow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#455A64" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="36" ry="24" fill="url(#rainCloudGradient)" stroke="#000000" strokeWidth="4" filter="url(#rainShadow)" />
            <ellipse cx="40" cy="40" rx="28" ry="20" fill="url(#rainCloudGradient)" stroke="#000000" strokeWidth="4" filter="url(#rainShadow)" />
            <ellipse cx="60" cy="40" rx="28" ry="20" fill="url(#rainCloudGradient)" stroke="#000000" strokeWidth="4" filter="url(#rainShadow)" />
            {/* 雨 */}
            {Array.from({ length: 8 }).map((_, i) => {
              const x = 30 + (i * 5.5)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="56"
                  x2={x}
                  y2="94"
                  stroke="#0277BD"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#rainGlow)"
                />
              )
            })}
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9E9E9E" stopOpacity="1" />
                <stop offset="100%" stopColor="#424242" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#546E7A" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="34" ry="22" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="40" cy="40" rx="26" ry="18" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            <ellipse cx="60" cy="40" rx="26" ry="18" fill="url(#cloudyRainCloud)" stroke="#212121" strokeWidth="3" />
            {/* 雨 */}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 32 + (i * 6)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="58"
                  x2={x}
                  y2="92"
                  stroke="#0D47A1"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'sunny-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyRainSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9E9E9E" stopOpacity="1" />
                <stop offset="100%" stopColor="#212121" stopOpacity="1" />
              </linearGradient>
              <filter id="sunnyRainSunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="sunnyRainCloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4"/>
              </filter>
              <filter id="sunnyRainGlow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="21" fill="url(#sunnyRainSun)" stroke="#E65100" strokeWidth="4" filter="url(#sunnyRainSunGlow)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 24
              const y1 = 30 + Math.sin(angle) * 24
              const x2 = 30 + Math.cos(angle) * 34
              const y2 = 30 + Math.sin(angle) * 34
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#sunnyRainSunGlow)"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="34" ry="22" fill="url(#sunnyRainCloud)" stroke="#000000" strokeWidth="4" filter="url(#sunnyRainCloudShadow)" />
            <ellipse cx="60" cy="45" rx="26" ry="19" fill="url(#sunnyRainCloud)" stroke="#000000" strokeWidth="4" filter="url(#sunnyRainCloudShadow)" />
            <ellipse cx="80" cy="45" rx="26" ry="19" fill="url(#sunnyRainCloud)" stroke="#000000" strokeWidth="4" filter="url(#sunnyRainCloudShadow)" />
            {/* 雨 */}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 54 + (i * 5)
              return (
                <line
                  key={i}
                  x1={x}
                  y1="61"
                  x2={x}
                  y2="94"
                  stroke="#0277BD"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#sunnyRainGlow)"
                />
              )
            })}
          </svg>
        )

      case 'snowy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="snowCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="snowShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
              <filter id="snowGlow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#546E7A" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="36" ry="24" fill="url(#snowCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#snowShadow)" />
            <ellipse cx="40" cy="40" rx="28" ry="20" fill="url(#snowCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#snowShadow)" />
            <ellipse cx="60" cy="40" rx="28" ry="20" fill="url(#snowCloudGradient)" stroke="#212121" strokeWidth="3.5" filter="url(#snowShadow)" />
            {/* 雪の結晶 */}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = 22 + (i * 8)
              const y = 61 + (i % 2) * 15
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#snowGlow)" />
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#snowGlow)" />
                  <line x1="-6" y1="-6" x2="6" y2="6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#snowGlow)" />
                  <line x1="-6" y1="6" x2="6" y2="-6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#snowGlow)" />
                </g>
              )
            })}
          </svg>
        )

      case 'cloudy-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#BDBDBD" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* グレー空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#607D8B" />
            {/* 雲 */}
            <ellipse cx="50" cy="45" rx="34" ry="22" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            <ellipse cx="40" cy="40" rx="26" ry="18" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            <ellipse cx="60" cy="40" rx="26" ry="18" fill="url(#cloudySnowCloud)" stroke="#424242" strokeWidth="3" />
            {/* 雪の結晶 */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 25 + (i * 9)
              const y = 63 + (i % 2) * 14
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-7" x2="0" y2="7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-7" y1="0" x2="7" y2="0" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-5" y1="-5" x2="5" y2="5" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="-5" y1="5" x2="5" y2="-5" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )
            })}
          </svg>
        )

      case 'sunny-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnySnowSun" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <linearGradient id="sunnySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#757575" stopOpacity="1" />
              </linearGradient>
              <filter id="sunnySnowSunGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="sunnySnowCloudShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
              <filter id="sunnySnowGlow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* 青空背景 */}
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            {/* 太陽 */}
            <circle cx="30" cy="30" r="21" fill="url(#sunnySnowSun)" stroke="#E65100" strokeWidth="4" filter="url(#sunnySnowSunGlow)" />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const x1 = 30 + Math.cos(angle) * 24
              const y1 = 30 + Math.sin(angle) * 24
              const x2 = 30 + Math.cos(angle) * 34
              const y2 = 30 + Math.sin(angle) * 34
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFEB3B"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  filter="url(#sunnySnowSunGlow)"
                />
              )
            })}
            {/* 雲 */}
            <ellipse cx="70" cy="50" rx="34" ry="22" fill="url(#sunnySnowCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnySnowCloudShadow)" />
            <ellipse cx="60" cy="45" rx="26" ry="19" fill="url(#sunnySnowCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnySnowCloudShadow)" />
            <ellipse cx="80" cy="45" rx="26" ry="19" fill="url(#sunnySnowCloud)" stroke="#212121" strokeWidth="3.5" filter="url(#sunnySnowCloudShadow)" />
            {/* 雪の結晶 */}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = 54 + (i * 5.5)
              const y = 64 + (i % 2) * 14
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#sunnySnowGlow)" />
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#sunnySnowGlow)" />
                  <line x1="-6" y1="-6" x2="6" y2="6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#sunnySnowGlow)" />
                  <line x1="-6" y1="6" x2="6" y2="-6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" filter="url(#sunnySnowGlow)" />
                </g>
              )
            })}
          </svg>
        )

      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 100 100" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="defaultGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFEB3B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
              </radialGradient>
              <filter id="defaultGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="#1976D2" />
            <circle cx="50" cy="50" r="26" fill="url(#defaultGradient)" stroke="#E65100" strokeWidth="4" filter="url(#defaultGlow)" />
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon
