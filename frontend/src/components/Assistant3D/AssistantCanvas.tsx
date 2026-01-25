import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from './hooks/useThreeScene'
import { useAssistantAnimation } from './hooks/useAssistantAnimation'
import { ParticleSphereEntity } from './entities/ParticleSphereEntity'
import { OrbitalPlanesEntity } from './entities/OrbitalPlanesEntity'
import { PostProcessingManager } from './entities/PostProcessing'
import { ANIMATION_CONSTANTS } from './constants/animationConstants'
import type { AssistantCanvasMode } from './types'

interface AssistantCanvasProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null
  mode?: AssistantCanvasMode
}

export default function AssistantCanvas({
  getFrequencyData,
  mode = 'active',
}: AssistantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [entity, setEntity] = useState<ParticleSphereEntity | null>(null)
  const [orbitalPlanes, setOrbitalPlanes] = useState<OrbitalPlanesEntity | null>(null)
  const [postProcessing, setPostProcessing] =
    useState<PostProcessingManager | null>(null)
  const [isReady, setIsReady] = useState(false)

  const dragStateRef = useRef({
    isDragging: false,
    lastMousePos: { x: 0, y: 0 },
    lastMouseTime: 0,
    manualRotation: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    targetRotation: { x: 0, y: 0 },
    velocityHistory: [] as Array<{ x: number; y: number; time: number }>,
  })

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

      // Create orbital planes (as child of particle sphere for transform inheritance)
      console.log('[AssistantCanvas] Creating OrbitalPlanesEntity...')
      const planes = new OrbitalPlanesEntity()
      particleSphere.mesh.add(planes.group)
      setOrbitalPlanes(planes)
      console.log('[AssistantCanvas] Orbital planes created and added as child of sphere')

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
        particleSphere.mesh.remove(planes.group)
        particleSphere.dispose()
        planes.dispose()
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
      if (!dragStateRef.current.isDragging) {
        const r = dragStateRef.current.manualRotation
        r.x = entity.mesh.rotation.x
        r.y = entity.mesh.rotation.y
      }
    }, 16) // ~60fps sync

    return () => clearInterval(interval)
  }, [entity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !entity) return

    const handleMouseDown = (e: MouseEvent) => {
      const d = dragStateRef.current
      d.isDragging = true
      d.lastMousePos = { x: e.clientX, y: e.clientY }
      d.lastMouseTime = performance.now()
      d.velocity = { x: 0, y: 0 }
      d.velocityHistory = []
      d.targetRotation = { x: entity.mesh.rotation.x, y: entity.mesh.rotation.y }
      d.manualRotation = { x: entity.mesh.rotation.x, y: entity.mesh.rotation.y }
      canvas.style.cursor = 'grabbing'
      entity.setAutoRotation(false)
      orbitalPlanes?.setAutoRotation(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragStateRef.current
      if (!d.isDragging) return

      const now = performance.now()
      const deltaTime = (now - d.lastMouseTime) / 1000
      const deltaX = e.clientX - d.lastMousePos.x

      d.targetRotation.y += deltaX * ANIMATION_CONSTANTS.dragRotation.speed

      if (deltaTime > 0 && deltaTime < 0.1) {
        const instantVelocityY =
          (deltaX * ANIMATION_CONSTANTS.dragRotation.speed) / deltaTime
        const instantVelocityX = 0

        d.velocityHistory.push({ x: instantVelocityX, y: instantVelocityY, time: now })
        const cutoffTime = now - 100
        d.velocityHistory = d.velocityHistory.filter((v) => v.time > cutoffTime)

        if (d.velocityHistory.length > 0) {
          const avg = d.velocityHistory.reduce(
            (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
            { x: 0, y: 0 },
          )
          const n = d.velocityHistory.length
          d.velocity = { x: avg.x / n, y: avg.y / n }
        }
      }

      d.lastMousePos = { x: e.clientX, y: e.clientY }
      d.lastMouseTime = now
    }

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false
      canvas.style.cursor = 'grab'
    }

    const handleMouseLeave = () => {
      dragStateRef.current.isDragging = false
      canvas.style.cursor = 'grab'
      entity.setAutoRotation(true)
      orbitalPlanes?.setAutoRotation(true)
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

  useAssistantAnimation(
    scene,
    camera,
    entity,
    postProcessing,
    getFrequencyData,
    dragStateRef,
    mode,
    orbitalPlanes,
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
