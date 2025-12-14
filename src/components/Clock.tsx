import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import './Clock.css'

const Clock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="clock">
      <div className="clock-date">
        {format(time, 'yyyy年MM月dd日')}
      </div>
      <div className="clock-time">
        {format(time, 'HH:mm:ss')}
      </div>
    </div>
  )
}

export default Clock
