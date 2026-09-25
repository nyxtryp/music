import { useEffect, useRef, useState } from "react"

const MIXES = []

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00"
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)

  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export default function MixesPlayer({ onClose }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const animationRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.68)

  const [trackIndex, setTrackIndex] = useState(0)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [signal, setSignal] = useState(92)
  const [latency, setLatency] = useState("1.4s")
  const [mediaVersion, setMediaVersion] = useState(0)

  const track = MIXES[trackIndex] || { title: "NO MEDIA", file: "" }

  useEffect(() => {
    let cancelled = false

    fetch("/api/media", { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("media api failed")))
      .then(data => {
        if (cancelled || !Array.isArray(data.mixes)) return

        const dynamic = data.mixes.map(name => ({
          title: name.replace(/\.mp3$/i, ""),
          file: data.mixUrls?.[name] || `/media/mixes/${encodeURIComponent(name)}`
        }))

        MIXES.splice(0, MIXES.length, ...dynamic)
        setTrackIndex(current => Math.min(current, dynamic.length - 1))
        setMediaVersion(v => v + 1)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  /*
   * Same visual pulse style used by RadioPlayer.
   */
  useEffect(() => {
    if (document.getElementById("mixes-animation")) {
      return
    }

    const style = document.createElement("style")
    style.id = "mixes-animation"

    style.innerHTML = `
      @keyframes mixTitleScroll {
        0% {
          transform: translateX(0);
        }

        100% {
          transform: translateX(-100%);
        }
      }
    `

    document.head.appendChild(style)

    return () => {
      style.remove()
    }
  }, [])

  /*
   * Create Web Audio analyser.
   */
  const setupAudioAnalyser = () => {
    const audio = audioRef.current

    if (!audio) {
      return null
    }

    if (audioContextRef.current) {
      return audioContextRef.current
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext

    if (!AudioContext) {
      return null
    }

    const context = new AudioContext()
    const analyser = context.createAnalyser()

    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.78

    const source =
      context.createMediaElementSource(audio)

    source.connect(analyser)
    analyser.connect(context.destination)

    audioContextRef.current = context
    analyserRef.current = analyser
    sourceRef.current = source

    return context
  }

  /*
   * Visualizer.
   */
  useEffect(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current

    if (!canvas || !analyser) {
      return
    }

    const ctx = canvas.getContext("2d")

    const frequencyData =
      new Uint8Array(
        analyser.frequencyBinCount
      )

    const bars = 64
    const levels =
      new Array(bars).fill(0)

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(
        0,
        0,
        width,
        height
      )

      analyser.getByteFrequencyData(
        frequencyData
      )

      const minHz = 16
      const maxHz = 25000

      const sampleRate =
        audioContextRef.current?.sampleRate ||
        44100

      const binHz =
        sampleRate /
        analyser.fftSize

      const gap = 2

      const barWidth =
        (width -
          gap * (bars - 1)) /
        bars

      for (
        let i = 0;
        i < bars;
        i++
      ) {
        const freqStart =
          minHz *
          Math.pow(
            maxHz / minHz,
            i / bars
          )

        const freqEnd =
          minHz *
          Math.pow(
            maxHz / minHz,
            (i + 1) / bars
          )

        const startBin =
          Math.floor(
            freqStart / binHz
          )

        const endBin =
          Math.max(
            startBin + 1,
            Math.floor(
              freqEnd / binHz
            )
          )

        let sum = 0
        let count = 0

        for (
          let j = startBin;
          j < endBin &&
          j < frequencyData.length;
          j++
        ) {
          sum += frequencyData[j]
          count++
        }

        let value =
          (sum /
            Math.max(count, 1)) /
          255

        value =
          Math.pow(
            Math.min(
              value,
              0.85
            ),
            2.4
          )

        const target =
          playing
            ? value
            : 0.05

        levels[i] +=
          (target - levels[i]) *
          0.08

        const compressed =
          levels[i] /
          (levels[i] + 0.45)

        const headroom = 0.05

        const barHeight =
          height *
          compressed *
          (1 - headroom)

        const x =
          i *
          (barWidth + gap)

        const y =
          height -
          barHeight

        const gradient =
          ctx.createLinearGradient(
            0,
            y,
            0,
            height
          )

        gradient.addColorStop(
          0,
          "rgba(130,220,255,0.95)"
        )

        gradient.addColorStop(
          1,
          "rgba(80,130,255,0.15)"
        )

        ctx.fillStyle = gradient

        ctx.fillRect(
          x,
          y,
          barWidth,
          barHeight
        )
      }

      animationRef.current =
        requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        )
      }
    }
  }, [playing])

  /*
   * Volume / mute.
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.volume = volume
    audio.muted = muted
  }, [volume, muted])

  /*
   * Track progress.
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const updateTime = () => {
      setCurrentTime(
        audio.currentTime || 0
      )
    }

    const updateDuration = () => {
      if (
        Number.isFinite(audio.duration)
      ) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener(
      "timeupdate",
      updateTime
    )

    audio.addEventListener(
      "loadedmetadata",
      updateDuration
    )

    audio.addEventListener(
      "durationchange",
      updateDuration
    )

    return () => {
      audio.removeEventListener(
        "timeupdate",
        updateTime
      )

      audio.removeEventListener(
        "loadedmetadata",
        updateDuration
      )

      audio.removeEventListener(
        "durationchange",
        updateDuration
      )
    }
  }, [trackIndex, mediaVersion])

  /*
   * Decorative signal information.
   */
  useEffect(() => {
    const interval =
      setInterval(() => {
        setSignal(
          88 +
            Math.floor(
              Math.random() * 10
            )
        )

        const delay =
          (
            1.1 +
            Math.random() * 1.0
          ).toFixed(1)

        setLatency(
          `${delay}s`
        )
      }, 1800)

    return () =>
      clearInterval(interval)
  }, [])

  /*
   * Load selected mix.
   */
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.src = track.file
    audio.load()

    setCurrentTime(0)
    setDuration(0)

    const start = async () => {
      try {
        const context =
          setupAudioAnalyser()

        if (
          context &&
          context.state ===
            "suspended"
        ) {
          await context.resume()
        }

        await audio.play()

        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }

    start()
  }, [trackIndex, mediaVersion])

  /*
   * Automatically move to next mix.
   */
  const handleEnded = () => {
    setTrackIndex(
      current =>
        (current + 1) %
        MIXES.length
    )
  }

  /*
   * Play / pause.
   */
  const togglePlay = async () => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    try {
      const context =
        setupAudioAnalyser()

      if (
        context &&
        context.state ===
          "suspended"
      ) {
        await context.resume()
      }

      await audio.play()

      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  /*
   * Seek.
   */
  const seekTrack = event => {
    const audio = audioRef.current

    if (!audio || !duration) {
      return
    }

    const value =
      Number(event.target.value)

    audio.currentTime = value
    setCurrentTime(value)
  }

  /*
   * Change mix.
   */
  const changeMix = direction => {
    setTrackIndex(current => {
      if (direction < 0) {
        return (
          (current - 1 + MIXES.length) %
          MIXES.length
        )
      }

      return (
        (current + 1) %
        MIXES.length
      )
    })
  }

  return (
    <div
      style={{
        width:
          "min(420px, 90vw)",
        padding:
          "46px 26px 22px",
        borderRadius:
          "24px",
        background:
          "linear-gradient(145deg, rgba(9,15,27,.94), rgba(3,7,15,.97))",
        border:
          "1px solid rgba(125,190,255,.20)",
        boxShadow:
          "0 20px 70px rgba(0,0,0,.55), inset 0 0 40px rgba(70,150,255,.035)",
        color:
          "#eaf4ff",
        fontFamily:
          "Inter, system-ui, sans-serif",
        backdropFilter:
          "blur(18px)",
        position:
          "relative"
      }}
    >
      <audio
        ref={audioRef}
        onEnded={handleEnded}
      />

      <button
        onClick={onClose}
        aria-label="Close mixes"
        style={{
          position:
            "absolute",
          top: 14,
          right: 16,
          zIndex: 5,
          border:
            "none",
          background:
            "transparent",
          color:
            "rgba(220,240,255,.62)",
          fontSize: 22,
          fontWeight: 300,
          lineHeight: 1,
          cursor:
            "pointer",
          padding:
            "4px 7px"
        }}
      >
        ×
      </button>

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          marginBottom:
            22
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing:
                "3px",
              opacity:
                0.55,
              marginBottom:
                7
            }}
          >
            NYXTRYP
          </div>

          <div
            style={{
              fontSize: 21,
              letterSpacing:
                "4px",
              fontWeight:
                500
            }}
          >
            {"MIXES".split("").map((char, i) => (
              <span
                key={i}
                style={{
                  animation:
                    `loriPulse ${1.6 + i * 0.3}s ease-in-out infinite`,
                  animationDelay:
                    `${i * 0.35}s`
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign:
              "right",
            fontSize: 9,
            letterSpacing:
              "1.5px"
          }}
        >
          <div
            style={{
              color:
                "#75d8ff",
              marginBottom:
                6
            }}
          >
            ● MIX LINK
          </div>

          <div
            style={{
              opacity:
                0.5
            }}
          >
            AUDIO RELAY
          </div>
        </div>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap: 8,
          marginBottom:
            18
        }}
      >
        {Array.from({
          length: 12
        }).map(
          (_, index) => {
            const active =
              index <
              Math.round(
                signal / 8
              )

            return (
              <div
                key={index}
                style={{
                  width: 5,
                  height:
                    7 +
                    index * 1.4,
                  borderRadius:
                    2,
                  background:
                    active
                      ? "#70d8ff"
                      : "rgba(120,180,220,.12)",
                  boxShadow:
                    active
                      ? "0 0 8px rgba(90,210,255,.5)"
                      : "none"
                }}
              />
            )
          }
        )}

        <div
          style={{
            marginLeft:
              "auto",
            fontSize:
              9,
            letterSpacing:
              "1px",
            opacity:
              0.55
          }}
        >
          {signal}% · {latency}
        </div>
      </div>

      <div
        style={{
          height:
            105,
          borderRadius:
            14,
          overflow:
            "hidden",
          padding:
            "0 22px",
          background:
            "rgba(0,0,0,.20)",
          border:
            "1px solid rgba(100,180,255,.08)",
          marginBottom:
            18
        }}
      >
        <canvas
          ref={canvasRef}
          width={720}
          height={210}
          style={{
            width:
              "100%",
            height:
              "100%",
            display:
              "block"
          }}
        />
      </div>

      <div
        style={{
          marginBottom:
            18
        }}
      >
        <div
          style={{
            position:
              "relative",
            overflow:
              "hidden",
            width:
              "100%",
            height:
              22,
            whiteSpace:
              "nowrap"
          }}
        >
          <div
            style={{
              display:
                "inline-block",
              whiteSpace:
                "nowrap",
              animation:
                track.title.length > 34
                  ? "mixTitleScroll 18s linear infinite"
                  : "none",
              paddingLeft:
                track.title.length > 34
                  ? "100%"
                  : 0
            }}
          >
            {track.title}
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom:
            18
        }}
      >
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={
            Math.min(
              currentTime,
              duration || 0
            )
          }
          onChange={
            seekTrack
          }
          disabled={
            !duration
          }
          style={{
            width:
              "100%",
            accentColor:
              "#73d8ff",
            cursor:
              duration
                ? "pointer"
                : "default"
          }}
        />

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            marginTop:
              5,
            fontSize:
              9,
            letterSpacing:
              "1px",
            opacity:
              0.42
          }}
        >
          <span>
            {formatTime(
              currentTime
            )}
          </span>

          <span>
            {formatTime(
              duration
            )}
          </span>
        </div>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          gap:
            12,
          marginBottom:
            16
        }}
      >
        <button
          onClick={() =>
            changeMix(-1)
          }
          aria-label="Previous mix"
          style={{
            width:
              38,
            height:
              38,
            borderRadius:
              "50%",
            border:
              "1px solid rgba(120,210,255,.20)",
            background:
              "rgba(80,170,255,.06)",
            color:
              "#dff7ff",
            cursor:
              "pointer",
            fontSize:
              15
          }}
        >
          ‹
        </button>

        <button
          onClick={
            togglePlay
          }
          style={{
            width:
              42,
            height:
              42,
            borderRadius:
              "50%",
            border:
              "1px solid rgba(120,210,255,.28)",
            background:
              "rgba(80,170,255,.08)",
            color:
              "#dff7ff",
            cursor:
              "pointer",
            fontSize:
              16
          }}
        >
          {playing
            ? "Ⅱ"
            : "▶"}
        </button>

        <button
          onClick={() =>
            changeMix(1)
          }
          aria-label="Next mix"
          style={{
            width:
              38,
            height:
              38,
            borderRadius:
              "50%",
            border:
              "1px solid rgba(120,210,255,.20)",
            background:
              "rgba(80,170,255,.06)",
            color:
              "#dff7ff",
            cursor:
              "pointer",
            fontSize:
              15
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            10
        }}
      >
        <button
          onClick={() =>
            setMuted(
              value =>
                !value
            )
          }
          style={{
            border:
              "none",
            background:
              "transparent",
            color:
              "rgba(220,240,255,.7)",
            cursor:
              "pointer",
            fontSize:
              16
          }}
        >
          {muted
            ? "🔇"
            : "🔊"}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={
            volume
          }
          onChange={
            event =>
              setVolume(
                Number(
                  event.target.value
                )
              )
          }
          style={{
            flex:
              1,
            accentColor:
              "#73d8ff"
          }}
        />

        <span
          style={{
            fontSize:
              9,
            opacity:
              0.42,
            minWidth:
              28,
            textAlign:
              "right"
          }}
        >
          {Math.round(
            volume * 100
          )}
        </span>
      </div>
    </div>
  )
}
