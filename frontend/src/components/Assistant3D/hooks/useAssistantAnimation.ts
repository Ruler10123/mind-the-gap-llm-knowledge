import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'
import type { ParticleSphereEntity } from '../entities/ParticleSphereEntity'
import type { PostProcessingManager } from '../entities/PostProcessing'
import type { AssistantCanvasMode } from '../types'

/**
 * Ref shape for mouse-drag rotation state. Mutated by AssistantCanvas mouse
 * handlers and read each frame by the animation loop for rotation and momentum.
 */
export type DragStateRef = {
  current: {
    isDragging: boolean
    manualRotation: { x: number; y: number }
    velocity: { x: number; y: number }
    targetRotation: { x: number; y: number }
  }
}

/**
 * Drives the main animation loop for the 3D assistant: applies scale/position
 * (including passive-mode transform), updates rotation from drag state or
 * momentum, runs entity update with optional frequency data, and renders via
 * post-processing.
 *
 * - **Passive mode**: when `mode === 'passive'`, scales and positions the
 *   sphere so the top ~30% fills the viewport (e.g. kiosk). Lerps between
 *   active and passive transforms using `ANIMATION_CONSTANTS.passiveMode.transitionSpeed`.
 * - **Processing mode**: reserved; not implemented; treated as active.
 * - **Rotation**: if dragging, interpolates `manualRotation` toward `targetRotation`
 *   (y-only). Otherwise applies `velocity` with damping for momentum; when
 *   velocity decays, syncs with entity and re-enables auto-rotation.
 *
 * @param scene - Three.js scene (from useThreeScene)
 * @param camera - Camera used for passive-mode frustum calculations
 * @param entity - ParticleSphereEntity to transform and update each frame
 * @param postProcessing - PostProcessingManager that performs the final render
 * @param getFrequencyData - Callback returning current frequency data or null
 * @param dragStateRef - Mutable drag state (isDragging, manualRotation, velocity, targetRotation)
 * @param mode - AssistantCanvasMode; passive uses zoomed top layout; processing unimplemented
 */
export function useAssistantAnimation(
  scene: THREE.Scene | undefined,
  camera: THREE.Camera | undefined,
  entity: ParticleSphereEntity | null,
  postProcessing: PostProcessingManager | null,
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null,
  dragStateRef: DragStateRef,
  mode: AssistantCanvasMode,
) {
  const currentScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const currentPositionRef = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (!scene || !camera || !entity || !postProcessing) return

    let animationId: number
    const clock = new THREE.Clock()

    // Initialize scale and position from current mesh state if available
    // This ensures smooth transition when mode changes
    if (entity.mesh) {
      currentScaleRef.current.copy(entity.mesh.scale)
      currentPositionRef.current.copy(entity.mesh.position)
    }
    
    // Calculate passive mode transformations
    const calculatePassiveModeTransform = () => {
      if (!(camera instanceof THREE.PerspectiveCamera)) return { scale: 1, y: 0 }
      
      const cameraDistance = camera.position.z
      const fovRad = (camera.fov * Math.PI) / 180
      // Visible width accounts for aspect ratio (FOV is vertical, width = height * aspect)
      const visibleWidth = 2 * cameraDistance * Math.tan(fovRad / 2) * camera.aspect
      
      // Top 30% of sphere (y from 0.7 to 1.0)
      // At y=0.7, the horizontal radius is sqrt(1 - 0.7²) = sqrt(0.51) ≈ 0.714
      const sphereTop30Width = 2 * Math.sqrt(1 - 0.4 * 0.4)
      
      // Scale to make top 30% width match screen width
      const scale = visibleWidth / sphereTop30Width
      
      // Move sphere down so only top 30% is visible
      // Position so that y=0.7*scale aligns with bottom of visible area
      const y = -scale * 1.3
      
      return { scale, y }
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const frequencyData = getFrequencyData()
      
      // Calculate target transform based on mode
      const targetScale = new THREE.Vector3(1, 1, 1)
      const targetPosition = new THREE.Vector3(0, 0, 0)
      
      const usePassiveLayout = mode === 'passive'
      if (usePassiveLayout) {
        const transform = calculatePassiveModeTransform()
        targetScale.set(transform.scale, transform.scale, transform.scale)
        targetPosition.y = transform.y
      }
      
      // Smoothly interpolate scale and position
      const lerpFactor = ANIMATION_CONSTANTS.passiveMode.transitionSpeed
      currentScaleRef.current.lerp(targetScale, lerpFactor)
      currentPositionRef.current.lerp(targetPosition, lerpFactor)
      
      // Apply transformations to entity mesh
      entity.mesh.scale.copy(currentScaleRef.current)
      entity.mesh.position.copy(currentPositionRef.current)

      const d = dragStateRef.current
      if (d.isDragging) {
        const smoothingFactor = 0.3
        const target = d.targetRotation
        const current = d.manualRotation
        current.y += (target.y - current.y) * smoothingFactor
        entity.mesh.rotation.x = current.x
        entity.mesh.rotation.y = current.y
      } else {
        const velocity = d.velocity
        const minVelocity = ANIMATION_CONSTANTS.dragRotation.minVelocity
        if (Math.abs(velocity.y) > minVelocity) {
          d.manualRotation.y += velocity.y * delta
          entity.mesh.rotation.x = d.manualRotation.x
          entity.mesh.rotation.y = d.manualRotation.y
          velocity.y *= ANIMATION_CONSTANTS.dragRotation.damping
          velocity.x = 0
          if (Math.abs(velocity.y) < minVelocity) velocity.y = 0
          if (Math.abs(velocity.y) < minVelocity) entity.setAutoRotation(true)
        } else {
          d.manualRotation.x = entity.mesh.rotation.x
          d.manualRotation.y = entity.mesh.rotation.y
          d.targetRotation.x = entity.mesh.rotation.x
          d.targetRotation.y = entity.mesh.rotation.y
        }
      }

      const useProcessing = mode === 'processing'
      entity.update(frequencyData, usePassiveLayout, useProcessing)

      // Render with post-processing
      postProcessing.render(delta)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [
    scene,
    camera,
    entity,
    postProcessing,
    getFrequencyData,
    dragStateRef,
    mode,
  ])
}
