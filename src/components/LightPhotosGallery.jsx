export default function openLightPhotosGallery() {
  const old = document.getElementById("nyxtryp-photos-window")
  if (old) old.remove()

  const photos = []

  fetch("/api/media", { cache: "no-store" })
    .then(r => r.ok ? r.json() : Promise.reject(new Error("media api failed")))
    .then(data => {
      if (!Array.isArray(data.photos) || !data.photos.length) return
      photos.splice(0, photos.length, ...data.photos.map(name => `/media/photos/${encodeURIComponent(name)}`))
      syncThumbs()
      index = Math.min(index, photos.length - 1)
      update()
    })
    .catch(() => {})

  let index = 0
  const previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = "hidden"

  const overlay = document.createElement("div")
  overlay.id = "nyxtryp-photos-window"
  Object.assign(overlay.style, {
    position:"fixed",
    inset:"0",
    width:"100vw",
    height:"100dvh",
    zIndex:"2147483647",
    background:"rgba(0,0,0,0.98)",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    overflow:"hidden",
    isolation:"isolate"
  })

  const closeOverlay = () => {
    overlay.remove()
    document.body.style.overflow = previousBodyOverflow
    window.removeEventListener("keydown", keys)
  }

  const close = document.createElement("button")
  close.textContent = "×"
  Object.assign(close.style, { position:"absolute", right:"20px", top:"10px", zIndex:"20", border:"0", background:"transparent", color:"#fff", fontSize:"36px", cursor:"pointer" })
  close.onclick = closeOverlay
  overlay.appendChild(close)

  const main = document.createElement("div")
  Object.assign(main.style, { position:"relative", width:"100%", flex:"1", minHeight:"0", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 65px 15px", boxSizing:"border-box" })
  const image = document.createElement("img")
  Object.assign(image.style, { maxWidth:"100%", maxHeight:"100%", width:"auto", height:"auto", objectFit:"contain", userSelect:"none" })
  image.draggable = false
  main.appendChild(image)

  const arrow = (symbol, side) => {
    const b = document.createElement("button")
    b.textContent = symbol
    Object.assign(b.style, { position:"absolute", top:"50%", [side]:"10px", transform:"translateY(-50%)", width:"46px", height:"80px", border:"0", background:"transparent", color:"#fff", fontSize:"40px", cursor:"pointer", zIndex:"10" })
    return b
  }
  const prev = arrow("‹", "left")
  const next = arrow("›", "right")
  main.appendChild(prev)
  main.appendChild(next)
  overlay.appendChild(main)

  const thumbs = document.createElement("div")
  Object.assign(thumbs.style, { width:"100%", height:"90px", flexShrink:"0", display:"flex", alignItems:"center", gap:"8px", overflowX:"auto", overflowY:"hidden", padding:"8px 16px 14px", boxSizing:"border-box" })
  overlay.appendChild(thumbs)
  const thumbList = []

  const update = () => {
    if (!photos.length) return
    image.src = photos[index]
    thumbList.forEach((t, i) => {
      t.style.opacity = i === index ? "1" : "0.45"
      t.style.borderColor = i === index ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)"
    })
    if (thumbList[index]) thumbList[index].scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" })
  }

  const syncThumbs = () => {
    thumbs.innerHTML = ""
    thumbList.length = 0
    photos.forEach((src, i) => {
      const t = document.createElement("button")
      Object.assign(t.style, { flex:"0 0 72px", width:"72px", height:"62px", padding:"0", border:"1px solid rgba(255,255,255,0.25)", background:"#080808", overflow:"hidden", cursor:"pointer", opacity:"0.45" })
      const ti = document.createElement("img")
      ti.src = src
      Object.assign(ti.style, { width:"100%", height:"100%", objectFit:"cover", display:"block" })
      t.appendChild(ti)
      t.onclick = () => { index = i; update() }
      thumbs.appendChild(t)
      thumbList.push(t)
    })
  }

  syncThumbs()
  prev.onclick = () => { if (photos.length) { index = (index - 1 + photos.length) % photos.length; update() } }
  next.onclick = () => { if (photos.length) { index = (index + 1) % photos.length; update() } }

  let startX = 0
  main.addEventListener("touchstart", e => { if (e.touches.length) startX = e.touches[0].clientX }, { passive:true })
  main.addEventListener("touchend", e => {
    if (!e.changedTouches.length || !photos.length) return
    const dx = e.changedTouches[0].clientX - startX
    if (Math.abs(dx) > 50) {
      index = dx < 0 ? (index + 1) % photos.length : (index - 1 + photos.length) % photos.length
      update()
    }
  }, { passive:true })

  const keys = e => {
    if (!document.body.contains(overlay) || !photos.length) return
    if (e.key === "ArrowLeft") { index = (index - 1 + photos.length) % photos.length; update() }
    if (e.key === "ArrowRight") { index = (index + 1) % photos.length; update() }
    if (e.key === "Escape") closeOverlay()
  }
  window.addEventListener("keydown", keys)
  document.body.appendChild(overlay)
  update()
}
