import { useEffect, useRef } from "react"
import * as THREE from "three"

const PLANETS = [
  {
    name: "AUDIO",
    texture: "/textures/textura.jpg",
    radius: 1.0,
    position: [0, 0, 0],
    speed: 0.0007,
    atmosphere: true
  },
  {
    name: "VIDEOS",
    texture: "/textures/planets/mercury.jpg",
    radius: 0.38,
    position: [-3.8, -1.2, -4.5],
    speed: 0.0012
  },
  {
    name: "PHOTOS",
    texture: "/textures/planets/venus.jpg",
    radius: 0.55,
    position: [5.2, 0.8, -6.8],
    speed: 0.0008
  },
  {
    name: "VISUALS",
    texture: "/textures/planets/mars.jpg",
    radius: 0.46,
    position: [-5.5, -2.8, -8.5],
    speed: 0.001
  },
  {
    name: "RELEASES",
    texture: "/textures/planets/jupiter.jpg",
    radius: 0.95,
    position: [6.2, -2.5, -12.0],
    speed: 0.00045
  },
  {
    name: "GUESTBOOK",
    texture: "/textures/planets/saturn.jpg",
    radius: 0.82,
    position: [-9.0, 5.8, -17.0],
    speed: 0.00055,
    rings: true
  },
  {
    name: "ABOUT",
    texture: "/textures/planets/uranus.jpg",
    radius: 0.62,
    position: [7.8, 3.8, -17.0],
    speed: 0.00065
  },
  {
    name: "SOCIAL",
    texture: "/textures/planets/neptune.jpg",
    radius: 0.68,
    position: [2.0, -5.0, -19.0],
    speed: 0.0006
  }
]

export default function PlanetField({ onRadioOpen, onMixesOpen, onTracksOpen }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current

    const scene = new THREE.Scene()

    const isMobile = window.innerWidth < 768
    const isTouchDevice = navigator.maxTouchPoints > 1
    const lowPowerWebGL = isMobile || isTouchDevice

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 55 : 35,
      el.clientWidth / el.clientHeight,
      0.1,
      250
    )

    camera.position.set(
      0,
      0,
      isMobile ? 28 : 17
    )

    let renderer

    try {
      renderer =
        new THREE.WebGLRenderer({
          alpha: true,
          antialias: true
        })
    } catch (error) {
      console.error(
        "NYXTRYP WEBGL INIT FAILED:",
        error
      )

      el.innerHTML = ""

      const fallback =
        document.createElement("div")

      fallback.style.width = "100%"
      fallback.style.height = "100%"
      fallback.style.background = "#000"
      fallback.style.color = "#fff"
      fallback.style.display = "flex"
      fallback.style.alignItems = "center"
      fallback.style.justifyContent = "center"
      fallback.style.fontFamily = "monospace"
      fallback.style.fontSize = "12px"
      fallback.style.letterSpacing = "0.12em"
      fallback.textContent = "NYXTRYP"

      el.appendChild(fallback)

      return () => {
        fallback.remove()
      }
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    renderer.setSize(
      el.clientWidth,
      el.clientHeight
    )

    renderer.outputColorSpace =
      THREE.SRGBColorSpace

    renderer.setClearColor(
      0x000000,
      0
    )

    renderer.shadowMap.enabled =
      true
    renderer.shadowMap.type =
      THREE.PCFSoftShadowMap

    el.appendChild(
      renderer.domElement
    )

    const canvas =
      renderer.domElement

    // ============================================================
    // WEBGL FAILURE DIAGNOSTICS — NO VISUAL/MECHANICAL CHANGES
    // ============================================================

    let diagnosticBox = null
    let diagnosticFrames = 0
    let diagnosticStart = performance.now()
    let diagnosticLastFrame = performance.now()
    let diagnosticFps = 0
    let diagnosticLastAction = "page load"

    const showDiagnostic = (title, details = "") => {
      if (!diagnosticBox) {
        diagnosticBox = document.createElement("div")
        diagnosticBox.id = "nyxtryp-webgl-diagnostic"

        Object.assign(
          diagnosticBox.style,
          {
            position: "fixed",
            left: "8px",
            right: "8px",
            top: "8px",
            padding: "12px",
            background: "rgba(120,0,0,0.96)",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.45",
            zIndex: "999999",
            whiteSpace: "pre-wrap",
            pointerEvents: "auto",
            userSelect: "text",
            WebkitUserSelect: "text",
            border: "1px solid #fff"
          }
        )

        document.body.appendChild(diagnosticBox)
      }

      const gl =
        renderer.getContext()

      const memory =
        renderer.info.memory

      const render =
        renderer.info.render

      const now =
        performance.now()

      const elapsed =
        ((now - diagnosticStart) / 1000).toFixed(1)

      const fullDiagnostic =
        "NYXTRYP WEBGL DIAGNOSTIC\n" +
        "--------------------------------\n" +
        title + "\n" +
        details + "\n" +
        "TIME: " + elapsed + " s\n" +
        "FPS: " + diagnosticFps + "\n" +
        "LAST ACTION: " + diagnosticLastAction + "\n" +
        "CANVAS: " +
          canvas.width + "x" + canvas.height + "\n" +
        "DPR: " + window.devicePixelRatio + "\n" +
        "GEOMETRIES: " + memory.geometries + "\n" +
        "TEXTURES: " + memory.textures + "\n" +
        "CALLS: " + render.calls + "\n" +
        "TRIANGLES: " + render.triangles + "\n" +
        "POINTS: " + render.points + "\n" +
        "WEBGL: " +
          (gl ? gl.getParameter(gl.VERSION) : "UNKNOWN")

      diagnosticBox.textContent =
        fullDiagnostic

      try {
        localStorage.setItem(
          "nyxtryp-webgl-diagnostic",
          fullDiagnostic
        )
      } catch (e) {
        console.warn(
          "NYXTRYP diagnostic localStorage write failed",
          e
        )
      }
    }

    const diagnosticErrorHandler =
      (event) => {
        diagnosticLastAction =
          "window error"

        showDiagnostic(
          "JAVASCRIPT ERROR",
          String(
            event?.message ||
            event?.error ||
            "unknown error"
          )
        )
      }

    const diagnosticRejectionHandler =
      (event) => {
        diagnosticLastAction =
          "unhandled promise rejection"

        showDiagnostic(
          "UNHANDLED PROMISE REJECTION",
          String(
            event?.reason ||
            "unknown rejection"
          )
        )
      }

    const onWebGLContextLost =
      (event) => {
        event.preventDefault()

        webglContextLost = true

        diagnosticLastAction =
          "WEBGL CONTEXT LOST"

        cancelAnimationFrame(
          animationId
        )

        showDiagnostic(
          "!!! WEBGL CONTEXT LOST !!!",
          "The browser/GPU lost the WebGL context."
        )
      }

    const onWebGLContextRestored =
      () => {
        webglContextLost = false

        diagnosticLastAction =
          "WEBGL CONTEXT RESTORED"

        showDiagnostic(
          "WEBGL CONTEXT RESTORED",
          "WebGL context was restored by the browser."
        )

        animationId =
          requestAnimationFrame(
            animate
          )
      }

    canvas.addEventListener(
      "webglcontextlost",
      onWebGLContextLost,
      false
    )

    canvas.addEventListener(
      "webglcontextrestored",
      onWebGLContextRestored,
      false
    )

    window.addEventListener(
      "error",
      diagnosticErrorHandler
    )

    window.addEventListener(
      "unhandledrejection",
      diagnosticRejectionHandler
    )

    const diagnosticAction =
      (name) => {
        diagnosticLastAction = name
      }

    canvas.addEventListener(
      "pointerdown",
      () => diagnosticAction("pointerdown")
    )

    canvas.addEventListener(
      "wheel",
      () => diagnosticAction("wheel / zoom")
    )

    canvas.style.cursor = "default"
    canvas.style.touchAction = "none"

    // ============================================================
    // LIGHTING
    // ============================================================

    const ambient =
      new THREE.AmbientLight(
        0x91a9cc,
        0.95
      )

    scene.add(ambient)

    const sunPosition =
      new THREE.Vector3(
        -35,
        18,
        -55
      )

    const sunLight =
      new THREE.DirectionalLight(
        0xffffff,
        6.5
      )

    sunLight.position.copy(
      sunPosition
    )

    sunLight.target.position.set(
      0,
      0,
      -10
    )

    sunLight.castShadow = true

    sunLight.shadow.mapSize.width =
      isMobile ? 1024 : 2048

    sunLight.shadow.mapSize.height =
      isMobile ? 1024 : 2048

    sunLight.shadow.camera.near = 1
    sunLight.shadow.camera.far = 120

    scene.add(sunLight)
    scene.add(sunLight.target)

    // Soft universal fill.
    const spaceFill =
      new THREE.HemisphereLight(
        0x9bbcff,
        0x111827,
        0.85
      )

    scene.add(spaceFill)

    // Hidden Sun: light source only.
    const sun =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.75,
          48,
          48
        ),
        new THREE.MeshBasicMaterial({
          color: 0xfff4cf,
          transparent: true,
          opacity: 0,
          depthWrite: false
        })
      )

    sun.position.copy(
      sunPosition
    )

    scene.add(sun)

    const glow =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.25,
          48,
          48
        ),
        new THREE.MeshBasicMaterial({
          color: 0xffd98a,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      )

    glow.position.copy(
      sunPosition
    )

    scene.add(glow)

    // ============================================================
    // STAR FIELD
    // ============================================================

    const starLayers = []

    const createStars = (
      count,
      spread,
      size,
      opacity,
      depth
    ) => {
      const positions =
        new Float32Array(
          count * 3
        )

      for (
        let i = 0;
        i < count;
        i++
      ) {
        positions[i * 3] =
          (Math.random() - 0.5) *
          spread

        positions[i * 3 + 1] =
          (Math.random() - 0.5) *
          spread

        positions[i * 3 + 2] =
          -Math.random() *
          depth
      }

      const geometry =
        new THREE.BufferGeometry()

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          positions,
          3
        )
      )

      const material =
        new THREE.PointsMaterial({
          color: 0xffffff,
          size,
          transparent: true,
          opacity,
          depthWrite: false,
          sizeAttenuation: true
        })

      const stars =
        new THREE.Points(
          geometry,
          material
        )

      scene.add(stars)

      starLayers.push({
        object: stars,
        speed:
          0.00015 +
          Math.random() *
            0.0002
      })
    }

    createStars(
      900,
      100,
      0.035,
      0.45,
      120
    )

    createStars(
      420,
      70,
      0.055,
      0.65,
      75
    )

    createStars(
      160,
      45,
      0.085,
      0.85,
      45
    )

    // ============================================================
    // SHOOTING STARS
    // ============================================================

    const shootingStars = []

    for (
      let i = 0;
      i < 3;
      i++
    ) {
      const geometry =
        new THREE.BufferGeometry()

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            0, 0, 0,
            -0.9, 0.25, 0
          ]),
          3
        )
      )

      const material =
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0
        })

      const line =
        new THREE.Line(
          geometry,
          material
        )

      line.position.set(
        0,
        0,
        -20
      )

      scene.add(line)

      shootingStars.push({
        object: line,
        active: false,
        timer:
          Math.random() *
            12 +
          5,
        life: 0
      })
    }

    // ============================================================
    // PLANETS
    // ============================================================

    const loader =
      new THREE.TextureLoader()

    const objects = []

    PLANETS.forEach(
      (data, index) => {
        const texture =
          loader.load(
            data.texture
          )

        texture.colorSpace =
          THREE.SRGBColorSpace

        texture.anisotropy =
          lowPowerWebGL
            ? 1
            : renderer.capabilities.getMaxAnisotropy()

        const material =
          new THREE.MeshStandardMaterial({
            map: texture,
            roughness: data.atmosphere ? 0.62 : 0.72,
            metalness: 0,
            envMapIntensity: 1.15,
            emissive:
              data.atmosphere
                ? new THREE.Color(0xffffff)
                : new THREE.Color(0x000000),
            emissiveMap:
              data.atmosphere
                ? texture
                : null,
            emissiveIntensity:
              data.atmosphere
                ? 0.22
                : 0
          })

        const planetMaterial =
          material

        const planet =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              data.radius,
              64,
              64
            ),
            planetMaterial
          )

        planet.position.set(
          ...data.position
        )

        planet.castShadow = true
        planet.receiveShadow = true

        planet.userData.name =
          data.name

        planet.userData.index =
          index

        scene.add(planet)

        // Individual soft fill.
        const fillLight =
          new THREE.PointLight(
            0x9fc4ff,
            2.2,
            data.radius * 13,
            2
          )

        fillLight.position.set(
          -data.radius * 2.5,
          data.radius * 1.5,
          data.radius * 3
        )

        planet.add(
          fillLight
        )

        // ========================================================
        // AUDIO / EARTH ATMOSPHERE
        // ========================================================

        if (data.atmosphere) {
          const atmosphereMaterial =
            new THREE.ShaderMaterial({
              transparent: true,
              depthWrite: false,
              depthTest: true,
              side: THREE.BackSide,
              blending: THREE.AdditiveBlending,

              uniforms: {
                sunDirection: {
                  value:
                    new THREE.Vector3(
                      -3,
                      2,
                      5
                    ).normalize()
                },
                innerRadius: {
                  value: data.radius
                },
                outerRadius: {
                  value: data.radius * 1.28
                }
              },

              vertexShader: `
        varying vec3 vLocalPosition;
        varying vec3 vLocalCameraPosition;

        void main() {
          vec4 wp =
            modelMatrix *
            vec4(position, 1.0);

          vLocalPosition =
            position;

          vLocalCameraPosition =
            (inverse(modelMatrix) *
             vec4(cameraPosition, 1.0)).xyz;

          gl_Position =
            projectionMatrix *
            viewMatrix *
            wp;
        }
      `,

              fragmentShader: `
        uniform vec3 sunDirection;
        uniform float innerRadius;
        uniform float outerRadius;

        varying vec3 vLocalPosition;
        varying vec3 vLocalCameraPosition;

        bool raySphere(
          vec3 origin,
          vec3 direction,
          float radius,
          out float nearHit,
          out float farHit
        ) {
          float b = dot(origin, direction);
          float c = dot(origin, origin) - radius * radius;
          float h = b * b - c;

          if (h < 0.0) return false;

          h = sqrt(h);
          nearHit = -b - h;
          farHit = -b + h;

          return farHit > 0.0;
        }

        void main() {

          vec3 rayOrigin =
            vLocalCameraPosition;

          vec3 localPosition =
            vLocalPosition;

          vec3 ray =
            normalize(
              localPosition -
              rayOrigin
            );

          float atmosphereNear;
          float atmosphereFar;

          if (!raySphere(
            rayOrigin,
            ray,
            outerRadius,
            atmosphereNear,
            atmosphereFar
          )) {
            discard;
          }

          atmosphereNear =
            max(atmosphereNear, 0.0);

          // Find where the viewing ray reaches Earth.
          float planetNear;
          float planetFar;

          bool hitsPlanet =
            raySphere(
              rayOrigin,
              ray,
              innerRadius,
              planetNear,
              planetFar
            );

          float endDistance =
            atmosphereFar;

          if (hitsPlanet &&
              planetNear > atmosphereNear) {
            endDistance = planetNear;
          }

          float segment =
            max(
              endDistance - atmosphereNear,
              0.0
            );

          // Several integration samples through the atmosphere.
          const int STEPS = ${lowPowerWebGL ? 4 : 8};

          float stepSize =
            segment / float(STEPS);

          vec3 scattering =
            vec3(0.0);

          float opticalDepth =
            0.0;

          for (int i = 0; i < STEPS; i++) {

            float t =
              atmosphereNear +
              (float(i) + 0.5) * stepSize;

            vec3 samplePosition =
              rayOrigin +
              ray * t;

            float height =
              length(samplePosition) - innerRadius;

            float normalizedHeight =
              clamp(
                height /
                (outerRadius - innerRadius),
                0.0,
                1.0
              );

            // Exponential density falloff.
            float density =
              exp(
                -normalizedHeight * 5.5
              );

            opticalDepth +=
              density * stepSize;

            vec3 toSun =
              normalize(sunDirection);

            float sunAngle =
              max(
                dot(
                  normalize(samplePosition),
                  toSun
                ),
                0.0
              );

            // Rayleigh scattering.
            float rayleigh =
              1.0 +
              sunAngle * sunAngle;

            vec3 rayleighColor =
              vec3(
                0.16,
                0.46,
                1.0
              );

            // Mie-like forward scattering.
            float viewSun =
              max(
                dot(ray, toSun),
                0.0
              );

            float mie =
              pow(viewSun, 10.0);

            vec3 mieColor =
              vec3(
                0.55,
                0.75,
                1.0
              );

            scattering +=
              density *
              (
                rayleighColor * rayleigh +
                mieColor * mie * 0.35
              ) *
              stepSize;
          }

          // Convert integrated scattering to soft opacity.
          float alpha =
            1.0 -
            exp(
              -opticalDepth * 1.35
            );

          // Keep the atmosphere subtle but visible.
          alpha *= 1.35;

          vec3 color =
            scattering /
            max(
              opticalDepth,
              0.0001
            );

          color =
            clamp(
              color,
              vec3(0.0),
              vec3(1.0)
            );

          gl_FragColor =
            vec4(color, alpha);
        }
      `
            })

          const atmosphere =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 1.075,
                lowPowerWebGL ? 64 : 128,
                lowPowerWebGL ? 64 : 128
              ),
              atmosphereMaterial
            )

          planet.add(
            atmosphere
          )
        }

        // ========================================================
        // AUDIO_MENU_SATELLITES_V1
        // Three real visual menu systems attached to AUDIO.
        // Static for this stage. Movement comes later.
        // ========================================================

        if (data.atmosphere) {

          const audioSatellites =
            new THREE.Group()

          audioSatellites.name =
            "AUDIO_MENU_SATELLITES_V1"

          planet.add(
            audioSatellites
          )

          // ======================================================
          // TRACKS
          // ======================================================

          const tracks =
            new THREE.Group()

          tracks.name =
            "TRACKS"

          const tracksPlanet =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.20,
                32,
                32
              ),
              new THREE.MeshStandardMaterial({
                color: 0x15131a,
                metalness: 0.72,
                roughness: 0.28,
                emissive: 0x24170b,
                emissiveIntensity: 0.45
              })
            )

          tracks.add(
            tracksPlanet
          )

          // Invisible mobile-friendly hit area.
          // Visual TRACKS geometry remains unchanged.
          const tracksHitArea =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.42,
                16,
                16
              ),
              new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false
              })
            )

          tracksHitArea.userData.isTracksHitArea = true

          tracks.add(
            tracksHitArea
          )

          const tracksRing =
            new THREE.Mesh(
              new THREE.TorusGeometry(
                data.radius * 0.30,
                data.radius * 0.018,
                12,
                64
              ),
              new THREE.MeshBasicMaterial({
                color: 0xffc43d,
                transparent: true,
                opacity: 0.95
              })
            )

          tracksRing.rotation.x =
            Math.PI * 0.48

          tracks.add(
            tracksRing
          )

          for (
            let i = 0;
            i < 4;
            i++
          ) {

            const stripe =
              new THREE.Mesh(
                new THREE.BoxGeometry(
                  data.radius * 0.30,
                  data.radius * 0.014,
                  data.radius * 0.018
                ),
                new THREE.MeshBasicMaterial({
                  color: 0xffd866,
                  transparent: true,
                  opacity: 0.8
                })
              )

            stripe.position.set(
              -data.radius * 0.05,
              (i - 1.5) *
                data.radius *
                0.065,
              data.radius * 0.20
            )

            stripe.rotation.z =
              (i - 1.5) * 0.07

            tracks.add(
              stripe
            )
          }

          tracks.position.set(
            -data.radius * 2.0,
            0,
            0
          )

          audioSatellites.add(
            tracks
          )

          // ======================================================
          // MIXES
          // ======================================================

          const mixes =
            new THREE.Group()

          mixes.name =
            "MIXES"

          const mixesPlanet =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.22,
                32,
                32
              ),
              new THREE.MeshStandardMaterial({
                color: 0x713dcc,
                metalness: 0.55,
                roughness: 0.24,
                emissive: 0x34105e,
                emissiveIntensity: 0.8
              })
            )

          mixes.add(
            mixesPlanet
          )

          const ringMaterialA =
            new THREE.MeshBasicMaterial({
              color: 0xd09aff,
              transparent: true,
              opacity: 0.9
            })

          const ringMaterialB =
            new THREE.MeshBasicMaterial({
              color: 0x8f5cff,
              transparent: true,
              opacity: 0.8
            })

          const mixRingA =
            new THREE.Mesh(
              new THREE.TorusGeometry(
                data.radius * 0.34,
                data.radius * 0.015,
                12,
                64
              ),
              ringMaterialA
            )

          mixRingA.rotation.x =
            Math.PI * 0.42

          mixRingA.rotation.z =
            Math.PI * 0.18

          mixes.add(
            mixRingA
          )

          const mixRingB =
            new THREE.Mesh(
              new THREE.TorusGeometry(
                data.radius * 0.34,
                data.radius * 0.013,
                12,
                64
              ),
              ringMaterialB
            )

          mixRingB.rotation.x =
            -Math.PI * 0.42

          mixRingB.rotation.z =
            -Math.PI * 0.22

          mixes.add(
            mixRingB
          )

          for (
            let i = 0;
            i < 3;
            i++
          ) {

            const light =
              new THREE.Mesh(
                new THREE.SphereGeometry(
                  data.radius * 0.035,
                  16,
                  16
                ),
                new THREE.MeshBasicMaterial({
                  color: 0xe7bdff
                })
              )

            const angle =
              i *
              Math.PI *
              2 /
              3

            light.position.set(
              Math.cos(angle) *
                data.radius *
                0.40,
              Math.sin(angle) *
                data.radius *
                0.25,
              Math.sin(angle) *
                data.radius *
                0.40
            )

            mixes.add(
              light
            )
          }

          mixes.position.set(
            data.radius * 2.0,
            0.15,
            0
          )

          audioSatellites.add(
            mixes
          )

          // ======================================================
          // RADIO
          // ======================================================

          const radio =
            new THREE.Group()

          radio.name =
            "RADIO"

          const radioPlanet =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.21,
                32,
                32
              ),
              new THREE.MeshStandardMaterial({
                color: 0x238ed8,
                metalness: 0.48,
                roughness: 0.22,
                emissive: 0x064875,
                emissiveIntensity: 0.8
              })
            )

          radio.add(
            radioPlanet
          )

          // ======================================================
          // MOBILE TOUCH HITBOX FOR RADIO
          // ======================================================

          const radioHitbox =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.55,
                16,
                16
              ),
              new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false
              })
            )

          radioHitbox.name =
            "RADIO_HITBOX"

          radio.add(
            radioHitbox
          )

          const antenna =
            new THREE.Mesh(
              new THREE.CylinderGeometry(
                data.radius * 0.014,
                data.radius * 0.022,
                data.radius * 0.45,
                12
              ),
              new THREE.MeshStandardMaterial({
                color: 0xb8dfff,
                metalness: 0.8,
                roughness: 0.18
              })
            )

          antenna.position.y =
            data.radius * 0.32

          radio.add(
            antenna
          )

          const dish =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.17,
                24,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.5
              ),
              new THREE.MeshStandardMaterial({
                color: 0x9bdcff,
                metalness: 0.72,
                roughness: 0.18,
                emissive: 0x126090,
                emissiveIntensity: 0.55,
                side: THREE.DoubleSide
              })
            )

          dish.position.y =
            data.radius * 0.54

          dish.rotation.x =
            -Math.PI * 0.25

          radio.add(
            dish
          )

          const waveMaterial =
            new THREE.MeshBasicMaterial({
              color: 0x55d9ff,
              transparent: true,
              opacity: 0.48
            })

          for (
            let i = 0;
            i < 3;
            i++
          ) {

            const wave =
              new THREE.Mesh(
                new THREE.TorusGeometry(
                  data.radius *
                    (0.28 + i * 0.12),
                  data.radius * 0.012,
                  8,
                  48,
                  Math.PI
                ),
                waveMaterial
              )

            wave.position.set(
              data.radius *
                (0.16 + i * 0.04),
              data.radius *
                (0.68 + i * 0.06),
              0
            )

            wave.rotation.z =
              -Math.PI * 0.5

            radio.add(
              wave
            )
          }

          radio.position.set(
            0,
            data.radius * 2.0,
            -data.radius * 0.10
          )

          audioSatellites.add(
            radio
          )

          // ======================================================
          // AUDIO MENU MOTION DATA
          // ======================================================

          audioSatellites.userData.menuPositions = {
            TRACKS: new THREE.Vector3(
              -data.radius * 2.0,
              0,
              0
            ),
            MIXES: new THREE.Vector3(
              0,
              data.radius * 2.0,
              0
            ),
            RADIO: new THREE.Vector3(
              data.radius * 2.0,
              0,
              0
            )
          }

          // Menu orientation:
          // all three satellites face the user as one flat screen.
          audioSatellites.userData.menuRotations = {
            TRACKS: new THREE.Euler(
              0,
              0,
              0
            ),
            MIXES: new THREE.Euler(
              0,
              0,
              0
            ),
            RADIO: new THREE.Euler(
              0,
              0,
              0
            )
          }

          audioSatellites.userData.freePositions = {
            TRACKS:
              tracks.position.clone(),

            MIXES:
              mixes.position.clone(),

            RADIO:
              radio.position.clone()
          }

          planet.userData.audioSatellites =
            audioSatellites
        }

        // ========================================================
        // VIDEOS / YOUTUBE SATELLITE
        // Separate system. AUDIO is untouched.
        // ========================================================

        if (data.name === "VIDEOS") {

          const videosSatellites =
            new THREE.Group()

          videosSatellites.name =
            "VIDEOS_SATELLITES"

          const youtube =
            new THREE.Group()

          youtube.name =
            "YOUTUBE"

          const youtubePlanet =
            new THREE.Mesh(
              new THREE.SphereGeometry(
                data.radius * 0.30,
                32,
                32
              ),
              new THREE.MeshStandardMaterial({
                color: 0x151515,
                metalness: 0.65,
                roughness: 0.25,
                emissive: 0x300000,
                emissiveIntensity: 0.55
              })
            )

          youtube.add(
            youtubePlanet
          )

          const youtubeRing =
            new THREE.Mesh(
              new THREE.TorusGeometry(
                data.radius * 0.42,
                data.radius * 0.018,
                10,
                48
              ),
              new THREE.MeshBasicMaterial({
                color: 0xff3030,
                transparent: true,
                opacity: 0.9
              })
            )

          youtubeRing.rotation.x =
            Math.PI * 0.43

          youtubeRing.rotation.z =
            Math.PI * 0.18

          youtube.add(
            youtubeRing
          )

          youtube.scale.set(
            1.8,
            1.8,
            1.8
          )

          youtube.position.set(
            data.radius * 2.0,
            0,
            0
          )

          videosSatellites.add(
            youtube
          )

          videosSatellites.userData.youtube =
            youtube

          videosSatellites.userData.freePosition =
            youtube.position.clone()

          videosSatellites.userData.orbitRadius =
            data.radius * 2.0

          videosSatellites.userData.orbitAngle =
            0

          videosSatellites.userData.inverseQuaternion =
            new THREE.Quaternion()

          videosSatellites.userData.targetPosition =
            new THREE.Vector3()

          videosSatellites.userData.worldPosition =
            new THREE.Vector3()

          planet.add(
            videosSatellites
          )

          planet.userData.videosSatellites =
            videosSatellites
        }

        const object = {
          mesh: planet,
          speed: data.speed,
          base:
            planet.position.clone(),
          driftX:
            0.10 +
            Math.random() *
              0.16,
          driftY:
            0.08 +
            Math.random() *
              0.14,
          driftZ:
            0.06 +
            Math.random() *
              0.12,
          ampX:
            0.35 +
            Math.random() *
              0.35,
          ampY:
            0.25 +
            Math.random() *
              0.30,
          ampZ:
            0.20 +
            Math.random() *
              0.30,
          phaseX:
            Math.random() *
            Math.PI *
            2,
          phaseY:
            Math.random() *
            Math.PI *
            2,
          phaseZ:
            Math.random() *
            Math.PI *
            2,
          selectionOffset:
            new THREE.Vector3()
        }

        objects.push(
          object
        )

        // ========================================================
        // PERMANENT PLANET NAME
        // ========================================================

        const permanentLabel =
          document.createElement(
            "div"
          )

        permanentLabel.className =
          "planet-name"

        permanentLabel.textContent =
          data.name

        permanentLabel.style.position =
          "absolute"

        permanentLabel.style.color =
          "#ffffff"

        permanentLabel.style.fontSize =
          "8px"

        permanentLabel.style.letterSpacing =
          "0.28em"

        permanentLabel.style.fontFamily =
          "Arial, Helvetica, sans-serif"

        permanentLabel.style.pointerEvents =
          "none"

        permanentLabel.style.whiteSpace =
          "nowrap"

        permanentLabel.style.transform =
          "translate(-50%, -50%)"

        permanentLabel.style.opacity =
          "0.8"

        permanentLabel.style.zIndex =
          "20"

        el.appendChild(
          permanentLabel
        )

        object.nameLabel =
          permanentLabel

        // ========================================================
        // SATURN RINGS
        // ========================================================

        if (data.rings) {
          const ringTexture =
            loader.load(
              "/textures/planets/saturn-ring.png"
            )

          ringTexture.colorSpace =
            THREE.SRGBColorSpace

          const ring =
            new THREE.Mesh(
              new THREE.RingGeometry(
                data.radius * 1.25,
                data.radius * 2.05,
                96
              ),
              new THREE.MeshStandardMaterial({
                map: ringTexture,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                roughness: 0.85
              })
            )

          ring.rotation.x =
            Math.PI / 2.25

          ring.rotation.z =
            0.15

          planet.add(
            ring
          )
        }
      }
    )

    // ============================================================
    // HOVER LABEL DISABLED
    // Permanent planet names use permanentLabel only.
    // ============================================================

    // ============================================================
    // AUDIO MENU LABELS
    // ============================================================

    const audioMenuLabels = {}

    ;["TRACKS", "MIXES", "RADIO"].forEach(
      (name) => {
        const menuLabel =
          document.createElement(
            "div"
          )

        menuLabel.style.position =
          "absolute"

        menuLabel.style.left =
          "0"

        menuLabel.style.top =
          "0"

        menuLabel.style.transform =
          "translate(-50%, -50%)"

        menuLabel.style.color =
          "#ffffff"

        menuLabel.style.fontSize =
          "9px"

        menuLabel.style.fontFamily =
          "Arial, Helvetica, sans-serif"

        menuLabel.style.fontWeight =
          "400"

        menuLabel.style.letterSpacing =
          "0.32em"

        menuLabel.style.textTransform =
          "uppercase"

        menuLabel.style.whiteSpace =
          "nowrap"

        menuLabel.style.pointerEvents =
          "none"

        menuLabel.style.opacity =
          "0"

        menuLabel.style.transition =
          "opacity 0.25s ease"

        menuLabel.style.zIndex =
          "21"

        menuLabel.textContent =
          name

        el.appendChild(
          menuLabel
        )

        audioMenuLabels[name] =
          menuLabel
      }
    )

    // ============================================================
    // YOUTUBE LABEL
    // ============================================================

    const youtubeLabel =
      document.createElement(
        "div"
      )

    youtubeLabel.style.position =
      "absolute"

    youtubeLabel.style.left =
      "0"

    youtubeLabel.style.top =
      "0"

    youtubeLabel.style.transform =
      "translate(-50%, -50%)"

    youtubeLabel.style.color =
      "#ffffff"

    youtubeLabel.style.fontSize =
      "9px"

    youtubeLabel.style.fontFamily =
      "Arial, Helvetica, sans-serif"

    youtubeLabel.style.fontWeight =
      "400"

    youtubeLabel.style.letterSpacing =
      "0.32em"

    youtubeLabel.style.whiteSpace =
      "nowrap"

    youtubeLabel.style.pointerEvents =
      "none"

    youtubeLabel.style.opacity =
      "0"

    youtubeLabel.style.transition =
      "opacity 0.25s ease"

    youtubeLabel.style.zIndex =
      "21"

    youtubeLabel.textContent =
      "YOUTUBE"

    el.appendChild(
      youtubeLabel
    )

    // ============================================================
    // INTERACTION
    // ============================================================

    const raycaster =
      new THREE.Raycaster()

    const pointer =
      new THREE.Vector2()

    let hoveredPlanet = null
    let selectedPlanet = null

    let audioMenuActive = false

    let isDragging = false

    let lastX = 0
    let lastY = 0

    let cameraDistance = 17

    let cameraTarget =
      new THREE.Vector3(
        0,
        0,
        17
      )

    let lookTarget =
      new THREE.Vector3(
        0,
        0,
        0
      )

    const getPointer =
      (event) => {
        const rect =
          canvas.getBoundingClientRect()

        pointer.x =
          ((event.clientX -
            rect.left) /
            rect.width) *
            2 -
          1

        pointer.y =
          -(
            ((event.clientY -
              rect.top) /
              rect.height) *
              2 -
            1
          )
      }

    const intersectPlanet =
      (event) => {
        getPointer(event)

        raycaster.setFromCamera(
          pointer,
          camera
        )

        const planetMeshes =
          objects.map(
            ({ mesh }) =>
              mesh
          )

        const satelliteMeshes = []

        for (const { mesh } of objects) {

          if (
            mesh.userData.name === "VIDEOS" &&
            mesh.userData.videosSatellites
          ) {
            mesh.userData.videosSatellites.traverse(
              (child) => {
                if (
                  child.isMesh &&
                  child.visible
                ) {
                  satelliteMeshes.push(child)
                }
              }
            )
          }
          if (
            mesh.userData.name === "AUDIO" &&
            mesh.userData.audioSatellites
          ) {
            mesh.userData.audioSatellites.traverse(
              (child) => {
                if (
                  child.isMesh &&
                  child.visible
                ) {
                  satelliteMeshes.push(child)
                }
              }
            )
          }
        }

        const planetHits =
          raycaster.intersectObjects(
            planetMeshes,
            false
          )

        const satelliteHits =
          raycaster.intersectObjects(
            satelliteMeshes,
            false
          )

        // AUDIO satellites always have priority over the planet.
        // This prevents clicking TRACKS/RADIO/MIXES from
        // accidentally selecting AUDIO and triggering return logic.
        if (satelliteHits.length) {
          return satelliteHits[0].object
        }

        if (planetHits.length) {
          return planetHits[0].object
        }

        return null
      }

    let pointerMoved =
      false

    let pendingReturn =
      false

    const onPointerMove =
      (event) => {
        const hit =
          intersectPlanet(
            event
          )

        if (
          hit &&
          !isDragging
        ) {
          hoveredPlanet =
            hit

          // hover labels disabled

          canvas.style.cursor =
            "pointer"
        } else if (
          !isDragging
        ) {
          hoveredPlanet =
            null

          // hover labels disabled

          canvas.style.cursor =
            "default"
        }

        if (!isDragging)
          return

        const dx =
          event.clientX -
          lastX

        const dy =
          event.clientY -
          lastY

        if (
          Math.abs(dx) > 2 ||
          Math.abs(dy) > 2
        ) {
          pointerMoved =
            true
        }

        lastX =
          event.clientX

        lastY =
          event.clientY

        if (
          selectedPlanet
        ) {
          selectedPlanet.rotation.y +=
            dx * 0.01

          selectedPlanet.rotation.x +=
            dy * 0.005

          selectedPlanet.rotation.x =
            THREE.MathUtils.clamp(
              selectedPlanet.rotation.x,
              -Math.PI * 0.45,
              Math.PI * 0.45
            )
        }
      }

    const onPointerDown =
      (event) => {
        // Mouse: only left button.
        // Touch / pen: ignore the mouse-button value.
        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        )
          return

        const hit =
          intersectPlanet(
            event
          )

        if (!hit) {
          isDragging = false
          return
        }

        // ======================================================
        // RELEASES CLICK
        // Opens the RELEASES information window.
        // RELEASES never enters the planet flight logic.
        // ======================================================

        if (
          hit.userData.name === "RELEASES"
        ) {

          const existingReleases =
            document.getElementById(
              "nyxtryp-releases-window"
            )

          if (existingReleases) {
            existingReleases.remove()
          }

          const overlay =
            document.createElement("div")

          overlay.id =
            "nyxtryp-releases-window"

          overlay.style.position =
            "absolute"

          overlay.style.inset =
            "0"

          overlay.style.zIndex =
            "100"

          overlay.style.background =
            "rgba(0,0,0,0.94)"

          overlay.style.display =
            "flex"

          overlay.style.alignItems =
            "center"

          overlay.style.justifyContent =
            "center"

          overlay.style.overflow =
            "hidden"

          overlay.style.fontFamily =
            "Arial, Helvetica, sans-serif"

          const close =
            document.createElement("button")

          close.textContent =
            "×"

          close.style.position =
            "absolute"

          close.style.right =
            "24px"

          close.style.top =
            "18px"

          close.style.zIndex =
            "5"

          close.style.border =
            "0"

          close.style.background =
            "transparent"

          close.style.color =
            "#ffffff"

          close.style.fontSize =
            "30px"

          close.style.fontWeight =
            "200"

          close.style.cursor =
            "pointer"

          close.style.opacity =
            "0.75"

          close.onclick =
            () => overlay.remove()

          overlay.appendChild(
            close
          )

          const content =
            document.createElement("div")

          content.style.position =
            "relative"

          content.style.width =
            "min(900px, 86vw)"

          content.style.height =
            "min(650px, 78vh)"

          content.style.display =
            "flex"

          content.style.flexDirection =
            "column"

          content.style.alignItems =
            "center"

          content.style.justifyContent =
            "center"

          content.style.overflow =
            "hidden"

          overlay.appendChild(
            content
          )

          const title =
            document.createElement("div")

          title.textContent =
            "RELEASES"

          title.style.color =
            "#ffffff"

          title.style.fontSize =
            "clamp(32px, 6vw, 72px)"

          title.style.fontWeight =
            "300"

          title.style.letterSpacing =
            "0.18em"

          title.style.textAlign =
            "center"

          title.style.marginBottom =
            "32px"

          content.appendChild(
            title
          )

          const text =
            document.createElement("div")

          text.textContent =
            "No releases yet.\nNew music is coming."

          text.style.color =
            "rgba(255,255,255,0.72)"

          text.style.fontSize =
            "clamp(15px, 2vw, 19px)"

          text.style.fontWeight =
            "300"

          text.style.letterSpacing =
            "0.08em"

          text.style.lineHeight =
            "1.8"

          text.style.textAlign =
            "center"

          text.style.whiteSpace =
            "pre-line"

          content.appendChild(
            text
          )

          document.body.appendChild(
            overlay
          )

          return
        }

        // ======================================================
        // YOUTUBE SATELLITE CLICK
        // Opens the current YouTube channel.
        // ======================================================

        let youtubeSatellite = null
        let currentObject = hit

        while (currentObject) {
          if (
            currentObject.name === "YOUTUBE"
          ) {
            youtubeSatellite =
              currentObject
            break
          }

          currentObject =
            currentObject.parent
        }

        if (youtubeSatellite) {

          // YOUTUBE is clickable ONLY when VIDEOS
          // has arrived at the camera.
          const youtubeIsActive =
            selectedPlanet &&
            selectedPlanet.userData.name === "VIDEOS" &&
            cameraDistance < 10

          // In free space YOUTUBE is completely non-clickable.
          if (!youtubeIsActive) {
            isDragging = false
            pointerMoved = false
            pendingReturn = false
            return
          }

          window.open(
            "https://www.youtube.com/@nyxtryp",
            "_blank",
            "noopener,noreferrer"
          )

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        // ======================================================
        // RADIO SATELLITE CLICK
        // The raycaster returns a child mesh, so walk up its
        // parent chain until the RADIO group is found.
        // Works with mouse, touch and pen.
        // ======================================================

        let radioSatellite = null
        currentObject = hit

        while (currentObject) {
          if (
            currentObject.name === "RADIO"
          ) {
            radioSatellite =
              currentObject
            break
          }

          currentObject =
            currentObject.parent
        }

        if (radioSatellite) {

          const radioIsActive =
            audioMenuActive &&
            selectedPlanet &&
            selectedPlanet.userData.name === "AUDIO"

          if (
            radioIsActive &&
            onRadioOpen
          ) {
            onRadioOpen()
          }

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        // ======================================================
        // TRACKS SATELLITE CLICK
        // Exact same interaction logic as MIXES.
        // TRACKS is handled before normal planet selection.
        // ======================================================

        let tracksSatellite = null
        currentObject = hit

        while (currentObject) {
          if (
            currentObject.name === "TRACKS"
          ) {
            tracksSatellite =
              currentObject
            break
          }

          currentObject =
            currentObject.parent
        }

        if (tracksSatellite) {

          const tracksIsActive =
            audioMenuActive &&
            selectedPlanet &&
            selectedPlanet.userData.name === "AUDIO"

          if (
            tracksIsActive &&
            onTracksOpen
          ) {
            onTracksOpen()
          }

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        // ======================================================
        // MIXES SATELLITE CLICK
        // Same interaction as RADIO.
        // Does not affect planet arrival or satellite labels.
        // ======================================================

        let mixesSatellite = null
        currentObject = hit

        while (currentObject) {
          if (
            currentObject.name === "MIXES"
          ) {
            mixesSatellite =
              currentObject
            break
          }

          currentObject =
            currentObject.parent
        }

        if (mixesSatellite) {

          const mixesIsActive =
            audioMenuActive &&
            selectedPlanet &&
            selectedPlanet.userData.name === "AUDIO"

          if (
            mixesIsActive &&
            onMixesOpen
          ) {
            onMixesOpen()
          }

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        // ======================================================
        // PHOTOS CLICK
        // ======================================================



        // ======================================================
        // VISUALS CLICK
        // VISUALS does NOT fly to the camera.
        // Opens a full-screen cosmic particle experience.
        // ======================================================

        if (hit.userData.name === "VISUALS") {
      diagnosticAction("VISUALS cinematic flight opened")

      const old = document.getElementById(
        "nyxtryp-visuals-window"
      )

      if (old) old.remove()

      const overlay = document.createElement("div")
      overlay.id = "nyxtryp-visuals-window"

      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "100000",
        background: "transparent",
        pointerEvents: "none",
        overflow: "hidden"
      })

      const close = document.createElement("button")

      close.textContent = "×"

      Object.assign(close.style, {
        position: "absolute",
        top: "22px",
        right: "28px",
        zIndex: "20",
        background: "transparent",
        border: "0",
        color: "rgba(255,255,255,.72)",
        fontSize: "28px",
        fontWeight: "200",
        cursor: "pointer",
        pointerEvents: "auto",
        lineHeight: "1",
        padding: "8px",
        fontFamily: "Arial, Helvetica, sans-serif"
      })

      overlay.appendChild(close)
      document.body.appendChild(overlay)

      /*
       * ==========================================================
       * NYXTRYP VISUALS
       * REAL 3D CINEMATIC FLIGHT
       *
       * The existing Three.js universe becomes the flight path.
       * No fake 2D perspective.
       * Camera = viewer's eyes.
       * ==========================================================
       */

      const savedCameraPosition =
        camera.position.clone()

      const savedCameraQuaternion =
        camera.quaternion.clone()

      const savedCameraTarget =
        cameraTarget.clone()

      const savedLookTarget =
        lookTarget.clone()

      const savedSelectedPlanet =
        selectedPlanet

      const savedCameraDistance =
        cameraDistance

      const savedPixelRatio =
        renderer.getPixelRatio()

      let active = true
      let finished = false

      const flightStart =
        performance.now()

      const FLIGHT_DURATION =
        60000

      const temp = new THREE.Vector3()
      const temp2 = new THREE.Vector3()
      const temp3 = new THREE.Vector3()

      /*
       * ----------------------------------------------------------
       * Hide normal labels during cinematic.
       * ----------------------------------------------------------
       */

      const labels = []

      document
        .querySelectorAll(".planet-name")
        .forEach((label) => {
          labels.push({
            label,
            opacity: label.style.opacity
          })
          label.style.opacity = "0"
        })

      Object.values(audioMenuLabels).forEach(
        (label) => {
          labels.push({
            label,
            opacity: label.style.opacity
          })
          label.style.opacity = "0"
        }
      )

      youtubeLabel.style.opacity = "0"

      /*
       * ----------------------------------------------------------
       * Get REAL planet positions from the existing scene.
       * ----------------------------------------------------------
       */

      const getPlanet =
        (name) => {
          const found =
            objects.find(
              (o) =>
                o.mesh &&
                o.mesh.userData &&
                o.mesh.userData.name === name
            )

          return found
            ? found.mesh
            : null
        }

      const worldPosition =
        (object) => {
          const result =
            new THREE.Vector3()

          object.getWorldPosition(result)

          return result
        }

      const planetPoint =
        (name, distance) => {
          const planet =
            getPlanet(name)

          if (!planet)
            return null

          const pos =
            worldPosition(planet)

          /*
           * Approach from the side/front rather than stopping
           * exactly at the planet centre.
           */
          const direction =
            pos.clone()
              .sub(camera.position)
              .normalize()

          return pos.clone()
            .sub(direction.multiplyScalar(distance))
        }

      /*
       * ----------------------------------------------------------
       * REAL 3D METEOR FIELD
       * ----------------------------------------------------------
       */

      const meteorGroup =
        new THREE.Group()

      meteorGroup.name =
        "NYXTRYP_VISUALS_METEORS"

      scene.add(meteorGroup)

      const meteorGeometry =
        new THREE.IcosahedronGeometry(
          0.08,
          1
        )

      const meteorMaterial =
        new THREE.MeshStandardMaterial({
          color: 0x777777,
          roughness: 0.92,
          metalness: 0.05
        })

      const meteorites = []

      for (
        let i = 0;
        i < 90;
        i++
      ) {
        const meteor =
          new THREE.Mesh(
            meteorGeometry,
            meteorMaterial
          )

        meteor.position.set(
          THREE.MathUtils.randFloatSpread(34),
          THREE.MathUtils.randFloatSpread(22),
          THREE.MathUtils.randFloat(-8, -70)
        )

        const scale =
          THREE.MathUtils.randFloat(
            0.35,
            3.2
          )

        meteor.scale.setScalar(scale)

        meteor.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )

        meteor.userData.velocity =
          new THREE.Vector3(
            THREE.MathUtils.randFloat(-0.035, 0.035),
            THREE.MathUtils.randFloat(-0.035, 0.035),
            THREE.MathUtils.randFloat(0.10, 0.38)
          )

        meteor.userData.spin =
          new THREE.Vector3(
            THREE.MathUtils.randFloat(-0.025, 0.025),
            THREE.MathUtils.randFloat(-0.025, 0.025),
            THREE.MathUtils.randFloat(-0.025, 0.025)
          )

        meteorGroup.add(meteor)
        meteorites.push(meteor)
      }

      /*
       * ----------------------------------------------------------
       * REAL SATELLITE CLONES
       *
       * We clone the existing 3D satellite groups so the normal
       * universe is never damaged.
       * ----------------------------------------------------------
       */

      const cinematicSatellites =
        []

      const satelliteNames = [
        "TRACKS",
        "MIXES",
        "RADIO",
        "YOUTUBE"
      ]

      satelliteNames.forEach(
        (name, index) => {
          const original =
            scene.getObjectByName(name)

          if (!original)
            return

          const clone =
            original.clone(true)

          const originalWorld =
            worldPosition(original)

          clone.position.copy(
            originalWorld
          )

          clone.quaternion.copy(
            original.getWorldQuaternion(
              new THREE.Quaternion()
            )
          )

          clone.scale.multiplyScalar(
            1.15
          )

          clone.userData.cinematic =
            true

          clone.userData.index =
            index

          scene.add(clone)

          cinematicSatellites.push(
            clone
          )
        }
      )

      /*
       * ----------------------------------------------------------
       * CAMERA WAYPOINTS
       *
       * These are derived from the ACTUAL planet locations.
       * ----------------------------------------------------------
       */

      const names = [
        "AUDIO",
        "VIDEOS",
        "PHOTOS",
        "RELEASES",
        "GUESTBOOK",
        "ABOUT",
        "SOCIAL"
      ]

      const waypoints = []

      waypoints.push(
        camera.position.clone()
      )

      names.forEach(
        (name) => {
          const point =
            planetPoint(
              name,
              THREE.MathUtils.randFloat(
                2.4,
                4.8
              )
            )

          if (point)
            waypoints.push(point)
        }
      )

      /*
       * Add a final deep-space point.
       */
      waypoints.push(
        new THREE.Vector3(
          0,
          1.5,
          -31
        )
      )

      /*
       * ----------------------------------------------------------
       * Smooth Catmull-Rom flight.
       * ----------------------------------------------------------
       */

      const curve =
        new THREE.CatmullRomCurve3(
          waypoints,
          false,
          "catmullrom",
          0.48
        )

      /*
       * ----------------------------------------------------------
       * Camera motion state.
       * ----------------------------------------------------------
       */

      const flightCamera =
        camera.position.clone()

      const flightLook =
        new THREE.Vector3()

      const previousCamera =
        camera.position.clone()

      let flightRaf = 0
      let lastFrame =
        performance.now()

      /*
       * ----------------------------------------------------------
       * Cinematic black fade + final text.
       * ----------------------------------------------------------
       */

      const fade =
        document.createElement("div")

      Object.assign(fade.style, {
        position: "absolute",
        inset: "0",
        background: "#000",
        opacity: "0",
        pointerEvents: "none",
        transition: "opacity 1.8s ease",
        zIndex: "5"
      })

      overlay.appendChild(fade)

      const finalText =
        document.createElement("div")

      Object.assign(finalText.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: "0",
        transition: "opacity 2.5s ease",
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        pointerEvents: "none",
        zIndex: "10"
      })

      const title =
        document.createElement("div")

      title.textContent =
        "NYXTRYP"

      Object.assign(title.style, {
        fontSize: "clamp(38px, 7vw, 86px)",
        fontWeight: "200",
        letterSpacing: "0.42em",
        marginLeft: "0.42em",
        textShadow: "0 0 35px rgba(180,220,255,.35)"
      })

      const subtitle =
        document.createElement("div")

      subtitle.textContent =
        "SEE YOU"

      Object.assign(subtitle.style, {
        marginTop: "18px",
        fontSize: "11px",
        fontWeight: "300",
        letterSpacing: "0.65em",
        marginLeft: "0.65em",
        opacity: "0.62"
      })

      finalText.appendChild(title)
      finalText.appendChild(subtitle)
      overlay.appendChild(finalText)

      /*
       * ----------------------------------------------------------
       * Mouse / touch steering.
       * ----------------------------------------------------------
       */

      const steer = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
      }

      const pointerMove =
        (event) => {
          const x =
            event.clientX ??
            (event.touches &&
              event.touches[0] &&
              event.touches[0].clientX)

          const y =
            event.clientY ??
            (event.touches &&
              event.touches[0] &&
              event.touches[0].clientY)

          if (
            x == null ||
            y == null
          )
            return

          steer.targetX =
            ((x / window.innerWidth) -
              0.5) * 2

          steer.targetY =
            ((y / window.innerHeight) -
              0.5) * 2
        }

      window.addEventListener(
        "pointermove",
        pointerMove
      )

      /*
       * ----------------------------------------------------------
       * Cinematic flight.
       * ----------------------------------------------------------
       */

      const animateFlight =
        (now) => {
          if (!active)
            return

          const elapsed =
            now - flightStart

          const progress =
            Math.min(
              1,
              elapsed /
                FLIGHT_DURATION
            )

          const dt =
            Math.min(
              0.05,
              (now - lastFrame) /
                1000
            )

          lastFrame = now

          /*
           * Flight acceleration curve:
           * slow departure → acceleration → cruise →
           * violent passes → deep-space braking.
           */
          let curveT

          if (progress < 0.10) {
            const p =
              progress / 0.10

            curveT =
              p * p * 0.12
          } else if (
            progress < 0.78
          ) {
            const p =
              (progress - 0.10) /
              0.68

            curveT =
              0.12 +
              p * 0.68
          } else {
            const p =
              (progress - 0.78) /
              0.22

            curveT =
              0.80 +
              p * 0.20
          }

          const point =
            curve.getPointAt(
              THREE.MathUtils.clamp(
                curveT,
                0,
                1
              )
            )

          const tangent =
            curve.getTangentAt(
              THREE.MathUtils.clamp(
                curveT,
                0,
                0.999
              )
            )

          /*
           * Smooth lateral steering.
           */
          steer.x +=
            (
              steer.targetX -
              steer.x
            ) *
            Math.min(
              1,
              dt * 2.8
            )

          steer.y +=
            (
              steer.targetY -
              steer.y
            ) *
            Math.min(
              1,
              dt * 2.8
            )

          /*
           * Real camera position.
           */
          flightCamera.lerp(
            point,
            Math.min(
              1,
              dt * 5.5
            )
          )

          /*
           * Add subtle ship-like lateral movement.
           * No ship is rendered.
           */
          const side =
            new THREE.Vector3()
              .crossVectors(
                tangent,
                camera.up
              )
              .normalize()

          const up =
            new THREE.Vector3()
              .crossVectors(
                side,
                tangent
              )
              .normalize()

          flightCamera.addScaledVector(
            side,
            steer.x *
              1.35
          )

          flightCamera.addScaledVector(
            up,
            -steer.y *
              0.95
          )

          camera.position.copy(
            flightCamera
          )

          /*
           * Look ahead in the actual 3D world.
           */
          flightLook.copy(
            flightCamera
          )

          flightLook.addScaledVector(
            tangent,
            5.5
          )

          /*
           * Small natural camera roll.
           */
          const roll =
            Math.sin(
              elapsed * 0.00042
            ) *
            0.018 +
            steer.x *
            0.025

          camera.lookAt(
            flightLook
          )

          camera.rotateZ(
            roll
          )

          /*
           * ------------------------------------------------------
           * Meteorites fly toward camera.
           * ------------------------------------------------------
           */

          const speedBoost =
            1 +
            progress *
            2.8

          meteorites.forEach(
            (meteor, index) => {
              const v =
                meteor.userData.velocity

              meteor.position.x +=
                v.x *
                speedBoost

              meteor.position.y +=
                v.y *
                speedBoost

              meteor.position.z +=
                v.z *
                speedBoost

              meteor.rotation.x +=
                meteor.userData.spin.x

              meteor.rotation.y +=
                meteor.userData.spin.y

              meteor.rotation.z +=
                meteor.userData.spin.z

              /*
               * Recycle behind camera.
               */
              const local =
                meteor.position
                  .clone()
                  .sub(
                    camera.position
                  )

              if (
                local.length() > 75 ||
                local.z > 12
              ) {
                meteor.position.copy(
                  camera.position
                )

                meteor.position
                  .addScaledVector(
                    tangent,
                    THREE.MathUtils.randFloat(
                      -45,
                      -18
                    )
                  )

                meteor.position
                  .addScaledVector(
                    side,
                    THREE.MathUtils.randFloat(
                      -16,
                      16
                    )
                  )

                meteor.position
                  .addScaledVector(
                    up,
                    THREE.MathUtils.randFloat(
                      -12,
                      12
                    )
                  )
              }
            }
          )

          /*
           * ------------------------------------------------------
           * Satellite flight.
           * ------------------------------------------------------
           */

          cinematicSatellites.forEach(
            (satellite, index) => {
              const phase =
                elapsed *
                (0.00025 +
                  index *
                  0.000035)

              satellite.position.add(
                new THREE.Vector3(
                  Math.sin(phase * 1.7 + index) *
                    dt *
                    2.2,
                  Math.cos(phase * 1.3 + index) *
                    dt *
                    1.6,
                  Math.sin(phase * 0.9 + index) *
                    dt *
                    3.8
                )
              )

              satellite.rotation.y +=
                dt *
                (0.35 +
                  index *
                  0.11)

              /*
               * If a satellite gets far behind,
               * bring it back ahead of the camera.
               */
              const relative =
                satellite.position
                  .clone()
                  .sub(
                    camera.position
                  )

              if (
                relative.length() > 55
              ) {
                satellite.position.copy(
                  camera.position
                )

                satellite.position
                  .addScaledVector(
                    tangent,
                    THREE.MathUtils.randFloat(
                      -18,
                      6
                    )
                  )

                satellite.position
                  .addScaledVector(
                    side,
                    THREE.MathUtils.randFloat(
                      -10,
                      10
                    )
                  )

                satellite.position
                  .addScaledVector(
                    up,
                    THREE.MathUtils.randFloat(
                      -8,
                      8
                    )
                  )
              }
            }
          )

          /*
           * ------------------------------------------------------
           * Deep-space braking.
           * ------------------------------------------------------
           */

          if (
            progress > 0.84
          ) {
            const fadeProgress =
              (
                progress -
                0.84
              ) /
              0.16

            fade.style.opacity =
              String(
                Math.min(
                  0.92,
                  fadeProgress *
                    1.25
                )
              )
          }

          /*
           * Final destination.
           */
          if (
            progress >= 1 &&
            !finished
          ) {
            finished = true

            fade.style.opacity =
              "1"

            setTimeout(
              () => {
                finalText.style.opacity =
                  "1"
              },
              1500
            )

            /*
             * Keep the scene alive behind
             * the final message.
             */
          }

          /*
           * Render the REAL Three.js scene.
           */
          renderer.render(
            scene,
            camera
          )

          previousCamera.copy(
            camera.position
          )

          flightRaf =
            requestAnimationFrame(
              animateFlight
            )
        }

      /*
       * Close restores the exact camera state.
       */
      const cleanup =
        () => {
          if (!active)
            return

          active = false

          cancelAnimationFrame(
            flightRaf
          )

          window.removeEventListener(
            "pointermove",
            pointerMove
          )

          meteorGroup.removeFromParent()

          cinematicSatellites.forEach(
            (satellite) => {
              satellite.removeFromParent()
            }
          )

          meteorGeometry.dispose()
          meteorMaterial.dispose()

          camera.position.copy(
            savedCameraPosition
          )

          camera.quaternion.copy(
            savedCameraQuaternion
          )

          cameraTarget.copy(
            savedCameraTarget
          )

          lookTarget.copy(
            savedLookTarget
          )

          cameraDistance =
            savedCameraDistance

          selectedPlanet =
            savedSelectedPlanet

          renderer.setPixelRatio(
            savedPixelRatio
          )

          labels.forEach(
            ({
              label,
              opacity
            }) => {
              label.style.opacity =
                opacity
            }
          )

          youtubeLabel.style.opacity =
            "0"

          overlay.remove()

          renderer.render(
            scene,
            camera
          )
        }

      close.addEventListener(
        "click",
        cleanup
      )

      /*
       * Escape closes manually.
       */
      const escape =
        (event) => {
          if (
            event.key === "Escape"
          ) {
            cleanup()

            window.removeEventListener(
              "keydown",
              escape
            )
          }
        }

      window.addEventListener(
        "keydown",
        escape
      )

      /*
       * Start immediately.
       */
      requestAnimationFrame(
        animateFlight
      )

      return
    }

        if (hit.userData.name === "GUESTBOOK") {
          diagnosticAction("GUESTBOOK opened")

          const old = document.getElementById(
            "nyxtryp-guestbook-window"
          )
          if (old) old.remove()

          const style = document.createElement("style")
          style.id = "nyxtryp-guestbook-style"

          style.textContent = `
            #nyxtryp-guestbook-window {
              position: fixed;
              inset: 0;
              z-index: 100000;
              overflow: hidden;
              background:
                radial-gradient(circle at 50% 42%, rgba(110,125,170,.13), transparent 30%),
                radial-gradient(circle at 20% 80%, rgba(80,95,150,.07), transparent 25%),
                linear-gradient(180deg, #03050b 0%, #000 100%);
              color: #fff;
              font-family: Arial, Helvetica, sans-serif;
              animation: nyxtrypGuestbookIn .55s ease;
            }

            #nyxtryp-guestbook-window::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              background:
                radial-gradient(circle at 12% 18%, rgba(255,255,255,.7) 0 1px, transparent 1.5px),
                radial-gradient(circle at 78% 22%, rgba(255,255,255,.45) 0 1px, transparent 1.5px),
                radial-gradient(circle at 34% 76%, rgba(255,255,255,.35) 0 1px, transparent 1.5px),
                radial-gradient(circle at 88% 72%, rgba(255,255,255,.5) 0 1px, transparent 1.5px),
                radial-gradient(circle at 55% 14%, rgba(255,255,255,.3) 0 1px, transparent 1.5px);
              opacity: .7;
            }

            @keyframes nyxtrypGuestbookIn {
              from {
                opacity: 0;
                transform: scale(1.015);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .nyxtryp-guestbook-page {
              position: relative;
              z-index: 1;
              min-height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 30px;
              box-sizing: border-box;
            }

            .nyxtryp-guestbook-close {
              position: fixed;
              top: 26px;
              right: 30px;
              width: 46px;
              height: 46px;
              border: 1px solid rgba(255,255,255,.2);
              border-radius: 50%;
              background: rgba(255,255,255,.035);
              color: rgba(255,255,255,.8);
              font-size: 28px;
              font-weight: 200;
              line-height: 1;
              cursor: pointer;
              transition: .25s ease;
              z-index: 3;
            }

            .nyxtryp-guestbook-close:hover {
              background: rgba(255,255,255,.1);
              border-color: rgba(255,255,255,.45);
              color: #fff;
              transform: rotate(90deg);
            }

            .nyxtryp-guestbook-center {
              width: min(820px, 100%);
              text-align: center;
            }

            .nyxtryp-guestbook-kicker {
              font-size: 10px;
              letter-spacing: .55em;
              opacity: .35;
              margin-bottom: 25px;
            }

            .nyxtryp-guestbook-title {
              margin: 0;
              font-size: clamp(48px, 9vw, 108px);
              line-height: .9;
              font-weight: 200;
              letter-spacing: .12em;
            }

            .nyxtryp-guestbook-line {
              width: min(520px, 75%);
              height: 1px;
              margin: 30px auto 25px;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,.45),
                transparent
              );
            }

            .nyxtryp-guestbook-status {
              font-size: 11px;
              letter-spacing: .38em;
              opacity: .45;
              margin-bottom: 18px;
            }

            .nyxtryp-guestbook-text {
              max-width: 560px;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.9;
              letter-spacing: .08em;
              opacity: .42;
            }

            .nyxtryp-guestbook-mark {
              width: 7px;
              height: 7px;
              margin: 32px auto 0;
              border: 1px solid rgba(255,255,255,.45);
              transform: rotate(45deg);
              opacity: .5;
            }

            .nyxtryp-guestbook-bottom {
              position: absolute;
              bottom: 28px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              letter-spacing: .42em;
              opacity: .2;
            }

            @media (max-width: 600px) {
              .nyxtryp-guestbook-page {
                padding: 20px;
              }

              .nyxtryp-guestbook-close {
                top: 16px;
                right: 16px;
                width: 42px;
                height: 42px;
                font-size: 25px;
              }

              .nyxtryp-guestbook-title {
                font-size: clamp(42px, 14vw, 70px);
              }

              .nyxtryp-guestbook-status {
                font-size: 9px;
                letter-spacing: .28em;
              }

              .nyxtryp-guestbook-text {
                font-size: 11px;
                line-height: 1.8;
              }
            }
          `

          document.head.appendChild(style)

          const overlay = document.createElement("div")
          overlay.id = "nyxtryp-guestbook-window"

          overlay.innerHTML = `
            <div class="nyxtryp-guestbook-page">
              <button
                class="nyxtryp-guestbook-close"
                aria-label="Close"
              >×</button>

              <div class="nyxtryp-guestbook-center">
                <div class="nyxtryp-guestbook-kicker">
                  NYXTRYP / WORLD
                </div>

                <h1 class="nyxtryp-guestbook-title">
                  GUESTBOOK
                </h1>

                <div class="nyxtryp-guestbook-line"></div>

                <div class="nyxtryp-guestbook-status">
                  COMING SOON
                </div>

                <p class="nyxtryp-guestbook-text">
                  THE GUESTBOOK IS CURRENTLY BEING PREPARED.
                  <br>
                  LEAVE YOUR TRACE HERE SOON.
                </p>

                <div class="nyxtryp-guestbook-mark"></div>
              </div>

              <div class="nyxtryp-guestbook-bottom">
                YOU WERE HERE.
              </div>
            </div>
          `

          document.body.appendChild(overlay)

          const closeGuestbook = () => {
            overlay.remove()
            style.remove()
            window.removeEventListener("keydown", onKeyDown)
          }

          const onKeyDown = (event) => {
            if (event.key === "Escape") {
              closeGuestbook()
            }
          }

          overlay
            .querySelector(".nyxtryp-guestbook-close")
            .addEventListener("click", closeGuestbook)

          window.addEventListener(
            "keydown",
            onKeyDown
          )

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        if (hit.userData.name === "SOCIAL") {
          diagnosticAction("SOCIAL opened")

          const old = document.getElementById("nyxtryp-social-window")
          if (old) old.remove()

          const socials = [
            {
              name: "WEBSITE",
              url: "https://nyxtryp.vercel.app",
              icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z"/></svg>`
            },
            {
              name: "TELEGRAM",
              url: "https://t.me/nyxtryp",
              icon: `<svg viewBox="0 0 24 24"><path d="M21 4 3.8 10.6c-.9.35-.85 1.65.08 1.9l4.3 1.2 1.65 5.05c.27.83 1.32 1.08 1.88.45l2.45-2.75 3.85 2.85c.72.53 1.75.12 1.92-.76L23 5.45C23.2 4.5 22 3.65 21 4Z"/><path d="m8.3 13.7 8.8-5.4-6.45 7.2"/></svg>`
            },
            {
              name: "YOUTUBE",
              url: "https://www.youtube.com/@nyxtryp",
              icon: `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10 9 5 3-5 3V9Z"/></svg>`
            },
            {
              name: "TIKTOK",
              url: "https://www.tiktok.com/@nyxtryp",
              icon: `<svg viewBox="0 0 24 24"><path d="M14 4v10.2a4.3 4.3 0 1 1-3.4-4.2"/><path d="M14 4c1.1 2.7 2.8 4.2 5.5 4.4"/></svg>`
            },
            {
              name: "INSTAGRAM",
              url: "https://www.instagram.com/nyxtryp/",
              icon: `<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r="1"/></svg>`
            }
          ]

          const overlay = document.createElement("div")
          overlay.id = "nyxtryp-social-window"

          overlay.innerHTML = `
            <div class="nyxtryp-social-page">
              <button class="nyxtryp-social-close" aria-label="Close">×</button>

              <div class="nyxtryp-social-head">
                <div class="nyxtryp-social-kicker">NYXTRYP</div>
                <h1>SOCIAL</h1>
                <div class="nyxtryp-social-line"></div>
                <p>CONNECT WITH NYXTRYP</p>
              </div>

              <div class="nyxtryp-social-links">
                ${socials.map((item, i) => `
                  <a class="nyxtryp-social-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
                    <span class="nyxtryp-social-number">0${i + 1}</span>
                    <span class="nyxtryp-social-icon">${item.icon}</span>
                    <span class="nyxtryp-social-info">
                      <strong>${item.name}</strong>
                      <small>NYXTRYP</small>
                    </span>
                    <span class="nyxtryp-social-arrow">↗</span>
                  </a>
                `).join("")}
              </div>
            </div>
          `

          const style = document.createElement("style")
          style.textContent = `
            #nyxtryp-social-window {
              position: fixed;
              inset: 0;
              z-index: 99999;
              overflow: auto;
              background:
                radial-gradient(circle at 50% 25%, rgba(255,255,255,.08), transparent 32%),
                linear-gradient(180deg, rgba(3,4,8,.97), rgba(0,0,0,.99));
              color: #fff;
              font-family: Arial, Helvetica, sans-serif;
            }

            .nyxtryp-social-page {
              min-height: 100%;
              box-sizing: border-box;
              padding: 8vh 8vw 7vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              position: relative;
            }

            .nyxtryp-social-close {
              position: fixed;
              top: 28px;
              right: 34px;
              z-index: 2;
              width: 48px;
              height: 48px;
              border: 1px solid rgba(255,255,255,.2);
              border-radius: 50%;
              background: rgba(255,255,255,.04);
              color: rgba(255,255,255,.85);
              font-size: 32px;
              font-weight: 200;
              line-height: 42px;
              cursor: pointer;
              transition: .25s ease;
            }

            .nyxtryp-social-close:hover {
              background: rgba(255,255,255,.12);
              border-color: rgba(255,255,255,.45);
              transform: rotate(90deg);
            }

            .nyxtryp-social-head {
              max-width: 900px;
              width: 100%;
              margin: 0 auto 48px;
            }

            .nyxtryp-social-kicker {
              font-size: 11px;
              letter-spacing: .45em;
              color: rgba(255,255,255,.38);
              margin-bottom: 14px;
            }

            .nyxtryp-social-head h1 {
              margin: 0;
              font-size: clamp(48px, 9vw, 110px);
              line-height: .9;
              font-weight: 300;
              letter-spacing: .08em;
            }

            .nyxtryp-social-line {
              width: 100%;
              height: 1px;
              margin: 26px 0 15px;
              background: linear-gradient(90deg, rgba(255,255,255,.5), rgba(255,255,255,.04));
            }

            .nyxtryp-social-head p {
              margin: 0;
              font-size: 11px;
              letter-spacing: .3em;
              color: rgba(255,255,255,.42);
            }

            .nyxtryp-social-links {
              width: 100%;
              max-width: 900px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .nyxtryp-social-link {
              min-height: 105px;
              box-sizing: border-box;
              display: grid;
              grid-template-columns: 34px 52px 1fr 30px;
              align-items: center;
              gap: 18px;
              padding: 0 24px;
              border: 1px solid rgba(255,255,255,.11);
              border-radius: 4px;
              background: rgba(255,255,255,.035);
              color: white;
              text-decoration: none;
              position: relative;
              overflow: hidden;
              transition: transform .25s ease, background .25s ease, border-color .25s ease;
            }

            .nyxtryp-social-link::before {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.08), transparent 70%);
              transform: translateX(-100%);
              transition: transform .6s ease;
            }

            .nyxtryp-social-link:hover {
              transform: translateY(-4px);
              background: rgba(255,255,255,.08);
              border-color: rgba(255,255,255,.3);
            }

            .nyxtryp-social-link:hover::before {
              transform: translateX(100%);
            }

            .nyxtryp-social-number {
              font-size: 10px;
              letter-spacing: .1em;
              color: rgba(255,255,255,.25);
            }

            .nyxtryp-social-icon {
              width: 48px;
              height: 48px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid rgba(255,255,255,.16);
              border-radius: 50%;
              background: rgba(255,255,255,.045);
            }

            .nyxtryp-social-icon svg {
              width: 23px;
              height: 23px;
              fill: none;
              stroke: currentColor;
              stroke-width: 1.45;
              stroke-linecap: round;
              stroke-linejoin: round;
            }

            .nyxtryp-social-info {
              display: flex;
              flex-direction: column;
              gap: 7px;
            }

            .nyxtryp-social-info strong {
              font-size: 14px;
              font-weight: 500;
              letter-spacing: .18em;
            }

            .nyxtryp-social-info small {
              font-size: 10px;
              letter-spacing: .2em;
              color: rgba(255,255,255,.38);
            }

            .nyxtryp-social-arrow {
              font-size: 24px;
              color: rgba(255,255,255,.45);
              transition: transform .25s ease, color .25s ease;
            }

            .nyxtryp-social-link:hover .nyxtryp-social-arrow {
              transform: translate(3px,-3px);
              color: white;
            }

            @media (max-width: 700px) {
              .nyxtryp-social-page {
                padding: 70px 18px 30px;
              }

              .nyxtryp-social-close {
                top: 18px;
                right: 18px;
                width: 42px;
                height: 42px;
                font-size: 28px;
              }

              .nyxtryp-social-head {
                margin-bottom: 30px;
              }

              .nyxtryp-social-head h1 {
                font-size: 52px;
              }

              .nyxtryp-social-links {
                grid-template-columns: 1fr;
                gap: 9px;
              }

              .nyxtryp-social-link {
                min-height: 82px;
                grid-template-columns: 25px 44px 1fr 24px;
                gap: 12px;
                padding: 0 14px;
              }

              .nyxtryp-social-icon {
                width: 40px;
                height: 40px;
              }

              .nyxtryp-social-icon svg {
                width: 20px;
                height: 20px;
              }

              .nyxtryp-social-info strong {
                font-size: 12px;
                letter-spacing: .14em;
              }
            }
          `

          document.head.appendChild(style)
          document.body.appendChild(overlay)

          const close = overlay.querySelector(".nyxtryp-social-close")
          close.onclick = () => {
            overlay.remove()
            style.remove()
          }

          overlay.onclick = (event) => {
            if (event.target === overlay) {
              overlay.remove()
              style.remove()
            }
          }

          return
        }

if (hit.userData.name === "PHOTOS") {

          const old = document.getElementById("nyxtryp-photos-window")
          if (old) old.remove()

          const photos = [
            "/photos/photo-01.png",
            "/photos/photo-02.png",
            "/photos/photo-03.png",
            "/photos/photo-04.webp",
            "/photos/photo-05.png",
            "/photos/photo-06.png",
            "/photos/photo-07.png",
            "/photos/photo-08.png",
            "/photos/photo-09.png",
            "/photos/photo-10.png",
            "/photos/photo-11.webp",
            "/photos/photo-12.webp",
            "/photos/photo-13.webp",
            "/photos/photo-14.jpg",
            "/photos/photo-15.jpg",
            "/photos/photo-16.jpg",
            "/photos/photo-17.jpg",
            "/photos/photo-18.jpg",
            "/photos/photo-19.jpg"
          ]

          fetch("/api/media", { cache: "no-store" })
            .then(r => r.ok ? r.json() : Promise.reject(new Error("media api failed")))
            .then(data => {
              if (!Array.isArray(data.photos) || !data.photos.length) return

              photos.splice(
                0,
                photos.length,
                ...data.photos.map(name => `/photos/${encodeURIComponent(name)}`)
              )

              if (photos.length) {
                index = Math.min(index, photos.length - 1)
                syncThumbs()
                update()
              }
            })
            .catch(() => {})

          let index = 0

          const overlay = document.createElement("div")
          overlay.id = "nyxtryp-photos-window"

          Object.assign(overlay.style, {
            position: "absolute",
            inset: "0",
            zIndex: "100",
            background: "rgba(0,0,0,0.96)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden"
          })

          const close = document.createElement("button")
          close.textContent = "×"

          Object.assign(close.style, {
            position: "absolute",
            right: "20px",
            top: "10px",
            zIndex: "20",
            border: "0",
            background: "transparent",
            color: "#fff",
            fontSize: "36px",
            cursor: "pointer"
          })

          close.onclick = () => overlay.remove()
          overlay.appendChild(close)

          const main = document.createElement("div")

          Object.assign(main.style, {
            position: "relative",
            width: "100%",
            flex: "1",
            minHeight: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 65px 15px",
            boxSizing: "border-box"
          })

          const image = document.createElement("img")

          Object.assign(image.style, {
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            userSelect: "none"
          })

          image.draggable = false
          main.appendChild(image)

          const arrow = (symbol, side) => {
            const b = document.createElement("button")
            b.textContent = symbol

            Object.assign(b.style, {
              position: "absolute",
              top: "50%",
              [side]: "10px",
              transform: "translateY(-50%)",
              width: "46px",
              height: "80px",
              border: "0",
              background: "transparent",
              color: "#fff",
              fontSize: "40px",
              cursor: "pointer",
              zIndex: "10"
            })

            return b
          }

          const prev = arrow("‹", "left")
          const next = arrow("›", "right")

          main.appendChild(prev)
          main.appendChild(next)
          overlay.appendChild(main)

          const thumbs = document.createElement("div")

          Object.assign(thumbs.style, {
            width: "100%",
            height: "90px",
            flexShrink: "0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
            overflowY: "hidden",
            padding: "8px 16px 14px",
            boxSizing: "border-box"
          })

          overlay.appendChild(thumbs)

          const thumbList = []

          const update = () => {
            image.src = photos[index]

            thumbList.forEach((t, i) => {
              t.style.opacity = i === index ? "1" : "0.45"
              t.style.borderColor =
                i === index
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.25)"
            })

            if (thumbList[index]) {
              thumbList[index].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
              })
            }
          }

          const syncThumbs = () => {

          thumbs.innerHTML = ""
          thumbList.length = 0

          photos.forEach((src, i) => {
            const t = document.createElement("button")

            Object.assign(t.style, {
              flex: "0 0 72px",
              width: "72px",
              height: "62px",
              padding: "0",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "#080808",
              overflow: "hidden",
              cursor: "pointer",
              opacity: "0.45"
            })

            const ti = document.createElement("img")
            ti.src = src

            Object.assign(ti.style, {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            })

            t.appendChild(ti)

            t.onclick = () => {
              index = i
              update()
            }

            thumbs.appendChild(t)
            thumbList.push(t)
          })

          }

          syncThumbs()

          prev.onclick = () => {
            index = (index - 1 + photos.length) % photos.length
            update()
          }

          next.onclick = () => {
            index = (index + 1) % photos.length
            update()
          }

          let startX = 0

          main.addEventListener("touchstart", e => {
            if (e.touches.length)
              startX = e.touches[0].clientX
          }, { passive: true })

          main.addEventListener("touchend", e => {
            if (!e.changedTouches.length) return

            const dx = e.changedTouches[0].clientX - startX

            if (Math.abs(dx) > 50) {
              index = dx < 0
                ? (index + 1) % photos.length
                : (index - 1 + photos.length) % photos.length

              update()
            }
          }, { passive: true })

          const keys = e => {
            if (!document.body.contains(overlay)) {
              window.removeEventListener("keydown", keys)
              return
            }

            if (e.key === "ArrowLeft") {
              index = (index - 1 + photos.length) % photos.length
              update()
            }

            if (e.key === "ArrowRight") {
              index = (index + 1) % photos.length
              update()
            }

            if (e.key === "Escape") {
              overlay.remove()
              window.removeEventListener("keydown", keys)
            }
          }

          window.addEventListener("keydown", keys)

          document.body.appendChild(overlay)

          update()

          return
        }

        // ======================================================
        // ABOUT CLICK
        // Opens the NYXTRYP story window only after ABOUT arrives.
        // No extra satellite.
        // ======================================================

        if (
          hit.userData.name === "ABOUT"
        ) {

          const existingAbout =
            document.getElementById(
              "nyxtryp-about-window"
            )

          if (existingAbout) {
            existingAbout.remove()
          }

          const overlay =
            document.createElement("div")

          overlay.id =
            "nyxtryp-about-window"

          overlay.style.position =
            "absolute"

          overlay.style.inset =
            "0"

          overlay.style.zIndex =
            "100"

          overlay.style.background =
            "rgba(0,0,0,0.94)"

          overlay.style.display =
            "flex"

          overlay.style.alignItems =
            "center"

          overlay.style.justifyContent =
            "center"

          overlay.style.overflow =
            "hidden"

          overlay.style.fontFamily =
            "Arial, Helvetica, sans-serif"

          const close =
            document.createElement("button")

          close.textContent =
            "×"

          close.style.position =
            "absolute"

          close.style.right =
            "24px"

          close.style.top =
            "18px"

          close.style.zIndex =
            "5"

          close.style.border =
            "0"

          close.style.background =
            "transparent"

          close.style.color =
            "#ffffff"

          close.style.fontSize =
            "30px"

          close.style.fontWeight =
            "200"

          close.style.cursor =
            "pointer"

          close.style.opacity =
            "0.75"

          close.onclick =
            () => overlay.remove()

          overlay.appendChild(
            close
          )

          const lang =
            document.createElement("div")

          lang.style.position =
            "absolute"

          lang.style.right =
            "30px"

          lang.style.bottom =
            "24px"

          lang.style.zIndex =
            "5"

          lang.style.color =
            "rgba(255,255,255,0.55)"

          lang.style.fontSize =
            "10px"

          lang.style.letterSpacing =
            "0.25em"

          lang.style.cursor =
            "pointer"

          lang.textContent =
            "RU / EN"

          overlay.appendChild(
            lang
          )

          const content =
            document.createElement("div")

          content.style.position =
            "relative"

          content.style.width =
            "min(900px, 86vw)"

          content.style.height =
            "min(650px, 78vh)"

          content.style.display =
            "flex"

          content.style.flexDirection =
            "column"

          content.style.alignItems =
            "center"

          content.style.justifyContent =
            "center"

          content.style.overflow =
            "hidden"

          overlay.appendChild(
            content
          )

          const logo =
            document.createElement("div")

          logo.textContent =
            "NYXTRYP"

          logo.style.position =
            "absolute"

          logo.style.left =
            "0"

          logo.style.right =
            "0"

          logo.style.top =
            "50%"

          logo.style.transform =
            "translateY(-50%)"

          logo.style.textAlign =
            "center"

          logo.style.color =
            "#ffffff"

          logo.style.fontSize =
            "clamp(48px, 9vw, 110px)"

          logo.style.fontWeight =
            "300"

          logo.style.letterSpacing =
            "0.18em"

          logo.style.transition =
            "top 1.6s cubic-bezier(0.22,1,0.36,1), transform 1.6s cubic-bezier(0.22,1,0.36,1), opacity 1.2s ease"

          content.appendChild(
            logo
          )

          const text =
            document.createElement("div")

          text.style.position =
            "absolute"

          text.style.left =
            "0"

          text.style.right =
            "0"

          text.style.top =
            "120px"

          text.style.maxWidth =
            "760px"

          text.style.margin =
            "0 auto"

          text.style.color =
            "rgba(255,255,255,0.86)"

          text.style.fontSize =
            "clamp(14px, 1.5vw, 18px)"

          text.style.lineHeight =
            "1.9"

          text.style.letterSpacing =
            "0.04em"

          text.style.fontWeight =
            "300"

          text.style.whiteSpace =
            "pre-line"

          text.style.opacity =
            "0"

          const englishText =
            "NYXTRYP is an independent electronic music project built around atmosphere, motion and immersion.\n\nThe sound moves between trance, psytrance, deep and organic electronic music — exploring hypnotic rhythms, evolving textures and emotional space.\n\nNYXTRYP is not tied to one genre or one formula. It is a constantly evolving universe where sound, visuals and technology meet.\n\nEnter the world. Explore the sound.\nStay in motion."

          const russianText =
            "NYXTRYP — независимый электронный музыкальный проект, построенный вокруг атмосферы, движения и погружения.\n\nЗвучание проходит через trance, psytrance, deep и organic electronic music — соединяя гипнотические ритмы, развивающиеся текстуры и эмоциональное пространство.\n\nNYXTRYP не привязан к одному жанру или одной формуле. Это постоянно развивающаяся вселенная, где встречаются звук, визуал и технологии.\n\nВойди во вселенную. Исследуй звук.\nОставайся в движении."

          let currentText =
            englishText

          let typingTimer = null

          const typeText =
            () => {
              if (typingTimer) {
                clearInterval(
                  typingTimer
                )
              }

              text.textContent =
                ""

              let index = 0

              text.style.opacity =
                "1"

              typingTimer =
                setInterval(
                  () => {
                    text.textContent =
                      currentText.slice(
                        0,
                        index
                      )

                    index += 1

                    if (
                      index >
                      currentText.length
                    ) {
                      clearInterval(
                        typingTimer
                      )
                    }
                  },
                  18
                )
            }

          lang.onclick =
            () => {
              currentText =
                currentText === englishText
                  ? russianText
                  : englishText

              typeText()
            }

          content.appendChild(
            text
          )

          requestAnimationFrame(
            () => {
              setTimeout(
                () => {

                  logo.style.top =
                    "8%"

                  logo.style.transform =
                    "translateY(0)"

                  logo.style.fontSize =
                    "clamp(24px, 4vw, 48px)"

                  logo.style.letterSpacing =
                    "0.22em"

                  setTimeout(
                    () => {
                      typeText()
                    },
                    700
                  )

                },
                150
              )
            }
          )

          overlay.onclick =
            (event) => {
              if (
                event.target === overlay
              ) {
                overlay.remove()
              }
            }

          el.appendChild(
            overlay
          )

          isDragging = false
          pointerMoved = false
          pendingReturn = false

          return
        }

        if (
          selectedPlanet ===
          hit
        ) {
          pendingReturn =
            true

          pointerMoved =
            false

          isDragging =
            true

          lastX =
            event.clientX

          lastY =
            event.clientY

          canvas.style.cursor =
            "grabbing"

          return
        }

        pendingReturn =
          false

        pointerMoved =
          false

        selectedPlanet =
          hit

        audioMenuActive =
          hit.userData.name === "AUDIO"

        // Click = select planet and start smooth approach.
        cameraDistance =
          THREE.MathUtils.clamp(
            hit.geometry.parameters.radius * 7,
            4.5,
            8
          )

        isDragging = true

        lastX =
          event.clientX

        lastY =
          event.clientY

        canvas.style.cursor =
          "grabbing"
      }

    const onPointerUp =
      () => {
        isDragging =
          false

        if (
          pendingReturn &&
          !pointerMoved
        ) {
          selectedPlanet =
            null

          audioMenuActive =
            false

          cameraDistance =
            17
        }

        pendingReturn =
          false

        pointerMoved =
          false

        if (
          hoveredPlanet
        ) {
          canvas.style.cursor =
            "pointer"
        } else {
          canvas.style.cursor =
            "default"
        }
      }

    const onWheel =
      (event) => {
        event.preventDefault()

        if (
          !selectedPlanet
        )
          return

        cameraDistance +=
          event.deltaY * 0.012

        cameraDistance =
          THREE.MathUtils.clamp(
            cameraDistance,
            Math.max(
              1.8,
              selectedPlanet
                .geometry
                .parameters
                .radius * 2.2
            ),
            17
          )
      }

    canvas.addEventListener(
      "pointermove",
      onPointerMove
    )

    canvas.addEventListener(
      "pointerdown",
      onPointerDown
    )

    canvas.addEventListener(
      "pointerup",
      onPointerUp
    )

    canvas.addEventListener(
      "pointercancel",
      onPointerUp
    )

    canvas.addEventListener(
      "wheel",
      onWheel,
      {
        passive: false
      }
    )

    // ============================================================
    // ANIMATION
    // ============================================================

    let animationId
    let webglContextLost = false

    const animate =
      () => {
        if (webglContextLost) {
          return
        }

        try {
          const t =
            performance.now() *
            0.001

      diagnosticFrames += 1

      const frameNow =
        performance.now()

      const frameDelta =
        frameNow - diagnosticLastFrame

      diagnosticLastFrame =
        frameNow

      if (frameDelta > 0) {
        diagnosticFps =
          Math.round(1000 / frameDelta)
      }

      if (
        diagnosticFrames % 60 === 0 &&
        diagnosticBox
      ) {
        showDiagnostic(
          "WEBGL RUNNING",
          "No context loss detected yet."
        )
      }

        objects.forEach(
          (object) => {
            const {
              mesh,
              speed,
              base,
              driftX,
              driftY,
              driftZ,
              ampX,
              ampY,
              ampZ,
              phaseX,
              phaseY,
              phaseZ
            } = object

            // ======================================================
            // MOVE PLANET NAME WITH PLANET
            // ======================================================

            if (object.nameLabel) {

              const labelPosition =
                new THREE.Vector3()

              mesh.getWorldPosition(
                labelPosition
              )

              labelPosition.y +=
                mesh.geometry.parameters.radius * 1.6

              labelPosition.project(
                camera
              )

              const rect =
                canvas.getBoundingClientRect()

              object.nameLabel.style.left =
                ((labelPosition.x + 1) / 2 * rect.width) + "px"

              object.nameLabel.style.top =
                ((-labelPosition.y + 1) / 2 * rect.height) + "px"


              const direction =
                mesh.position.clone()
                  .sub(camera.position)
                  .normalize()

              const raycaster =
                new THREE.Raycaster(
                  camera.position,
                  direction
                )

              const blockers =
                objects
                  .filter(
                    (obj) =>
                      obj.mesh !== mesh
                  )
                  .map(
                    (obj) =>
                      obj.mesh
                  )

              const hits =
                raycaster.intersectObjects(
                  blockers,
                  false
                )

              object.nameLabel.style.opacity =
                hits.length
                  ? "0"
                  : "0.8"
            }

            if (
              mesh !==
              selectedPlanet
            ) {
              if (mesh.userData.name === "VIDEOS") {
                mesh.rotation.y -=
                  speed
              } else {
                mesh.rotation.y +=
                  speed
              }
            }

            // ======================================================
            // VIDEOS / YOUTUBE SATELLITE MOTION
            // ======================================================

            const videosSatellites =
              mesh.userData.videosSatellites

            if (videosSatellites) {

              const youtube =
                videosSatellites.userData.youtube

              const orbitRadius =
                videosSatellites.userData.orbitRadius

              const videosActive =
                mesh === selectedPlanet &&
                cameraDistance < 10

              if (videosActive) {

                // Keep YOUTUBE strictly left on screen,
                // even when VIDEOS itself is manually rotated.
                const inverseQuaternion =
                  videosSatellites.userData.inverseQuaternion

                inverseQuaternion.copy(
                  mesh.quaternion
                ).invert()

                const targetPosition =
                  videosSatellites.userData.targetPosition

                targetPosition.set(
                  -orbitRadius,
                  0,
                  0
                ).applyQuaternion(
                  inverseQuaternion
                )

                youtube.position.lerp(
                  targetPosition,
                  0.08
                )

              } else {

                // YOUTUBE itself rotates while orbiting.
                youtube.rotation.y -=
                  speed * 2.0

                // Horizontal orbit around VIDEOS.
                // Opposite direction to VIDEOS rotation.
                videosSatellites.userData.orbitAngle -=
                  speed * 6.0

                const angle =
                  videosSatellites.userData.orbitAngle

                youtube.position.set(
                  Math.cos(angle) *
                    orbitRadius,
                  0,
                  Math.sin(angle) *
                    orbitRadius
                )
              }

              // Show YOUTUBE label only when VIDEOS arrives.
              const worldPosition =
                videosSatellites.userData.worldPosition

              youtube.getWorldPosition(
                worldPosition
              )

              worldPosition.y +=
                mesh.geometry.parameters.radius *
                0.65

              worldPosition.project(
                camera
              )

              const rect =
                canvas.getBoundingClientRect()

              youtubeLabel.style.left =
                ((worldPosition.x + 1) / 2 *
                  rect.width) +
                "px"

              youtubeLabel.style.top =
                ((-worldPosition.y + 1) / 2 *
                  rect.height) +
                "px"

              youtubeLabel.style.opacity =
                videosActive
                  ? "0.8"
                  : "0"

              if (
                videosActive &&
                object.nameLabel
              ) {
                object.nameLabel.style.opacity =
                  "0.8"
              }

              if (
                videosActive &&
                object.nameLabel
              ) {
                object.nameLabel.style.opacity =
                  "0.8"
              }

              // VIDEOS label keeps its normal visibility logic.
              // YOUTUBE label is shown on arrival together with it.
            }

            // ======================================================
            // AUDIO MENU SATELLITE MOTION
            // ======================================================

            const satellites =
              mesh.userData.audioSatellites

            if (satellites) {

              const menuPositions =
                satellites.userData.menuPositions

              const freePositions =
                satellites.userData.freePositions

              if (
                menuPositions &&
                freePositions
              ) {

                const menuActiveForThisPlanet =
                  audioMenuActive &&
                  mesh === selectedPlanet

                // AUDIO itself keeps its normal 3D rotation,
                // but the menu counter-rotates against it.
                // This keeps the three satellites visually
                // aligned to the user's screen.
                const inverseParentQuaternion =
                  mesh.quaternion.clone().invert()

                const menuWorldPositions = {
                  TRACKS:
                    menuPositions.TRACKS.clone(),

                  MIXES:
                    menuPositions.MIXES.clone(),

                  RADIO:
                    menuPositions.RADIO.clone()
                }

                const menuLocalPositions = {
                  TRACKS:
                    menuWorldPositions.TRACKS
                      .applyQuaternion(
                        inverseParentQuaternion
                      ),

                  MIXES:
                    menuWorldPositions.MIXES
                      .applyQuaternion(
                        inverseParentQuaternion
                      ),

                  RADIO:
                    menuWorldPositions.RADIO
                      .applyQuaternion(
                        inverseParentQuaternion
                      )
                }

                const targets = {
                  TRACKS:
                    menuActiveForThisPlanet
                      ? menuLocalPositions.TRACKS
                      : freePositions.TRACKS,

                  MIXES:
                    menuActiveForThisPlanet
                      ? menuLocalPositions.MIXES
                      : freePositions.MIXES,

                  RADIO:
                    menuActiveForThisPlanet
                      ? menuLocalPositions.RADIO
                      : freePositions.RADIO
                }

                const menuRotations =
                  satellites.userData.menuRotations

                const tracksObject =
                  satellites.getObjectByName(
                    "TRACKS"
                  )

                const mixesObject =
                  satellites.getObjectByName(
                    "MIXES"
                  )

                const radioObject =
                  satellites.getObjectByName(
                    "RADIO"
                  )

                if (tracksObject) {
                  tracksObject.position.lerp(
                    targets.TRACKS,
                    0.08
                  )

                  if (menuActiveForThisPlanet) {
                    tracksObject.quaternion.slerp(
                      new THREE.Quaternion()
                        .setFromEuler(
                          menuRotations.TRACKS
                        )
                        .premultiply(
                          inverseParentQuaternion
                        ),
                      0.08
                    )
                  }
                }

                if (mixesObject) {
                  mixesObject.position.lerp(
                    targets.MIXES,
                    0.08
                  )

                  if (menuActiveForThisPlanet) {
                    mixesObject.quaternion.slerp(
                      new THREE.Quaternion()
                        .setFromEuler(
                          menuRotations.MIXES
                        )
                        .premultiply(
                          inverseParentQuaternion
                        ),
                      0.08
                    )
                  }
                }

                if (radioObject) {
                  radioObject.position.lerp(
                    targets.RADIO,
                    0.08
                  )

                  if (menuActiveForThisPlanet) {
                    radioObject.quaternion.slerp(
                      new THREE.Quaternion()
                        .setFromEuler(
                          menuRotations.RADIO
                        )
                        .premultiply(
                          inverseParentQuaternion
                        ),
                      0.08
                    )
                  }
                }
              }
            }

            const naturalX =
              base.x +
              Math.sin(
                t *
                  driftX +
                  phaseX
              ) *
                ampX

            const naturalY =
              base.y +
              Math.sin(
                t *
                  driftY +
                  phaseY
              ) *
                ampY

            const naturalZ =
              base.z +
              Math.sin(
                t *
                  driftZ +
                  phaseZ
              ) *
                ampZ

            const target =
              new THREE.Vector3(
                0,
                0,
                camera.position.z -
                  cameraDistance
              )

            const natural =
              new THREE.Vector3(
                naturalX,
                naturalY,
                naturalZ
              )

            const targetOffset =
              mesh ===
              selectedPlanet
                ? target.sub(natural)
                : new THREE.Vector3()

            object.selectionOffset.lerp(
              targetOffset,
              0.045
            )

            mesh.position.set(
              naturalX +
                object.selectionOffset.x,
              naturalY +
                object.selectionOffset.y,
              naturalZ +
                object.selectionOffset.z
            )
          }
        )

        // Camera stays fixed. Only the selected planet moves.
        cameraTarget.lerp(
          new THREE.Vector3(
            0,
            0,
            window.innerWidth < 768 ? 28 : 17
          ),
          0.05
        )

        lookTarget.lerp(
          new THREE.Vector3(
            0,
            0,
            0
          ),
          0.05
        )

        camera.position.copy(
          cameraTarget
        )

        camera.lookAt(
          lookTarget
        )

        // ========================================================
        // AUDIO MENU LABELS
        // ========================================================

        ;["TRACKS", "MIXES", "RADIO"].forEach(
          (name) => {
            const menuLabel =
              audioMenuLabels[name]

            if (
              !menuLabel
            )
              return

            const satellites =
              selectedPlanet?.userData
                ?.audioSatellites

            const satellite =
              satellites?.getObjectByName(
                name
              )

            if (
              audioMenuActive &&
              satellite
            ) {
              const world =
                satellite.getWorldPosition(
                  new THREE.Vector3()
                )

              world.y +=
                selectedPlanet.geometry
                  .parameters
                  .radius *
                  0.48

              const projected =
                world.project(
                  camera
                )

              const rect =
                canvas.getBoundingClientRect()

              menuLabel.style.left =
                `${
                  (projected.x + 1) *
                  0.5 *
                  rect.width
                }px`

              menuLabel.style.top =
                `${
                  (-projected.y + 1) *
                  0.5 *
                  rect.height
                }px`

              menuLabel.style.opacity =
                "1"
            } else {
              menuLabel.style.opacity =
                "0"
            }
          }
        )

        // Star parallax.
        starLayers.forEach(
          ({
            object,
            speed
          }, index) => {
            object.rotation.y +=
              speed *
              (index + 1)

            object.rotation.x +=
              speed *
              0.35
          }
        )

        const sunScale =
          1 +
          Math.sin(
            t * 0.45
          ) *
            0.025

        sun.scale.setScalar(
          sunScale
        )

        glow.scale.setScalar(
          1 +
            Math.sin(
              t * 0.45
            ) *
              0.05
        )

        // Shooting stars.
        shootingStars.forEach(
          (star) => {
            if (
              !star.active
            ) {
              star.timer -=
                0.016

              if (
                star.timer <=
                0
              ) {
                star.active =
                  true

                star.life = 0

                star.object.position.set(
                  (Math.random() -
                    0.5) *
                    24,
                  6 +
                    Math.random() *
                      8,
                  -10 -
                    Math.random() *
                      30
                )

                star.object.material.opacity =
                  1
              }
            } else {
              star.life +=
                0.016

              star.object.position.x -=
                0.22

              star.object.position.y -=
                0.08

              star.object.material.opacity =
                Math.max(
                  0,
                  1 -
                    star.life /
                      0.8
                )

              if (
                star.life >
                0.8
              ) {
                star.active =
                  false

                star.timer =
                  8 +
                  Math.random() *
                    18
              }
            }
          }
        )

        renderer.render(
          scene,
          camera
        )

        animationId =
          requestAnimationFrame(
            animate
          )
        } catch (error) {
          diagnosticLastAction =
            "ANIMATE LOOP CRASH"

          showDiagnostic(
            "!!! ANIMATION LOOP CRASH !!!",
            String(
              error?.stack ||
              error?.message ||
              error
            )
          )

          console.error(
            "NYXTRYP ANIMATE LOOP CRASH:",
            error
          )

          return
        }
      }

    // ============================================================
    // RESIZE
    // ============================================================

    const resize =
      () => {
        const w =
          el.clientWidth

        const h =
          el.clientHeight

        camera.aspect =
          w / h

        camera.updateProjectionMatrix()

        renderer.setSize(
          w,
          h
        )
      }

    resize()

    window.addEventListener(
      "resize",
      resize
    )

    animate()

    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      cancelAnimationFrame(
        animationId
      )

      window.removeEventListener(
        "resize",
        resize
      )

      canvas.removeEventListener(
        "pointermove",
        onPointerMove
      )

      canvas.removeEventListener(
        "pointerdown",
        onPointerDown
      )

      canvas.removeEventListener(
        "pointerup",
        onPointerUp
      )

      canvas.removeEventListener(
        "pointercancel",
        onPointerUp
      )

      canvas.removeEventListener(
        "wheel",
        onWheel
      )

      objects.forEach(
        ({ mesh }) => {
          mesh.geometry.dispose()
          mesh.material.map?.dispose()
          mesh.material.dispose()
        }
      )

      starLayers.forEach(
        ({ object }) => {
          object.geometry.dispose()
          object.material.dispose()
        }
      )

      shootingStars.forEach(
        ({ object }) => {
          object.geometry.dispose()
          object.material.dispose()
        }
      )


      Object.values(
        audioMenuLabels
      ).forEach(
        (menuLabel) => {
          menuLabel.remove()
        }
      )

      document
        .querySelectorAll(".planet-name")
        .forEach(
          (label) => {
            label.remove()
          }
        )

      renderer.dispose()

      if (
        el.contains(
          renderer.domElement
        )
      ) {
        el.removeChild(
          renderer.domElement
        )
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className="planet-field"
    />
  )
}
