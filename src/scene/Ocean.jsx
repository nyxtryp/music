import { useEffect, useRef } from 'react'

export default function Ocean() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current

    const image = document.createElement('video')

    image.src = '/video/space.mp4'
    image.autoplay = true
    image.loop = true
    image.muted = true
    image.playsInline = true
    image.draggable = false

    Object.assign(image.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center center',
      display: 'block',
      zIndex: '0',
      pointerEvents: 'none',
    })

    mount.appendChild(image)

    return () => {
      if (mount.contains(image)) {
        mount.removeChild(image)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="ocean-scene"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}
    />
  )
}
