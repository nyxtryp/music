import { useState } from "react"
import Ocean from "./Ocean.jsx"
import PlanetField from "./planets/PlanetField.jsx"

export default function Scene() {
  const [entered, setEntered] = useState(false)

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
          <PlanetField />
        </>
      )}
    </div>
  )
}
