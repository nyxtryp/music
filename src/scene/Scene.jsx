import { useState } from "react"
import Ocean from "./Ocean.jsx"
import PlanetField from "./planets/PlanetField.jsx"
import RadioPlayer from "../components/RadioPlayer.jsx"
import MixesPlayer from "../components/MixesPlayer.jsx"
import TracksPlayer from "../components/TracksPlayer.jsx"

export default function Scene() {
  const [entered, setEntered] = useState(false)
  const [radioOpen, setRadioOpen] = useState(false)
  const [mixesOpen, setMixesOpen] = useState(false)
  const [tracksOpen, setTracksOpen] = useState(false)

  return (
    <div className="scene">
      {!entered ? (
        <section className="intro">
          <p className="artist">NYXTRYP</p>
          <h1>DON'T LISTEN. ENTER.</h1>
          <button
            className="enter-button"
            onClick={() => setEntered(true)}
          >
            ENTER
          </button>
        </section>
      ) : (
        <>
          <Ocean />
          <PlanetField
            onRadioOpen={() =>
              setRadioOpen(true)
            }
            onMixesOpen={() =>
              setMixesOpen(true)
            }
            onTracksOpen={() =>
              setTracksOpen(true)
            }
          />

          {radioOpen && (
            <div
              onPointerDown={(event) => {
                if (event.pointerType === "mouse") {
                  setRadioOpen(false)
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,.10)",
                backdropFilter: "blur(2px)",
                cursor: "default"
              }}
            >
              <div
                onClick={(event) =>
                  event.stopPropagation()
                }
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                style={{
                  position: "relative",
                  zIndex: 101
                }}
              >
                <RadioPlayer
                  onClose={() =>
                    setRadioOpen(false)
                  }
                />
              </div>
            </div>
          )}

          {tracksOpen && (
            <div
              onPointerDown={(event) => {
                if (event.pointerType === "mouse") {
                  setTracksOpen(false)
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,.10)",
                backdropFilter: "blur(2px)",
                cursor: "default"
              }}
            >
              <div
                onClick={(event) =>
                  event.stopPropagation()
                }
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                style={{
                  position: "relative",
                  zIndex: 101
                }}
              >
                <TracksPlayer
                  onClose={() =>
                    setTracksOpen(false)
                  }
                />
              </div>
            </div>
          )}

          {mixesOpen && (
            <div
              onPointerDown={(event) => {
                if (event.pointerType === "mouse") {
                  setMixesOpen(false)
                }
              }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,.10)",
                backdropFilter: "blur(2px)",
                cursor: "default"
              }}
            >
              <div
                onClick={(event) =>
                  event.stopPropagation()
                }
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                style={{
                  position: "relative",
                  zIndex: 101
                }}
              >
                <MixesPlayer
                  onClose={() =>
                    setMixesOpen(false)
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
