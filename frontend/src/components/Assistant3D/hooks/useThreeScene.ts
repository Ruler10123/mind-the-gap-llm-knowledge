import { useEffect, useState } from 'react'
import * as THREE from 'three'
import type { RefObject } from 'react'

/**
 * Creates and manages a Three.js scene, PerspectiveCamera, and WebGLRenderer bound
 * to the given canvas. Sets up a transparent background, high-performance renderer
 * options, and handles window resize. Disposes the renderer on unmount.
 *
 * @param canvasRef - Ref to the HTML canvas element that will host the WebGL context
 * @returns `{ scene, camera, renderer }` — each is `undefined` until the canvas mounts
 *          and the effect runs. Camera is at z=3; renderer uses device pixel ratio
 *          (capped at 2) and fills the window.
 */
export function useThreeScene(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [scene, setScene] = useState<THREE.Scene | undefined>(undefined)
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | undefined>(undefined)
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current) {
      console.log('[useThreeScene] Canvas ref not available yet')
      return
    }

    console.log('[useThreeScene] Initializing Three.js scene...')
    // Scene setup
    const newScene = new THREE.Scene()
    newScene.background = null // Transparent background
    console.log('[useThreeScene] Scene created')
    
    const aspect = window.innerWidth / window.innerHeight
    const newCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    newCamera.position.z = 3
    console.log('[useThreeScene] Camera created', { aspect, position: newCamera.position })

    // Renderer (no shadows, performance mode)
    const newRenderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
    })
    newRenderer.setClearColor(0x000000, 0) // Transparent clear color
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    newRenderer.setSize(window.innerWidth, window.innerHeight)
    console.log('[useThreeScene] Renderer created', {
      size: { width: window.innerWidth, height: window.innerHeight },
      pixelRatio: newRenderer.getPixelRatio(),
    })

    // Store in state to trigger re-render
    setScene(newScene)
    setCamera(newCamera)
    setRenderer(newRenderer)
    console.log('[useThreeScene] Three.js scene initialization complete')

    // Handle resize
    const handleResize = () => {
      newCamera.aspect = window.innerWidth / window.innerHeight
      newCamera.updateProjectionMatrix()
      newRenderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      newRenderer.dispose()
    }
  }, [canvasRef])

  return {
    scene,
    camera,
    renderer,
  }
}
