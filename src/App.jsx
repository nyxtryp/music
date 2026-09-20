import Scene from './scene/Scene.jsx'
import LightSite from './components/LightSite.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
    return <AdminPanel />
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
