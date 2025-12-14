import Clock from './components/Clock'
import News from './components/News'
import EarthquakeAlert from './components/EarthquakeAlert'
import './App.css'

function App() {
  return (
    <div className="app">
      {/* 左側: 日時と天気 */}
      <div className="app-left">
        <Clock />
      </div>
      
      {/* 右側: ニュースまたは地震速報 */}
      <div className="app-right">
        <div className="app-right-card">
          <EarthquakeAlert />
          <News />
        </div>
      </div>
    </div>
  )
}

export default App

