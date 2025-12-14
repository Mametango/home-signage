import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns'
import ja from 'date-fns/locale/ja'
import './Calendar.css'

const Calendar = () => {
  const [currentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // 月の最初の日の曜日を取得（0=日曜日）
  const firstDayOfWeek = getDay(monthStart)
  
  // 前月の空白日を追加
  const emptyDays = Array(firstDayOfWeek).fill(null)

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}
        </h2>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="calendar-day empty"></div>
          ))}
          {daysInMonth.map((day) => (
            <div
              key={day.toISOString()}
              className={`calendar-day ${isToday(day) ? 'today' : ''}`}
            >
              {format(day, 'd')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Calendar

