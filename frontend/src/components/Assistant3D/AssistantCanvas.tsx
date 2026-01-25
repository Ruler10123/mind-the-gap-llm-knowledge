import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from './hooks/useThreeScene'
import { useAssistantAnimation } from './hooks/useAssistantAnimation'
import {
  ParticleSphereEntity
  
} from './entities/ParticleSphereEntity'
import { PostProcessingManager } from './entities/PostProcessing'
import { ANIMATION_CONSTANTS } from './constants/animationConstants'
// DEPRECATED: Mode system removed - only uniform white sphere mode now
// import type {SphereMode} from './entities/ParticleSphereEntity';

interface AssistantCanvasProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null
  passiveMode?: boolean
}

export default function AssistantCanvas({
  getFrequencyData,
  passiveMode = false,
}: AssistantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [entity, setEntity] = useState<ParticleSphereEntity | null>(null)
  const [postProcessing, setPostProcessing] =
    useState<PostProcessingManager | null>(null)
  const [isReady, setIsReady] = useState(false)
  // DEPRECATED: Mode system removed
  // const [mode, setMode] = useState<SphereMode>('earth')

  // Mouse drag rotation state
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const lastMouseTimeRef = useRef(0)
  const manualRotationRef = useRef({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const targetRotationRef = useRef({ x: 0, y: 0 })
  const velocityHistoryRef = useRef<
    Array<{ x: number; y: number; time: number }>
  >([])

  const { scene, camera, renderer } = useThreeScene(canvasRef)

  // Initialize entity and post-processing
  useEffect(() => {
    if (!scene || !camera || !renderer) {
      console.log('[AssistantCanvas] Waiting for scene/camera/renderer...', {
        hasScene: !!scene,
        hasCamera: !!camera,
        hasRenderer: !!renderer,
      })
      return
    }

    console.log('[AssistantCanvas] Starting 3D scene initialization...')
    try {
      // Create entity
      console.log('[AssistantCanvas] Creating ParticleSphereEntity...')
      const particleSphere = new ParticleSphereEntity()
      console.log('[AssistantCanvas] Adding mesh to scene...')
      scene.add(particleSphere.mesh)
      setEntity(particleSphere)
      console.log('[AssistantCanvas] Entity created and added to scene')

      // Create post-processing
      console.log('[AssistantCanvas] Creating PostProcessingManager...')
      const postProc = new PostProcessingManager(renderer, scene, camera)
      setPostProcessing(postProc)
      console.log('[AssistantCanvas] Post-processing created')

      // Force initial render to ensure sphere is visible immediately
      // Update entity once to initialize positions
      console.log('[AssistantCanvas] Running initial entity update...')
      particleSphere.update(null)
      // Render immediately
      console.log('[AssistantCanvas] Running initial render...')
      postProc.render(0)
      console.log('[AssistantCanvas] Initial render complete')

      // Handle resize for post-processing
      const handleResize = () => {
        postProc.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', handleResize)

      setIsReady(true)
      console.log('[AssistantCanvas] 3D scene initialization complete, isReady set to true')

      return () => {
        window.removeEventListener('resize', handleResize)
        particleSphere.dispose()
        postProc.dispose()
        scene.remove(particleSphere.mesh)
      }
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error)
    }
  }, [scene, camera, renderer])

  // Sync manual rotation with entity rotation when auto-rotation is active
  useEffect(() => {
    if (!entity) return

    const interval = setInterval(() => {
      if (!isDraggingRef.current) {
        // Sync manual rotation with entity rotation when not dragging
        manualRotationRef.current = {
          x: entity.mesh.rotation.x,
          y: entity.mesh.rotation.y,
        }
      }
    }, 16) // ~60fps sync

    return () => clearInterval(interval)
  }, [entity])

  // DEPRECATED: Mode switching removed - only uniform white sphere mode
  // useEffect(() => {
  //   if (!entity) return
  //   entity.setMode(mode)
  // }, [entity, mode])

  // const handleToggleMode = () => {
  //   setMode((prev) => (prev === 'earth' ? 'default' : 'earth'))
  // }

  // Mouse drag handlers for rotation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !entity) return

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }
      lastMouseTimeRef.current = performance.now()
      velocityRef.current = { x: 0, y: 0 } // Reset velocity on new drag
      velocityHistoryRef.current = [] // Clear velocity history
      targetRotationRef.current = {
        x: entity.mesh.rotation.x,
        y: entity.mesh.rotation.y,
      }
      manualRotationRef.current = {
        x: entity.mesh.rotation.x,
        y: entity.mesh.rotation.y,
      }
      canvas.style.cursor = 'grabbing'
      entity.setAutoRotation(false) // Disable auto-rotation while dragging
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      const now = performance.now()
      const deltaTime = (now - lastMouseTimeRef.current) / 1000 // Convert to seconds
      const deltaX = e.clientX - lastMousePosRef.current.x
      const deltaY = e.clientY - lastMousePosRef.current.y

      // Update target rotation (smooth accumulation) - only horizontal (y-axis)
      targetRotationRef.current.y +=
        deltaX * ANIMATION_CONSTANTS.dragRotation.speed
      // X-axis rotation is not affected by mouse drag

      // Calculate instantaneous velocity for momentum (only horizontal)
      if (deltaTime > 0 && deltaTime < 0.1) {
        // Only use recent, valid time deltas
        const instantVelocityY =
          (deltaX * ANIMATION_CONSTANTS.dragRotation.speed) / deltaTime
        const instantVelocityX = 0 // No vertical rotation from mouse

        // Store velocity history (keep last 5 samples for smoothing)
        velocityHistoryRef.current.push({
          x: instantVelocityX,
          y: instantVelocityY,
          time: now,
        })

        // Keep only recent history (last 100ms)
        const cutoffTime = now - 100
        velocityHistoryRef.current = velocityHistoryRef.current.filter(
          (v) => v.time > cutoffTime,
        )

        // Calculate smoothed velocity from history
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
      // Keep velocity for momentum, don't re-enable auto-rotation yet
    }

    const handleMouseLeave = () => {
      isDraggingRef.current = false
      canvas.style.cursor = 'grab'
      entity.setAutoRotation(true) // Re-enable auto-rotation when mouse leaves
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

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}
    </>
  )
}
