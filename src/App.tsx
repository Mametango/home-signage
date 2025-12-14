import Clock from './components/Clock'
import News from './components/News'
import TodayWeather from './components/TodayWeather'
import './App.css'

function App() {
  return (
    <div className="app">
      {/* 左側1/3: 日付と時刻 */}
      <div className="app-left">
        <Clock />
      </div>
      
      {/* 右側2/3: ニュースと天気をスクロール可能に表示 */}
      <div className="app-right">
        <div className="app-right-scroll">
          <TodayWeather />
          <News />
        </div>
      </div>
    </div>
  )
}

export default App

