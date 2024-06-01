import './App.css'
import { Player } from './components/Player'

function App() {
  return (
    <div className="p-6">
      <Player
        source={import.meta.env.VITE_VIDEO_URL}
      />
    </div>
  )
}

export default App;
