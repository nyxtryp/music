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
    name: "WORLDS",
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

export default function PlanetField() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      35,
      el.clientWidth / el.clientHeight,
      0.1,
      250
    )

    camera.position.set(0, 0, 17)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })

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

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type =
      THREE.PCFSoftShadowMap

    el.appendChild(
      renderer.domElement
    )

    const canvas =
      renderer.domElement

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
      2048

    sunLight.shadow.mapSize.height =
      2048

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
          blending:
            THREE.AdditiveBlending
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
          renderer.capabilities.getMaxAnisotropy()

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
          const int STEPS = 8;

          float stepSize =
            segment / float(STEPS);

          vec3 scattering =
            vec3(0.0);

          float opticalDepth = 0.0;

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
                128,
                128
              ),
              atmosphereMaterial
            )

          planet.add(
            atmosphere
          )
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
    // PLANET LABEL
    // ============================================================

    const label =
      document.createElement(
        "div"
      )

    label.style.position =
      "absolute"

    label.style.left = "0"
    label.style.top = "0"

    label.style.transform =
      "translate(-50%, -50%)"

    label.style.padding =
      "0"

    label.style.border =
      "none"

    label.style.borderRadius =
      "0"

    label.style.background =
      "transparent"

    label.style.backdropFilter =
      "none"

    label.style.color =
      "#ffffff"

    label.style.fontSize =
      "8px"

    label.style.letterSpacing =
      "0.28em"

    label.style.fontFamily =
      "Arial, Helvetica, sans-serif"

    label.style.pointerEvents =
      "none"

    label.style.whiteSpace =
      "nowrap"

    label.style.opacity =
      "0"

    label.style.transition =
      "opacity 0.18s ease"

    label.style.zIndex =
      "20"

    label.textContent = ""

    el.style.position =
      "relative"

    el.appendChild(
      label
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

        const hits =
          raycaster.intersectObjects(
            objects.map(
              ({ mesh }) =>
                mesh
            ),
            false
          )

        return hits.length
          ? hits[0].object
          : null
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

          label.textContent =
            hit.userData.name

          label.style.opacity =
            "1"

          canvas.style.cursor =
            "pointer"
        } else if (
          !isDragging
        ) {
          hoveredPlanet =
            null

          label.style.opacity =
            "0"

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
        if (
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

    const animate =
      () => {
        const t =
          performance.now() *
          0.001

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
            if (
              mesh !==
              selectedPlanet
            ) {
              mesh.rotation.y +=
                speed
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
            17
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

        // Hover label follows planet.
        if (
          hoveredPlanet &&
          !isDragging
        ) {
          const world =
            hoveredPlanet.position
              .clone()

          world.y +=
            hoveredPlanet.geometry
              .parameters
              .radius *
              1.35

          const projected =
            world.project(
              camera
            )

          const rect =
            canvas.getBoundingClientRect()

          label.style.left =
            `${
              (projected.x + 1) *
              0.5 *
              rect.width
            }px`

          label.style.top =
            `${
              (-projected.y + 1) *
              0.5 *
              rect.height
            }px`
        }

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

      label.remove()

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
