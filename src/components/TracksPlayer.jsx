import { useEffect, useRef, useState } from "react"

const TRACKS = [
  "After Midnight","Awaken The Machine","Beyond Reality","Beyond The Signal","Crystal Memory","Digital Paradise","Echoes Of Tomorrow","Electric Dreams","Electric Soul","Final Horizon","Future Is Calling","Gravity Of Light","Hidden Dimension","Higher State","Infinite Desire","Infinite Motion","Into The Unknown","Lost In Frequency","Neon Awakening","Night Protocol","Parallel Hearts","Silent Velocity","Synthetic Emotion","The Last Transmission","Zero Gravity"
].map(title => ({ title: `${title} — Nyxtryp`, file: `/media/tracks/${title} — Nyxtryp.mp3` }))

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const formatTime = value => {
  if (!Number.isFinite(value) || value < 0) return "0:00"
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`
}

function Meter({ channel, value }) {
  const scale = [[-30,-7.24],[-20,1.04],[-10,9.53],[-7,18.90],[-5,28.35],[-3,38.11],[-1,46.89],[0,52.23],[3,63.81],[5,76.40],[10,81.69]]
  const toAngle = v => {
    const x = clamp(v, -30, 10)
    for (let i = 1; i < scale.length; i++) {
      const [v2,a2] = scale[i], [v1,a1] = scale[i-1]
      if (x <= v2) return a1 + (a2-a1) * ((x-v1)/(v2-v1))
    }
    return scale[scale.length-1][1]
  }
  const angle = toAngle(value)
  const suffix = channel.toLowerCase()
  return <svg className="nyx-meter-svg" viewBox="0 0 1080 600" role="img" aria-label={`${channel} VU meter`}>
    <defs>
      <filter id={`shadow-${suffix}`}><feDropShadow dx="3" dy="3" stdDeviation="8" floodOpacity=".5" /></filter>
      <radialGradient id={`meterBlue-${suffix}`} cx="50%" cy="55%" r="72%"><stop offset="0%" stopColor="#5edbff" /><stop offset="42%" stopColor="#159fe8" /><stop offset="78%" stopColor="#0875c4" /><stop offset="100%" stopColor="#043d73" /></radialGradient>
      <filter id={`blueGlow-${suffix}`} x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="9" result="blur" /><feFlood floodColor="#38cfff" floodOpacity=".72" result="glowColor" /><feComposite in="glowColor" in2="blur" operator="in" result="glow" /><feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <rect x="0" y="0" width="1077" height="598" fill={`url(#meterBlue-${suffix})`} filter={`url(#blueGlow-${suffix})`} />
    <path d="m537.18074,590.23438 a150.76556 150.76556 0 0 0 -107.3086 45.05078 l214.73829,0 a150.76556 150.76556 0 0 0 -107.42969,-45.05078 z" fill="#000" />
    <g>
      <path d="m82,292 45.3061,0" fill="none" stroke="#000" strokeWidth="5" /><path d="m948.30743,285.82189 45.3061,0" fill="none" stroke="#000" strokeWidth="5" /><path d="m970.96048,263.16884 0,45.3061" fill="none" stroke="#000" strokeWidth="5" />
      <path d="m657,277.24518 c85.60879,8.87328 173.21481,25.29511 295.97922,75.9692" fill="none" stroke="#f00" strokeWidth="15" /><path d="m126.01626,357.7731 c161.49448,-60.14366 315.01211,-98.096 531.2366,-81.4418" fill="none" stroke="#000" strokeWidth="15" />
      <path d="m210.72277,271.30126 34.37058 47.77511" fill="none" stroke="#000" strokeWidth="8" /><path d="m285.65064,249.6478 27.49646 52.24328" fill="none" stroke="#000" strokeWidth="8" /><path d="m365.73409,233.49363 18.56011 52.93069" fill="none" stroke="#000" strokeWidth="8" /><path d="m451.66054,221.12022 8.93635 53.96181" fill="none" stroke="#000" strokeWidth="8" /><path d="m544.1174,217.33945 -0.68741 53.96181" fill="none" stroke="#000" strokeWidth="8" /><path d="m620.76379,220.0891 -8.59264 53.2744" fill="none" stroke="#000" strokeWidth="8" /><path d="m669.22631,226.96322 -14.43565 56.36775" fill="none" stroke="#f00" strokeWidth="8" /><path d="m777.83734,243.8048 -24.40311 48.80622" fill="none" stroke="#f00" strokeWidth="8" /><path d="m864.4512,318.73266 34.37058 -43.65063" fill="none" stroke="#f00" strokeWidth="8" />
      <g transform={`rotate(${angle} 537.57412 730.481)`}><path d="M184.04706,291.70923 537.57412,730.481" fill="none" stroke="#000" strokeWidth="6.7" strokeLinecap="butt" /></g>
      <text x="492.73926" y="393.86093" fontFamily="Roboto,Arial,sans-serif" fontSize="60" fontWeight="900">VU</text><text x="902.58594" y="255.49496" fontSize="40">5</text><text x="775.54688" y="218.96762" fontSize="40">3</text><text x="663.13672" y="202.96762" fontSize="40">0</text><text x="612.89453" y="196.49496" fontSize="40">1</text><text x="530.54688" y="194.96762" fontSize="40">3</text><text x="439.58594" y="202.49496" fontSize="40">5</text><text x="348.78125" y="210.49496" fontSize="40">7</text><text x="251.89453" y="221.96762" fontSize="40">10</text><text x="160.42969" y="243.96762" fontSize="40">20</text>
    </g>
  </svg>
}

export default function TracksPlayer({ onClose }) {
  const audioRef = useRef(null), canvasRef = useRef(null), ctxRef = useRef(null), splitRef = useRef(null), animRef = useRef(null)
  const meterRef = useRef({ left:-60, right:-60 })
  const spectrumRef = useRef(new Float32Array(64))
  const velocityRef = useRef(new Float32Array(64))
  const peakRef = useRef(new Float32Array(64))
  const [trackIndex,setTrackIndex] = useState(0), [playing,setPlaying] = useState(false), [volume,setVolume] = useState(.68), [muted,setMuted] = useState(false), [currentTime,setCurrentTime] = useState(0), [duration,setDuration] = useState(0), [leftVU,setLeftVU] = useState(-60), [rightVU,setRightVU] = useState(-60), [mediaVersion,setMediaVersion] = useState(0)
  const track = TRACKS[trackIndex] || { title: "NO MEDIA", file: "" }

  useEffect(() => {
    let cancelled = false
    fetch('/api/media', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('media api failed')))
      .then(data => {
        if (cancelled || !Array.isArray(data.tracks)) return
        const dynamic = data.tracks.map(name => ({ title: name.replace(/\.mp3$/i, ''), file: data.trackUrls?.[name] || `/media/tracks/${encodeURIComponent(name)}` }))
        TRACKS.splice(0, TRACKS.length, ...dynamic)
        setMediaVersion(v => v + 1)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const setupAudio = async () => {
    const audio = audioRef.current
    if (!audio) return null
    if (ctxRef.current) { if (ctxRef.current.state === "suspended") await ctxRef.current.resume(); return ctxRef.current }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    const ctx = new AC(), source = ctx.createMediaElementSource(audio), split = ctx.createChannelSplitter(2), left = ctx.createAnalyser(), right = ctx.createAnalyser(), spectrum = ctx.createAnalyser()
    left.fftSize = right.fftSize = 1024; spectrum.fftSize = 32768
    left.smoothingTimeConstant = right.smoothingTimeConstant = 0; spectrum.smoothingTimeConstant = 0
    source.connect(split); split.connect(left,0); split.connect(right,1); split.connect(spectrum,0); source.connect(ctx.destination)
    ctxRef.current = ctx; splitRef.current = {left,right,spectrum}; return ctx
  }

  useEffect(() => {
    const audio=audioRef.current; if(!audio)return
    const wasPlaying=playing; let cancelled=false
    audio.src=track.file; audio.volume=volume; audio.muted=muted; audio.load(); setCurrentTime(0); setDuration(0); meterRef.current={left:-60,right:-60}; setLeftVU(-60); setRightVU(-60)
    const startPlayback=async()=>{if(cancelled)return;try{const ctx=await setupAudio();if(ctx?.state==="suspended")await ctx.resume();await audio.play();if(!cancelled)setPlaying(true)}catch{if(!cancelled)setPlaying(false)}}
    if(wasPlaying){if(audio.readyState>=3)startPlayback();else audio.addEventListener("canplay",startPlayback,{once:true})}else{audio.pause();setPlaying(false)}
    return()=>{cancelled=true;audio.removeEventListener("canplay",startPlayback)}
  },[trackIndex,mediaVersion])
  useEffect(()=>{const audio=audioRef.current;if(!audio)return;audio.volume=volume;audio.muted=muted},[volume,muted])
  useEffect(()=>{const audio=audioRef.current;if(!audio)return;const time=()=>setCurrentTime(audio.currentTime||0),meta=()=>Number.isFinite(audio.duration)&&setDuration(audio.duration);audio.addEventListener("timeupdate",time);audio.addEventListener("loadedmetadata",meta);audio.addEventListener("durationchange",meta);return()=>{audio.removeEventListener("timeupdate",time);audio.removeEventListener("loadedmetadata",meta);audio.removeEventListener("durationchange",meta)}},[trackIndex])

  // VU — отдельный animation loop. Формулы VU НЕ меняем.
  useEffect(()=>{
    let raf
    const drawVU=()=>{
      const split=splitRef.current, now=performance.now()
      if(split){
        const lt=new Uint8Array(split.left.fftSize),rt=new Uint8Array(split.right.fftSize)
        split.left.getByteTimeDomainData(lt);split.right.getByteTimeDomainData(rt)
        const rms=data=>{let sum=0;for(let i=0;i<data.length;i++){const sample=(data[i]-128)/128;sum+=sample*sample}return Math.sqrt(sum/data.length)}
        const signalL=rms(lt),signalR=rms(rt)
        const toDb=x=>x<=.000001?-60:clamp(20*Math.log10(x),-60,0),toVU=db=>clamp(db+12,-30,10)
        const targetL=toVU(toDb(signalL)),targetR=toVU(toDb(signalR))
        const updateMeter=(current,target,dt)=>{const tc=target>current?.045:.32;return current+(target-current)*(1-Math.exp(-dt/(tc*1000)))}
        const last=drawVU.lastTime||now,dt=clamp(now-last,1,80);drawVU.lastTime=now
        const ml=updateMeter(meterRef.current.left,targetL,dt),mr=updateMeter(meterRef.current.right,targetR,dt)
        meterRef.current={left:ml,right:mr};setLeftVU(ml);setRightVU(mr)
      }else{
        meterRef.current={left:-60,right:-60};setLeftVU(-60);setRightVU(-60)
      }
      raf=requestAnimationFrame(drawVU)
    }
    drawVU()
    return()=>cancelAnimationFrame(raf)
  },[playing])

  // 64-bar spectrum — completely separate animation loop.
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    let raf
    const drawSpectrum=()=>{
      const c=canvas.getContext("2d"),split=splitRef.current,now=performance.now()
      c.clearRect(0,0,canvas.width,canvas.height)
      if(split){
        const spectrum=split.spectrum
        const ld=new Uint8Array(spectrum.frequencyBinCount)
        spectrum.getByteFrequencyData(ld)

        const bars=64
        const minHz=20
        const maxHz=Math.min(25000,(ctxRef.current?.sampleRate||44100)/2)
        const nyquist=(ctxRef.current?.sampleRate||44100)/2
        const last=drawSpectrum.lastTime||now,dt=clamp(now-last,1,80);drawSpectrum.lastTime=now
        const gap=2.2,pad=12,barWidth=(canvas.width-pad*2-gap*(bars-1))/bars,smoothed=spectrumRef.current,velocity=velocityRef.current,peaks=peakRef.current
        const baseY=canvas.height-8,maxBarHeight=canvas.height*.86,depth=Math.max(3,Math.min(8,canvas.width/150))

        for(let i=0;i<bars;i++){
          // 64 независимых столбика по логарифмической шкале частот.
          const t=i/(bars-1)
          const freq=minHz*Math.pow(maxHz/minHz,t)

          // FFT bins идут линейно по частоте.
          const bin=Math.max(0,Math.min(ld.length-1,Math.floor((freq/nyquist)*ld.length)))

          // Каждый столбик получает только своё FFT-значение.
          const raw=Math.pow(ld[bin]/255,.72)

          const signalStrength=0
          const bandEnergy=clamp(raw*(.72+signalStrength*2.1),0,1)
          const target=bandEnergy*(.82+Math.sin(i*.73)*.045)
          const position=smoothed[i],deltaTarget=target-position
          const force=deltaTarget>0?.19:.095
          velocity[i]+=deltaTarget*force*(dt/16.67)
          const bandDamping=i<12?.84:i<28?.78:i<46?.72:.66
          velocity[i]*=Math.pow(bandDamping,dt/16.67)
          smoothed[i]=clamp(position+velocity[i]*(dt/16.67),0,1)
          if(smoothed[i]<.0015)smoothed[i]=0
          if(smoothed[i]>peaks[i])peaks[i]=smoothed[i]
          else peaks[i]=Math.max(smoothed[i],peaks[i]-(.0045*(dt/16.67)))
          const v=Math.max(playing?.002:.001,smoothed[i]),h=Math.max(3,maxBarHeight*v),x=pad+i*(barWidth+gap),y=baseY-h
          const hue=190+i*1.65
          const front=c.createLinearGradient(0,y,0,baseY)
          front.addColorStop(0,`hsla(${hue},100%,78%,.98)`)
          front.addColorStop(.28,`hsla(${hue},100%,58%,.94)`)
          front.addColorStop(1,`hsla(${hue},92%,35%,.86)`)
          c.save();c.shadowBlur=10;c.shadowColor=`hsla(${hue},100%,60%,.55)`
          c.fillStyle=front;c.fillRect(x,y,barWidth,h)
          c.shadowBlur=0
          c.beginPath();c.moveTo(x,y);c.lineTo(x+depth,y-depth*.7);c.lineTo(x+barWidth+depth,y-depth*.7);c.lineTo(x+barWidth,y);c.closePath();c.fillStyle=`hsla(${hue},100%,82%,.88)`;c.fill()
          c.beginPath();c.moveTo(x+barWidth,y);c.lineTo(x+barWidth+depth,y-depth*.7);c.lineTo(x+barWidth+depth,baseY-depth*.7);c.lineTo(x+barWidth,baseY);c.closePath();c.fillStyle=`hsla(${hue},90%,30%,.9)`;c.fill()
          c.fillStyle=`hsla(${hue},100%,92%,.7)`;c.fillRect(x+1,y+1,Math.max(1,barWidth-2),Math.min(2,h))
          const peakY=baseY-Math.max(3,maxBarHeight*peaks[i])-5
          c.shadowBlur=8;c.shadowColor=`hsla(${hue},100%,72%,.9)`;c.fillStyle=`hsla(${hue},100%,88%,.98)`;c.fillRect(x-1,peakY,barWidth+2,2.2);c.restore()
        }

        c.save();c.globalAlpha=.18;c.strokeStyle="#8adfff";c.lineWidth=1
        for(let j=1;j<5;j++){const gy=baseY-(canvas.height*.86)*(j/5);c.beginPath();c.moveTo(8,gy);c.lineTo(canvas.width-8,gy);c.stroke()}
        c.restore()
      }
      raf=requestAnimationFrame(drawSpectrum)
    }
    drawSpectrum()
    return()=>cancelAnimationFrame(raf)
  },[playing])

  const play=async()=>{const audio=audioRef.current;if(!audio)return;try{const ctx=await setupAudio();if(ctx?.state==="suspended")await ctx.resume();await audio.play();setPlaying(true)}catch{setPlaying(false)}}
  const togglePlay=()=>{if(playing){audioRef.current?.pause();setPlaying(false)}else play()}
  const changeTrack=direction=>setTrackIndex(i=>(i+direction+TRACKS.length)%TRACKS.length)
  const seek=e=>{const v=Number(e.target.value);if(audioRef.current)audioRef.current.currentTime=v;setCurrentTime(v)}

  return <>
    <style>{`
      @keyframes loriPulse{0%,100%{opacity:.45;transform:translateY(0);text-shadow:0 0 0 rgba(120,220,255,0)}50%{opacity:1;transform:translateY(-2px);text-shadow:0 0 8px rgba(120,220,255,.9),0 0 18px rgba(80,140,255,.7)}}
      .tracks-overlay{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.1);backdrop-filter:blur(2px)}
      .tracks-window{width:17cm;height:17cm;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);box-sizing:border-box;padding:18px;border-radius:24px;background:linear-gradient(145deg,rgba(9,15,27,.96),rgba(3,7,15,.98));border:1px solid rgba(125,190,255,.2);box-shadow:0 20px 70px rgba(0,0,0,.55),inset 0 0 40px rgba(70,150,255,.035);color:#eaf4ff;font-family:Inter,system-ui,sans-serif;position:relative;display:flex;flex-direction:column;gap:10px}
      .tracks-close{position:absolute;top:10px;right:14px;border:0;background:transparent;color:rgba(220,240,255,.62);font-size:22px;cursor:pointer;z-index:5}.tracks-title{text-align:center;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 28px}.tracks-brand{display:flex;align-items:center;justify-content:center;gap:6px;font-size:16px;font-weight:900;letter-spacing:1px;white-space:nowrap;padding:0 28px}.tracks-brand-pulse{animation:loriPulse 2.8s ease-in-out infinite}
      .tracks-visualizer{width:100%;height:3cm;min-height:90px;display:block;border-radius:10px;background:rgba(0,0,0,.22)}
      .nyx-vu{display:flex;gap:10px;width:100%;justify-content:center}.nyx-meter{flex:1;min-width:0;background:transparent;border-radius:4px;overflow:hidden;box-shadow:0 0 18px rgba(40,190,255,.28)}.nyx-meter-svg{display:block;width:100%;height:auto}.tracks-controls,.tracks-progress,.tracks-volume{display:flex;align-items:center;justify-content:center;gap:8px}.tracks-progress,.tracks-volume{font-size:9px;opacity:.75}.tracks-progress input,.tracks-volume input{flex:1}.tracks-button{border:1px solid rgba(150,210,255,.18);background:rgba(255,255,255,.045);color:#eaf4ff;border-radius:10px;min-width:36px;height:34px;cursor:pointer}.tracks-button.main{min-width:48px;font-size:16px}.tracks-playlist{flex:1;min-height:0;overflow-y:auto;border-top:1px solid rgba(150,210,255,.12);padding-top:7px}.tracks-item{width:100%;box-sizing:border-box;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:rgba(235,245,255,.72);padding:6px 7px;border-radius:7px;cursor:pointer;text-align:left;font-size:10px}.tracks-item.active{background:rgba(100,190,255,.1);color:#fff}.tracks-number{width:20px;opacity:.45}.tracks-item-title{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}@media(max-width:600px){.tracks-window{width:min(420px,90vw);height:auto;max-height:88vh;padding:46px 20px 16px}.nyx-vu{display:none}.tracks-playlist{max-height:145px;flex:none}}
    `}</style>
    <div className="tracks-overlay" onPointerDown={e=>e.pointerType==="mouse"&&onClose()}><div className="tracks-window" onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
      <audio ref={audioRef} onEnded={()=>changeTrack(1)} /><button className="tracks-close" onClick={onClose}>×</button><div className="tracks-brand"><span>NYXTRYP</span><span className="tracks-brand-pulse">TRACK</span></div>
      <div className="nyx-vu"><div className="nyx-meter"><Meter channel="L" value={leftVU}/></div><div className="nyx-meter"><Meter channel="R" value={rightVU}/></div></div><canvas ref={canvasRef} className="tracks-visualizer" width="1200" height="240" />
      <div className="tracks-controls"><button className="tracks-button" onClick={()=>changeTrack(-1)}>‹</button><button className="tracks-button main" onClick={togglePlay}>{playing?"Ⅱ":"▶"}</button><button className="tracks-button" onClick={()=>changeTrack(1)}>›</button></div>
      <div className="tracks-progress"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration||0} step=".1" value={Math.min(currentTime,duration||0)} onChange={seek}/><span>{formatTime(duration)}</span></div><div className="tracks-volume"><button className="tracks-button" onClick={()=>setMuted(v=>!v)}>{muted?"🔇":"🔊"}</button><input type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></div>
      <div className="tracks-playlist">{TRACKS.map((item,index)=><button key={item.file} className={`tracks-item${index===trackIndex?" active":""}`} onClick={()=>{setTrackIndex(index);setTimeout(play,100)}}><span className="tracks-number">{String(index+1).padStart(2,"0")}</span><span className="tracks-item-title">{item.title}</span></button>)}</div>
    </div></div>
  </>
}