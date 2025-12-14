import Clock from './components/Clock'
import News from './components/News'
import './App.css'

function App() {
  return (
    <div className="app">
      {/* 左側: 日時と天気 */}
      <div className="app-left">
        <Clock />
      </div>
      
      {/* 右側: ニュース */}
      <div className="app-right">
        <div className="app-right-card">
          <News />
        </div>
      </div>
    </div>
  )
}

export default App

