import Scene from './scene/Scene.jsx'
import LightSite from './components/LightSite.jsx'

export default function App() {
  if (window.location.pathname === '/admin') {
    window.location.replace('/admin.html')
    return null
  }

  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) <= 1100
  const isTouchDevice = navigator.maxTouchPoints > 0
  const isLightDevice = isSmallScreen && isTouchDevice

  return (
    <main className="nyxtryp">
      {isLightDevice ? <LightSite /> : <Scene />}
    </main>
  )
}
