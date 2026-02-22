import './WeatherIcon.css'

interface WeatherIconProps {
  code: string
  size?: number
  className?: string
}

const WeatherIcon = ({ code, size = 64, className = '' }: WeatherIconProps) => {
  const iconSize = size
  const codeNum = parseInt(code)
  // Stroke width scales with size for consistency
  const sw = Math.max(1.5, size / 20)

  const getIconType = () => {
    if (codeNum >= 100 && codeNum < 200) {
      if (codeNum === 100) return 'sunny'
      if (codeNum === 101 || codeNum === 201) return 'partly-cloudy'
      if (codeNum === 102 || codeNum === 103) return 'sunny-cloudy'
      if (codeNum === 104 || codeNum === 105) return 'sunny-rain'
      if (codeNum === 106 || codeNum === 107) return 'sunny-snow'
      return 'sunny'
    }
    if (codeNum >= 200 && codeNum < 300) {
      if (codeNum === 200) return 'cloudy'
      if (codeNum === 202 || codeNum === 203) return 'cloudy-rain'
      if (codeNum === 204 || codeNum === 205) return 'cloudy-snow'
      return 'cloudy'
    }
    if (codeNum >= 300 && codeNum < 400) return 'rainy'
    if (codeNum >= 400 && codeNum < 500) return 'snowy'
    return 'sunny'
  }

  const iconType = getIconType()
  const color = 'rgba(255,255,255,0.9)'
  const dimColor = 'rgba(255,255,255,0.5)'

  const renderIcon = () => {
    switch (iconType) {
      case 'sunny':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            <circle cx="32" cy="32" r="12" stroke={color} strokeWidth={sw} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={32 + Math.cos(rad) * 17} y1={32 + Math.sin(rad) * 17}
                  x2={32 + Math.cos(rad) * 24} y2={32 + Math.sin(rad) * 24}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
          </svg>
        )

      case 'cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            <path d="M18 42 a14 14 0 0 1 0-14 a10 10 0 0 1 18-4 a12 12 0 0 1 18 10 a8 8 0 0 1-4 14 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          </svg>
        )

      case 'rainy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Cloud */}
            <path d="M14 36 a12 12 0 0 1 2-12 a9 9 0 0 1 16-3 a10 10 0 0 1 16 8 a7 7 0 0 1-3 12 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Rain drops */}
            <line x1="22" y1="44" x2="18" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
            <line x1="32" y1="44" x2="28" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
            <line x1="42" y1="44" x2="38" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
          </svg>
        )

      case 'snowy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Cloud */}
            <path d="M14 36 a12 12 0 0 1 2-12 a9 9 0 0 1 16-3 a10 10 0 0 1 16 8 a7 7 0 0 1-3 12 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Snowflakes */}
            <circle cx="20" cy="48" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
            <circle cx="32" cy="52" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
            <circle cx="44" cy="48" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
          </svg>
        )

      case 'partly-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Sun (top-left) */}
            <circle cx="24" cy="22" r="9" stroke={color} strokeWidth={sw} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={24 + Math.cos(rad) * 12} y1={22 + Math.sin(rad) * 12}
                  x2={24 + Math.cos(rad) * 16} y2={22 + Math.sin(rad) * 16}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
            {/* Cloud (bottom-right, overlapping) */}
            <path d="M22 46 a10 10 0 0 1 1-10 a8 8 0 0 1 14-3 a9 9 0 0 1 14 7 a6 6 0 0 1-3 10 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          </svg>
        )

      case 'sunny-cloudy':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Sun */}
            <circle cx="24" cy="22" r="9" stroke={color} strokeWidth={sw} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={24 + Math.cos(rad) * 12} y1={22 + Math.sin(rad) * 12}
                  x2={24 + Math.cos(rad) * 16} y2={22 + Math.sin(rad) * 16}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
            {/* Cloud */}
            <path d="M22 46 a10 10 0 0 1 1-10 a8 8 0 0 1 14-3 a9 9 0 0 1 14 7 a6 6 0 0 1-3 10 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          </svg>
        )

      case 'sunny-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Sun */}
            <circle cx="24" cy="16" r="8" stroke={color} strokeWidth={sw} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={24 + Math.cos(rad) * 11} y1={16 + Math.sin(rad) * 11}
                  x2={24 + Math.cos(rad) * 15} y2={16 + Math.sin(rad) * 15}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
            {/* Cloud */}
            <path d="M16 38 a10 10 0 0 1 1-10 a8 8 0 0 1 14-3 a9 9 0 0 1 14 7 a6 6 0 0 1-3 10 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Rain */}
            <line x1="24" y1="44" x2="20" y2="52" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
            <line x1="34" y1="44" x2="30" y2="52" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
          </svg>
        )

      case 'sunny-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Sun */}
            <circle cx="24" cy="16" r="8" stroke={color} strokeWidth={sw} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={24 + Math.cos(rad) * 11} y1={16 + Math.sin(rad) * 11}
                  x2={24 + Math.cos(rad) * 15} y2={16 + Math.sin(rad) * 15}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
            {/* Cloud */}
            <path d="M16 38 a10 10 0 0 1 1-10 a8 8 0 0 1 14-3 a9 9 0 0 1 14 7 a6 6 0 0 1-3 10 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Snow */}
            <circle cx="24" cy="48" r="1.5" stroke={dimColor} strokeWidth={sw * 0.7} />
            <circle cx="36" cy="50" r="1.5" stroke={dimColor} strokeWidth={sw * 0.7} />
          </svg>
        )

      case 'cloudy-rain':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Cloud */}
            <path d="M14 36 a12 12 0 0 1 2-12 a9 9 0 0 1 16-3 a10 10 0 0 1 16 8 a7 7 0 0 1-3 12 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Rain */}
            <line x1="22" y1="44" x2="18" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
            <line x1="32" y1="44" x2="28" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
            <line x1="42" y1="44" x2="38" y2="54" stroke={dimColor} strokeWidth={sw} strokeLinecap="round" />
          </svg>
        )

      case 'cloudy-snow':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            {/* Cloud */}
            <path d="M14 36 a12 12 0 0 1 2-12 a9 9 0 0 1 16-3 a10 10 0 0 1 16 8 a7 7 0 0 1-3 12 Z"
              stroke={color} strokeWidth={sw} strokeLinejoin="round" />
            {/* Snow */}
            <circle cx="20" cy="48" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
            <circle cx="32" cy="52" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
            <circle cx="44" cy="48" r="1.8" stroke={dimColor} strokeWidth={sw * 0.7} />
          </svg>
        )

      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" className={`weather-icon-svg ${className}`}>
            <circle cx="32" cy="32" r="12" stroke={color} strokeWidth={sw} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line key={angle}
                  x1={32 + Math.cos(rad) * 17} y1={32 + Math.sin(rad) * 17}
                  x2={32 + Math.cos(rad) * 24} y2={32 + Math.sin(rad) * 24}
                  stroke={color} strokeWidth={sw} strokeLinecap="round"
                />
              )
            })}
          </svg>
        )
    }
  }

  return <div className="weather-icon-container">{renderIcon()}</div>
}

export default WeatherIcon
