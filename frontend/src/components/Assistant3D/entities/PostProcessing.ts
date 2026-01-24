import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
} from 'postprocessing'
import type * as THREE from 'three'

export class PostProcessingManager {
  composer: EffectComposer

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ) {
    this.composer = new EffectComposer(renderer)

    // Base render pass
    this.composer.addPass(new RenderPass(scene, camera))

    // Bloom effect (soft glow)
    const bloom = new BloomEffect({
      intensity: 0.8,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.9,
      mipmapBlur: true,
    })

    this.composer.addPass(new EffectPass(camera, bloom))
  }

  render(delta: number) {
    this.composer.render(delta)
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height)
  }

  dispose() {
    this.composer.dispose()
  }
}
