import { useEffect } from 'react'
import * as THREE from 'three'
import type { ParticleSphereEntity } from '../entities/ParticleSphereEntity'
import type { PostProcessingManager } from '../entities/PostProcessing'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'

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
) {
  useEffect(() => {
    if (!scene || !camera || !entity || !postProcessing) return

    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const frequencyData = getFrequencyData()

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

      // Update entity
      entity.update(frequencyData)

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
  ])
}
