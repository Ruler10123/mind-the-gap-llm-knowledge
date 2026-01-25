import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'
import type { ParticleSphereEntity } from '../entities/ParticleSphereEntity'
import type { PostProcessingManager } from '../entities/PostProcessing'

export function useAssistantAnimation(
  scene: THREE.Scene | undefined,
  camera: THREE.Camera | undefined,
  entity: ParticleSphereEntity | null,
  postProcessing: PostProcessingManager | null,
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null,
  velocityRef: { current: { x: number; y: number } },
  manualRotationRef: { current: { x: number; y: number } },
  targetRotationRef: { current: { x: number; y: number } },
  isDraggingRef: { current: boolean },
  passiveMode: boolean,
) {
  // Persist current scale and position across re-renders for smooth transitions
  const currentScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const currentPositionRef = useRef(new THREE.Vector3(0, 0, 0))
  
  useEffect(() => {
    if (!scene || !camera || !entity || !postProcessing) return

    let animationId: number
    const clock = new THREE.Clock()
    
    // Initialize scale and position from current mesh state if available
    // This ensures smooth transition when passiveMode changes
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
      
      if (passiveMode) {
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

      // Handle rotation updates
      if (isDraggingRef.current) {
        // While dragging: smoothly interpolate to target rotation (only y-axis)
        const smoothingFactor = 0.3 // Higher = faster response
        const target = targetRotationRef.current
        const current = manualRotationRef.current

        // Smooth interpolation to target (only y-axis for horizontal rotation)
        current.y += (target.y - current.y) * smoothingFactor
        // X-axis rotation is not affected by mouse, keep current value

        // Apply rotation to entity
        entity.mesh.rotation.x = current.x // Keep x-axis from auto-rotation
        entity.mesh.rotation.y = current.y
      } else {
        // When not dragging: apply velocity with damping (only y-axis)
        const velocity = velocityRef.current
        const minVelocity = ANIMATION_CONSTANTS.dragRotation.minVelocity

        // Apply velocity to rotation (only y-axis)
        if (Math.abs(velocity.y) > minVelocity) {
          manualRotationRef.current.y += velocity.y * delta
          // X-axis is not affected by mouse velocity

          // Apply rotation to entity
          entity.mesh.rotation.x = manualRotationRef.current.x
          entity.mesh.rotation.y = manualRotationRef.current.y

          // Apply damping (only y-axis velocity)
          velocity.y *= ANIMATION_CONSTANTS.dragRotation.damping
          velocity.x = 0 // Clear x-axis velocity

          // Stop if velocity is too small
          if (Math.abs(velocity.y) < minVelocity) velocity.y = 0

          // Re-enable auto-rotation when velocity stops
          if (Math.abs(velocity.y) < minVelocity) {
            entity.setAutoRotation(true)
          }
        } else {
          // No velocity, sync with entity rotation for auto-rotation
          manualRotationRef.current.x = entity.mesh.rotation.x
          manualRotationRef.current.y = entity.mesh.rotation.y
          targetRotationRef.current.x = entity.mesh.rotation.x
          targetRotationRef.current.y = entity.mesh.rotation.y
        }
      }

      // Update entity with passive mode flag
      entity.update(frequencyData, passiveMode)

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
    velocityRef,
    manualRotationRef,
    targetRotationRef,
    isDraggingRef,
    passiveMode,
  ])
}
