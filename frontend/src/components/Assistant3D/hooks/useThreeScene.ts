import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { RefObject } from 'react'

export function useThreeScene(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const sceneRef = useRef<THREE.Scene | undefined>(undefined)
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined)
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000) // Black background
    const aspect = window.innerWidth / window.innerHeight
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.position.z = 3

    // Renderer (no shadows, performance mode)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    // Store refs
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [canvasRef])

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
  }
}
