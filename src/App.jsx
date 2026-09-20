import Scene from './scene/Scene.jsx'
import LightSite from './components/LightSite.jsx'

export default function App() {
  if (window.location.pathname === '/admin') {
    return (
      <iframe
        src="/admin.html"
        title="NYXTRYP Admin"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          background: '#09090b',
        }}
      />
    )
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
