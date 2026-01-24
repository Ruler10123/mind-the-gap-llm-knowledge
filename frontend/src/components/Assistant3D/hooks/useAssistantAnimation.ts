import { useEffect } from 'react'
import * as THREE from 'three'
import type { LiquidGlassEntity } from '../entities/LiquidGlassEntity'
import type { PostProcessingManager } from '../entities/PostProcessing'

export function useAssistantAnimation(
  scene: THREE.Scene | undefined,
  camera: THREE.Camera | undefined,
  entity: LiquidGlassEntity | null,
  postProcessing: PostProcessingManager | null,
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null,
) {
  useEffect(() => {
    if (!scene || !camera || !entity || !postProcessing) return

    let animationId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const frequencyData = getFrequencyData()

      // Update entity
      entity.update(frequencyData)

      // Render with post-processing
      postProcessing.render(delta)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [scene, camera, entity, postProcessing, getFrequencyData])
}
