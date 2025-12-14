import Clock from './components/Clock'
import HourlyForecast from './components/HourlyForecast'
import InfoPanel from './components/InfoPanel'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="app-left">
        <Clock />
        <HourlyForecast />
      </div>
      <div className="app-right">
        <InfoPanel />
      </div>
    </div>
  )
}

export default App

