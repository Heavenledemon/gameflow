import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import './GltfAssetViewer.css'

function GltfAssetViewer({
  modelUrl,
  title = '3D Asset Viewer',
  mode = 'landscape',
  background = '#101820',
  assets = [],
  textures = null,
  isActive = true,
}) {
  const resolveClientAssetUrl = (url) => {
    if (!url || !url.startsWith('/') || !/^\/(games|3dAssets)\//.test(url)) return url
    return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${url}`
  }
  const containerRef = useRef(null)
  const mountRef = useRef(null)
  const normalizedAssets =
    Array.isArray(assets) && assets.length
      ? assets.filter((asset) => asset?.modelUrl)
      : modelUrl
        ? [{ modelUrl: resolveClientAssetUrl(modelUrl), title, background, textures: textures ? Object.fromEntries(Object.entries(textures).map(([key, url]) => [key, resolveClientAssetUrl(url)])) : textures }]
        : []
  const activeAsset = normalizedAssets[0] ?? null
  const activeModelUrl = activeAsset?.modelUrl ?? ''
  const activeTitle = activeAsset?.title ?? title
  const activeBackground = activeAsset?.background ?? background
  const [status, setStatus] = useState(activeModelUrl ? 'loading' : 'idle')
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState('')
  const isPortrait = mode === 'portrait'
  const viewportWidth = isPortrait
    ? 'min(100vw, calc(100dvh * 9 / 16))'
    : 'min(100vw, calc(100dvh * 16 / 9))'
  const aspectRatio = isPortrait ? '9 / 16' : '16 / 9'

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const mountNode = mountRef.current

    if (!mountNode || !activeModelUrl || !isActive) {
      setStatus(activeModelUrl && isActive ? 'loading' : 'idle')
      setProgress(0)
      setError('')
      return undefined
    }

    setStatus('loading')
    setProgress(0)
    setError('')

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(activeBackground)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
    camera.position.set(0, 1.4, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    mountNode.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0.75, 0)

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x223344, 1.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1)
    keyLight.position.set(3, 6, 4)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x9ecbff, 1.2)
    fillLight.position.set(-4, 2, -2)
    scene.add(fillLight)

    let animationFrameId = 0
    let loadedModel = null
    const loadedTextures = []
    let disposed = false

    const resizeRenderer = () => {
      const width = mountNode.clientWidth
      const height = mountNode.clientHeight

      if (!width || !height) {
        return
      }

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const fitCameraToObject = (object) => {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z)
      const fitHeightDistance =
        maxDimension / (2 * Math.tan((Math.PI * camera.fov) / 360))
      const fitWidthDistance = fitHeightDistance / camera.aspect
      const distance = 1.35 * Math.max(fitHeightDistance, fitWidthDistance)

      object.position.sub(center)
      camera.near = Math.max(distance / 100, 0.1)
      camera.far = Math.max(distance * 100, 1000)
      camera.position.set(0, size.y * 0.15, distance)
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.update()
    }

    const loader = new GLTFLoader()
    loader.load(
      activeModelUrl,
      (gltf) => {
        if (disposed) {
          return
        }

        loadedModel = gltf.scene

        // Apply custom textures if provided
        if (activeAsset?.textures) {
          const textureLoader = new THREE.TextureLoader()
          const textureMap = {}

          Object.entries(activeAsset.textures).forEach(([key, url]) => {
            if (url) {
              const texture = textureLoader.load(url)
              texture.flipY = false
              if (key === 'map') {
                texture.colorSpace = THREE.SRGBColorSpace
              }
              textureMap[key] = texture
              loadedTextures.push(texture)
            }
          })

          loadedModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const applyTextures = (mat) => {
                if (textureMap.map) mat.map = textureMap.map
                if (textureMap.normalMap) {
                  mat.normalMap = textureMap.normalMap
                  mat.normalScale = new THREE.Vector2(1, 1)
                }
                if (textureMap.roughnessMap) mat.roughnessMap = textureMap.roughnessMap
                if (textureMap.metalnessMap) mat.metalnessMap = textureMap.metalnessMap
                if (textureMap.emissiveMap) {
                  mat.emissiveMap = textureMap.emissiveMap
                  mat.emissive = new THREE.Color(0xffffff)
                  mat.emissiveIntensity = 1.0
                }
                mat.needsUpdate = true
              }

              if (Array.isArray(child.material)) {
                child.material.forEach(applyTextures)
              } else {
                applyTextures(child.material)
              }
            }
          })
        }

        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        scene.add(loadedModel)
        resizeRenderer()
        fitCameraToObject(loadedModel)
        setProgress(100)
        setStatus('ready')
      },
      (event) => {
        if (disposed) {
          return
        }

        if (event.total > 0) {
          setProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
        }
      },
      (loadError) => {
        if (disposed) {
          return
        }

        setError('Unable to load this 3D asset.')
        setProgress(0)
        setStatus('error')
        window.dispatchEvent(new CustomEvent('gameflow:client-error', { detail: { message: loadError?.message || '3D asset load failed', mediaType: 'gltf', modelUrl: activeModelUrl, release: import.meta.env.VITE_RELEASE_VERSION || 'development' } }))
      },
    )

    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer()
    })
    resizeObserver.observe(mountNode)
    resizeRenderer()

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      controls.dispose()

      if (loadedModel) {
        scene.remove(loadedModel)
        loadedModel.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose()
          }

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else if (child.material) {
            child.material.dispose()
          }
        })
      }

      renderer.dispose()
      loadedTextures.forEach((texture) => texture.dispose())

      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement)
      }
    }
  }, [activeAsset?.textures, activeBackground, activeModelUrl, isActive])

  return (
    <section
      className="gltf-asset-viewer"
      ref={containerRef}
      style={{
        width: isFullscreen ? '100vw' : viewportWidth,
        aspectRatio: isFullscreen ? 'auto' : aspectRatio,
        '--viewer-background': activeBackground,
      }}
      aria-label={activeTitle}
    >
      <div className="gltf-asset-viewer__viewport" ref={mountRef} />
      <button
        type="button"
        className="gltf-asset-viewer__fullscreen-button"
        onClick={async () => {
          if (document.fullscreenElement === containerRef.current) {
            await document.exitFullscreen()
            return
          }

          if (containerRef.current?.requestFullscreen) {
            await containerRef.current.requestFullscreen()
          }
        }}
        aria-label={isFullscreen ? 'Exit fullscreen view' : 'Enter fullscreen view'}
      >
        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      </button>
      {status === 'loading' ? (
        <div className="gltf-asset-viewer__overlay">
          <div className="gltf-asset-viewer__loading">
            <div>Loading 3D asset... {progress}%</div>
            <div
              className="gltf-asset-viewer__progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={progress}
              aria-label="3D asset loading progress"
            >
              <div
                className="gltf-asset-viewer__progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
      {status === 'idle' && !activeModelUrl ? (
        <div className="gltf-asset-viewer__overlay">
          Add a `.gltf` or `.glb` file path to view a model.
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="gltf-asset-viewer__overlay gltf-asset-viewer__overlay--error">
          {error}
        </div>
      ) : null}
    </section>
  )
}

export default GltfAssetViewer
