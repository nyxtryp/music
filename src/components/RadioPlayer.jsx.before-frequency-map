import { useEffect, useRef, useState } from "react"

const RADIO_TRACKS = [
  { title: "Amazing Nature", file: "/audio/radio/Amazing_Nature.mp3" },
  { title: "Calm Vibrations", file: "/audio/radio/Calm_Vibrations.mp3" },
  { title: "Deep Sleep", file: "/audio/radio/Deep_Sleep.mp3" },
  { title: "Forest Before Rain", file: "/audio/radio/Forest_Before_Rain.mp3" },
  { title: "Forest Sounds", file: "/audio/radio/Forest_Sounds.mp3" },
  { title: "Harmony", file: "/audio/radio/Harmony.mp3" },
  { title: "Inner Peace", file: "/audio/radio/Inner_Peace.mp3" },
  { title: "Inside Japan", file: "/audio/radio/Inside_Japan.mp3" },
  { title: "Iren Lullaby", file: "/audio/radio/Iren_Lullaby.mp3" },
  { title: "Morning Prayer", file: "/audio/radio/Morning_Prayer.mp3" },
  { title: "Ocean Waves", file: "/audio/radio/Ocean_Waves.mp3" },
  { title: "Path to Happiness", file: "/audio/radio/Path_to_Happiness.mp3" },
  { title: "Quiet Place", file: "/audio/radio/Quiet_Place.mp3" },
  { title: "Sparks", file: "/audio/radio/Sparks.mp3" },
  { title: "Thunderstorm", file: "/audio/radio/Thunderstorm.mp3" }
]

function randomIndex(except = -1) {
  if (RADIO_TRACKS.length <= 1) return 0

  let index = Math.floor(
    Math.random() * RADIO_TRACKS.length
  )

  while (index === except) {
    index = Math.floor(
      Math.random() * RADIO_TRACKS.length
    )
  }

  return index
}

export default function RadioPlayer({ onClose }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)

  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const animationRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.68)

  const [trackIndex, setTrackIndex] = useState(() =>
    randomIndex()
  )

  const [signal, setSignal] = useState(92)
  const [latency, setLatency] = useState("1.4s")

  const track = RADIO_TRACKS[trackIndex]

  /*
   * Create the real Web Audio analyser once.
   */
  const setupAudioAnalyser = () => {
    const audio = audioRef.current

    if (!audio) return null

    if (audioContextRef.current) {
      return audioContextRef.current
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext

    if (!AudioContext) {
      return null
    }

    const context =
      new AudioContext()

    const analyser =
      context.createAnalyser()

    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.78

    const source =
      context.createMediaElementSource(
        audio
      )

    source.connect(analyser)
    analyser.connect(
      context.destination
    )

    audioContextRef.current =
      context

    analyserRef.current =
      analyser

    sourceRef.current =
      source

    return context
  }

  /*
   * Real frequency spectrum visualizer.
   */
  useEffect(() => {
    const canvas =
      canvasRef.current

    const analyser =
      analyserRef.current

    if (!canvas || !analyser) {
      return
    }

    const ctx =
      canvas.getContext("2d")

    const frequencyData =
      new Uint8Array(
        analyser.frequencyBinCount
      )

    const draw = () => {
      const width =
        canvas.width

      const height =
        canvas.height

      ctx.clearRect(
        0,
        0,
        width,
        height
      )

      analyser.getByteFrequencyData(
        frequencyData
      )

      const bars = 54
      const gap = 3

      const barWidth =
        Math.max(
          2,
          (width -
            gap *
              (bars - 1)) /
            bars
        )

      for (
        let i = 0;
        i < bars;
        i++
      ) {
        /*
         * Logarithmic-ish frequency mapping.
         * This makes bass and upper frequencies
         * visually useful instead of simply
         * taking every FFT bin equally.
         */
        const normalized =
          i /
          bars

        const index =
          Math.min(
            frequencyData.length - 1,
            Math.floor(
              Math.pow(
                normalized,
                1.65
              ) *
                (frequencyData.length - 1)
            )
          )

        const value =
          frequencyData[index] /
          255

        const energy =
          playing
            ? Math.max(
                0.025,
                value
              )
            : value * 0.15

        const barHeight =
          height *
          energy

        const x =
          i *
          (barWidth + gap)

        const y =
          height -
          barHeight

        /*
         * Low = cyan.
         * Stronger spectrum = warmer color.
         */
        const intensity =
          Math.min(
            1,
            value * 1.45
          )

        const r =
          Math.round(
            55 +
              intensity *
                200
          )

        const g =
          Math.round(
            205 -
              intensity *
                105
          )

        const b =
          Math.round(
            255 -
              intensity *
                175
          )

        const gradient =
          ctx.createLinearGradient(
            0,
            y,
            0,
            height
          )

        gradient.addColorStop(
          0,
          `rgba(${r},${g},${b},0.98)`
        )

        gradient.addColorStop(
          1,
          `rgba(${r},${g},${b},0.10)`
        )

        ctx.fillStyle =
          gradient

        ctx.fillRect(
          x,
          y,
          barWidth,
          barHeight
        )
      }

      animationRef.current =
        requestAnimationFrame(
          draw
        )
    }

    draw()

    return () => {
      if (
        animationRef.current
      ) {
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
    const audio =
      audioRef.current

    if (!audio) return

    audio.volume =
      volume

    audio.muted =
      muted
  }, [
    volume,
    muted
  ])

  /*
   * Simulated transmission information.
   * This is UI decoration only.
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
            Math.random() *
              1.0
          ).toFixed(1)

        setLatency(
          `${delay}s`
        )
      }, 1800)

    return () =>
      clearInterval(
        interval
      )
  }, [])

  /*
   * Load selected track and
   * start it automatically.
   */
  useEffect(() => {
    const audio =
      audioRef.current

    if (!audio) return

    audio.src =
      track.file

    audio.load()

    const start =
      async () => {
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
          /*
           * Browser autoplay policy can
           * still reject playback.
           */
          setPlaying(false)
        }
      }

    start()
  }, [trackIndex])

  /*
   * Automatically choose another random
   * track when the current one ends.
   */
  const handleEnded = () => {
    setTrackIndex(
      current =>
        randomIndex(
          current
        )
    )
  }

  const togglePlay =
    async () => {
      const audio =
        audioRef.current

      if (!audio) return

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
        onEnded={
          handleEnded
        }
      />

      <button
        onClick={onClose}
        aria-label="Close radio"
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
            RADIO
          </div>

          <div
            style={{
              marginTop: 7,
              fontSize: 9,
              letterSpacing:
                "2px",
              opacity:
                0.42
            }}
          >
            RELAXATION · AMBIENT · CONTINUOUS
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
            ● SIGNAL LINK
          </div>

          <div
            style={{
              opacity:
                0.5
            }}
          >
            EARTH RELAY
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
                signal /
                  8
              )

            return (
              <div
                key={index}
                style={{
                  width:
                    5,
                  height:
                    7 +
                    index *
                      1.4,
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
          display:
            "flex",
          alignItems:
            "center",
          gap: 12,
          marginBottom:
            16
        }}
      >
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

        <div
          style={{
            flex: 1,
            minWidth:
              0
          }}
        >
          <div
            style={{
              fontSize:
                10,
              letterSpacing:
                "1.8px",
              opacity:
                0.42,
              marginBottom:
                5
            }}
          >
            NOW TRANSMITTING
          </div>

          <div
            style={{
              fontSize:
                13,
              letterSpacing:
                "1px",
              whiteSpace:
                "nowrap",
              overflow:
                "hidden",
              textOverflow:
                "ellipsis"
            }}
          >
            {track.title}
          </div>
        </div>
      </div>

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap: 10
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
                  event.target
                    .value
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
