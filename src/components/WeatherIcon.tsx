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
          // 晴れ：参考イメージのような「青空＋太陽＋ふわふわ雲」の抽象イラスト
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              {/* 空のグラデーション */}
              <linearGradient id="sunnySkyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEFA" stopOpacity="1" />
                <stop offset="60%" stopColor="#B0E0FF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E0F6FF" stopOpacity="0.9" />
              </linearGradient>
              {/* 太陽のグラデーション */}
              <radialGradient id="sunCoreGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFF9C4" stopOpacity="1" />
                <stop offset="50%" stopColor="#FFD54F" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFB300" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id="sunHaloGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFE082" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFB300" stopOpacity="0" />
              </radialGradient>
              {/* 雲のグラデーション */}
              <linearGradient id="sunnyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#E0E6F0" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* 空全体 */}
            <rect x="0" y="0" width="200" height="200" fill="url(#sunnySkyGradient)" />

            {/* 太陽（右上寄り） */}
            <circle cx="145" cy="55" r="34" fill="url(#sunCoreGradient)">
              <animate attributeName="r" values="32;36;32" dur="4s" repeatCount="indefinite" />
            </circle>
            {/* 太陽のハロー */}
            <circle cx="145" cy="55" r="55" fill="url(#sunHaloGradient)" opacity="0.9">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* 太陽の光の抽象的な放射（短いライン） */}
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 36) * Math.PI / 180
              const inner = 45
              const outer = 60
              const x1 = 145 + Math.cos(angle) * inner
              const y1 = 55 + Math.sin(angle) * inner
              const x2 = 145 + Math.cos(angle) * outer
              const y2 = 55 + Math.sin(angle) * outer
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FFE082"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                >
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                </line>
              )
            })}

            {/* 手前のふわふわ雲（左下） */}
            <g opacity="0.96">
              <ellipse cx="55" cy="115" rx="36" ry="20" fill="url(#sunnyCloudGradient)">
                <animate attributeName="cx" values="55;58;55" dur="6s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="35" cy="118" rx="24" ry="15" fill="url(#sunnyCloudGradient)">
                <animate attributeName="cx" values="35;37;35" dur="6s" repeatCount="indefinite" begin="1s" />
              </ellipse>
              <ellipse cx="75" cy="118" rx="26" ry="16" fill="url(#sunnyCloudGradient)">
                <animate attributeName="cx" values="75;78;75" dur="6s" repeatCount="indefinite" begin="0.5s" />
              </ellipse>
            </g>

            {/* 中央寄りの雲（太陽とのバランス用） */}
            <g opacity="0.9">
              <ellipse cx="115" cy="125" rx="40" ry="22" fill="url(#sunnyCloudGradient)">
                <animate attributeName="cx" values="115;118;115" dur="7s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="95" cy="120" rx="26" ry="16" fill="url(#sunnyCloudGradient)" />
              <ellipse cx="135" cy="122" rx="28" ry="17" fill="url(#sunnyCloudGradient)" />
            </g>
          </svg>
        )

      case 'cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8E8E8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#D0D0D0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.7" />
              </linearGradient>
              <radialGradient id="cloudBlur1" cx="30%" cy="40%">
                <stop offset="0%" stopColor="#F5F5F5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="0.3" />
              </radialGradient>
              <radialGradient id="cloudBlur2" cx="70%" cy="40%">
                <stop offset="0%" stopColor="#F5F5F5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            {/* 拡大された雲の抽象表現 */}
            <ellipse cx="100" cy="100" rx="90" ry="50" fill="url(#cloudGradient)">
              <animate attributeName="rx" values="90;95;90" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="80" cy="90" rx="70" ry="40" fill="url(#cloudBlur1)" opacity="0.8">
              <animate attributeName="cx" values="80;82;80" dur="5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="90" rx="70" ry="40" fill="url(#cloudBlur2)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            <ellipse cx="100" cy="110" rx="60" ry="35" fill="url(#cloudGradient)" opacity="0.6">
              <animate attributeName="ry" values="35;40;35" dur="3s" repeatCount="indefinite" />
            </ellipse>
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="partlySunGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="partlyCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8E8E8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* 太陽の光 */}
            <circle cx="60" cy="60" r="50" fill="url(#partlySunGradient)">
              <animate attributeName="r" values="50;55;50" dur="3s" repeatCount="indefinite" />
            </circle>
            {/* 雲 */}
            <ellipse cx="140" cy="100" rx="80" ry="45" fill="url(#partlyCloudGradient)">
              <animate attributeName="cx" values="140;142;140" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="90" rx="60" ry="35" fill="url(#partlyCloudGradient)" opacity="0.7">
              <animate attributeName="cx" values="120;122;120" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="160" cy="90" rx="60" ry="35" fill="url(#partlyCloudGradient)" opacity="0.7">
              <animate attributeName="cx" values="160;162;160" dur="4s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </svg>
        )

      case 'sunny-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyCloudySun" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.3" />
              </radialGradient>
              <linearGradient id="sunnyCloudyCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8E8E8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D0D0D0" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="60" fill="url(#sunnyCloudySun)">
              <animate attributeName="r" values="60;65;60" dur="3s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="140" cy="100" rx="90" ry="50" fill="url(#sunnyCloudyCloud)">
              <animate attributeName="cx" values="140;142;140" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="90" rx="70" ry="40" fill="url(#sunnyCloudyCloud)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="160" cy="90" rx="70" ry="40" fill="url(#sunnyCloudyCloud)" opacity="0.8">
              <animate attributeName="cx" values="160;162;160" dur="4s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </svg>
        )

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="rainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B9BD1" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#4A90E2" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2E5C8A" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="rainDropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* 拡大された雨の抽象表現 */}
            <rect x="0" y="0" width="200" height="200" fill="url(#rainGradient)" />
            {/* 雨の線のパターン（拡大） */}
            {Array.from({ length: 20 }).map((_, i) => {
              const x = (i * 10) + 5
              const delay = (i * 0.1) % 1
              return (
                <line
                  key={i}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="200"
                  stroke="url(#rainDropGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                >
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="y1" values="0;50;0" dur="1s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="y2" values="50;100;50" dur="1s" repeatCount="indefinite" begin={`${delay}s`} />
                </line>
              )
            })}
            {/* 雨滴のパターン */}
            {Array.from({ length: 30 }).map((_, i) => {
              const x = (i * 6.5) % 200
              const y = (i * 7) % 200
              const delay = (i * 0.05) % 1
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="#87CEEB"
                  opacity="0.7"
                >
                  <animate attributeName="cy" values={`${y};${y + 50};${y}`} dur="1.5s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" begin={`${delay}s`} />
                </circle>
              )
            })}
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudyRainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#808080" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#6B9BD1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="cloudyRainDrop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {/* 雲 */}
            <ellipse cx="100" cy="80" rx="90" ry="50" fill="url(#cloudyRainGradient)">
              <animate attributeName="rx" values="90;95;90" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="80" cy="70" rx="70" ry="40" fill="url(#cloudyRainGradient)" opacity="0.8">
              <animate attributeName="cx" values="80;82;80" dur="5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="70" rx="70" ry="40" fill="url(#cloudyRainGradient)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {/* 雨 */}
            {Array.from({ length: 15 }).map((_, i) => {
              const x = 60 + (i * 6)
              const delay = (i * 0.1) % 1
              return (
                <line
                  key={i}
                  x1={x}
                  y1="130"
                  x2={x}
                  y2="200"
                  stroke="url(#cloudyRainDrop)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                >
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1s" repeatCount="indefinite" begin={`${delay}s`} />
                </line>
              )
            })}
          </svg>
        )

      case 'sunny-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnyRainSun" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="sunnyRainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#808080" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6B9BD1" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="sunnyRainDrop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="50" fill="url(#sunnyRainSun)">
              <animate attributeName="r" values="50;55;50" dur="3s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="140" cy="100" rx="90" ry="50" fill="url(#sunnyRainCloud)">
              <animate attributeName="cx" values="140;142;140" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="90" rx="70" ry="40" fill="url(#sunnyRainCloud)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="160" cy="90" rx="70" ry="40" fill="url(#sunnyRainCloud)" opacity="0.8">
              <animate attributeName="cx" values="160;162;160" dur="4s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {Array.from({ length: 12 }).map((_, i) => {
              const x = 110 + (i * 6)
              const delay = (i * 0.1) % 1
              return (
                <line
                  key={i}
                  x1={x}
                  y1="150"
                  x2={x}
                  y2="200"
                  stroke="url(#sunnyRainDrop)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.7"
                >
                  <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1s" repeatCount="indefinite" begin={`${delay}s`} />
                </line>
              )
            })}
          </svg>
        )

      case 'snowy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8F4F8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#D0E8F0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#B0D0E0" stopOpacity="0.7" />
              </linearGradient>
              <radialGradient id="snowflakeGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E0F0F8" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            {/* 拡大された雪の抽象表現 */}
            <rect x="0" y="0" width="200" height="200" fill="url(#snowGradient)" />
            {/* 雪の結晶パターン（拡大） */}
            {Array.from({ length: 15 }).map((_, i) => {
              const x = (i * 13) % 200
              const y = (i * 15) % 200
              const size = 8 + (i % 3) * 2
              const delay = (i * 0.2) % 2
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1={`-${size}`} x2="0" y2={`${size}`} stroke="url(#snowflakeGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size}`} y1="0" x2={`${size}`} y2="0" stroke="url(#snowflakeGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`-${size * 0.7}`} x2={`${size * 0.7}`} y2={`${size * 0.7}`} stroke="url(#snowflakeGradient)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`${size * 0.7}`} x2={`${size * 0.7}`} y2={`-${size * 0.7}`} stroke="url(#snowflakeGradient)" strokeWidth="2" strokeLinecap="round" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur={`${3 + (i % 3)}s`}
                    repeatCount="indefinite"
                  />
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" begin={`${delay}s`} />
                </g>
              )
            })}
          </svg>
        )

      case 'cloudy-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <linearGradient id="cloudySnowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#D0E8F0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#B0D0E0" stopOpacity="0.7" />
              </linearGradient>
              <radialGradient id="cloudySnowflake" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E0F0F8" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <ellipse cx="100" cy="80" rx="90" ry="50" fill="url(#cloudySnowGradient)">
              <animate attributeName="rx" values="90;95;90" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="80" cy="70" rx="70" ry="40" fill="url(#cloudySnowGradient)" opacity="0.8">
              <animate attributeName="cx" values="80;82;80" dur="5s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="70" rx="70" ry="40" fill="url(#cloudySnowGradient)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {Array.from({ length: 12 }).map((_, i) => {
              const x = 50 + (i * 8)
              const y = 130 + (i * 6)
              const size = 6 + (i % 2) * 2
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1={`-${size}`} x2="0" y2={`${size}`} stroke="url(#cloudySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size}`} y1="0" x2={`${size}`} y2="0" stroke="url(#cloudySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`-${size * 0.7}`} x2={`${size * 0.7}`} y2={`${size * 0.7}`} stroke="url(#cloudySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`${size * 0.7}`} x2={`${size * 0.7}`} y2={`-${size * 0.7}`} stroke="url(#cloudySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur={`${2.5 + (i % 2)}s`}
                    repeatCount="indefinite"
                  />
                </g>
              )
            })}
          </svg>
        )

      case 'sunny-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="sunnySnowSun" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.2" />
              </radialGradient>
              <linearGradient id="sunnySnowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E0E0E0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D0E8F0" stopOpacity="0.7" />
              </linearGradient>
              <radialGradient id="sunnySnowflake" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#E0F0F8" stopOpacity="0.6" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="50" fill="url(#sunnySnowSun)">
              <animate attributeName="r" values="50;55;50" dur="3s" repeatCount="indefinite" />
            </circle>
            <ellipse cx="140" cy="100" rx="90" ry="50" fill="url(#sunnySnowCloud)">
              <animate attributeName="cx" values="140;142;140" dur="4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="120" cy="90" rx="70" ry="40" fill="url(#sunnySnowCloud)" opacity="0.8">
              <animate attributeName="cx" values="120;122;120" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="160" cy="90" rx="70" ry="40" fill="url(#sunnySnowCloud)" opacity="0.8">
              <animate attributeName="cx" values="160;162;160" dur="4s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            {Array.from({ length: 10 }).map((_, i) => {
              const x = 110 + (i * 8)
              const y = 150 + (i * 5)
              const size = 6 + (i % 2) * 2
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <line x1="0" y1={`-${size}`} x2="0" y2={`${size}`} stroke="url(#sunnySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size}`} y1="0" x2={`${size}`} y2="0" stroke="url(#sunnySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`-${size * 0.7}`} x2={`${size * 0.7}`} y2={`${size * 0.7}`} stroke="url(#sunnySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <line x1={`-${size * 0.7}`} y1={`${size * 0.7}`} x2={`${size * 0.7}`} y2={`-${size * 0.7}`} stroke="url(#sunnySnowflake)" strokeWidth="2" strokeLinecap="round" />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`0 ${x} ${y};360 ${x} ${y}`}
                    dur={`${3 + (i % 2)}s`}
                    repeatCount="indefinite"
                  />
                </g>
              )
            })}
          </svg>
        )

      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 200 200" className={`weather-icon-svg ${className}`}>
            <defs>
              <radialGradient id="defaultGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFA500" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="url(#defaultGradient)" />
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon
