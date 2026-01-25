import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAssistantAnimation } from '../Assistant3D/hooks/useAssistantAnimation'
import { ParticleSphereEntity } from '../Assistant3D/entities/ParticleSphereEntity'
import { PostProcessingManager } from '../Assistant3D/entities/PostProcessing'
import { ANIMATION_CONSTANTS } from '../Assistant3D/constants/animationConstants'

interface Globe3DProps {
  passiveMode?: boolean
}

export function Globe3D({ passiveMode = false }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [entity, setEntity] = useState<ParticleSphereEntity | null>(null)
  const [postProcessing, setPostProcessing] = useState<PostProcessingManager | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Mouse drag rotation state
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const lastMouseTimeRef = useRef(0)
  const manualRotationRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const targetRotationRef = useRef({ x: 0, y: 0 })
  const velocityHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([])

  // Setup Three.js scene with transparent background
  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    scene.background = null // Transparent background

    const aspect = window.innerWidth / window.innerHeight
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    camera.position.z = 3

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true, // Enable transparency
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0) // Transparent clear color

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

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
  }, [])

  const scene = sceneRef.current
  const camera = cameraRef.current
  const renderer = rendererRef.current

  // No audio analyzer - just return null for frequency data
  const getFrequencyData = () => null

  // Initialize entity and post-processing
  useEffect(() => {
    if (!scene || !camera || !renderer) return

    try {
      const particleSphere = new ParticleSphereEntity()
      scene.add(particleSphere.mesh)
      setEntity(particleSphere)

      const postProc = new PostProcessingManager(renderer, scene, camera)
      setPostProcessing(postProc)

      particleSphere.update(null, passiveMode)
      postProc.render(0)

      const handleResize = () => {
        postProc.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        particleSphere.dispose()
        postProc.dispose()
        scene.remove(particleSphere.mesh)
      }
    } catch (error) {
      console.error('Failed to initialize 3D globe:', error)
    }
  }, [scene, camera, renderer, passiveMode])

  // Sync manual rotation with entity rotation when auto-rotation is active
  useEffect(() => {
    if (!entity) return

    const interval = setInterval(() => {
      if (!isDraggingRef.current) {
        manualRotationRef.current = {
          x: entity.mesh.rotation.x,
          y: entity.mesh.rotation.y,
        }
      }
    }, 16)

    return () => clearInterval(interval)
  }, [entity])

  // Mouse drag handlers for rotation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !entity) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      lastMouseTimeRef.current = performance.now()
      velocityRef.current = { x: 0, y: 0 }
      velocityHistoryRef.current = []
      targetRotationRef.current = {
        x: entity.mesh.rotation.x,
        y: entity.mesh.rotation.y,
      }
      manualRotationRef.current = {
        x: entity.mesh.rotation.x,
        y: entity.mesh.rotation.y,
      }
      canvas.style.cursor = 'grabbing'
      entity.setAutoRotation(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const now = performance.now()
      const deltaTime = (now - lastMouseTimeRef.current) / 1000
      const deltaX = e.clientX - lastMousePosRef.current.x

      targetRotationRef.current.y += deltaX * ANIMATION_CONSTANTS.dragRotation.speed

      if (deltaTime > 0 && deltaTime < 0.1) {
        const instantVelocityY = (deltaX * ANIMATION_CONSTANTS.dragRotation.speed) / deltaTime
        const instantVelocityX = 0

        velocityHistoryRef.current.push({
          x: instantVelocityX,
          y: instantVelocityY,
          time: now,
        })

        const cutoffTime = now - 100
        velocityHistoryRef.current = velocityHistoryRef.current.filter((v) => v.time > cutoffTime)

        if (velocityHistoryRef.current.length > 0) {
          const avgVelocity = velocityHistoryRef.current.reduce(
            (acc, v) => ({
              x: acc.x + v.x,
              y: acc.y + v.y,
            }),
            { x: 0, y: 0 },
          )
          const count = velocityHistoryRef.current.length
          velocityRef.current = {
            x: avgVelocity.x / count,
            y: avgVelocity.y / count,
          }
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      lastMouseTimeRef.current = now
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
      entity.setAutoRotation(true)
    }

    canvas.style.cursor = 'grab'
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [entity])

  // Animation loop
  useAssistantAnimation(
    scene,
    camera,
    entity,
    postProcessing,
    getFrequencyData,
    velocityRef,
    manualRotationRef,
    targetRotationRef,
    isDraggingRef,
    passiveMode,
  )

  return <canvas ref={canvasRef} className="w-full h-full bg-transparent" style={{ background: 'transparent' }} />
}
