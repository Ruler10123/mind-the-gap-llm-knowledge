import * as THREE from 'three'
import { ASSISTANT_THEME } from '../utils/colorPalette'
import { average } from '../utils/noiseUtils'
import vertexShader from '../shaders/liquidGlass.vert.glsl?raw'
import fragmentShader from '../shaders/liquidGlass.frag.glsl?raw'

export class LiquidGlassEntity {
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  geometry: THREE.IcosahedronGeometry
  
  // Smoothing state for gradual transitions
  private smoothedDeformationIntensity: number = 0
  private smoothedAudioAmplitude: number = 0
  private smoothedGlowIntensity: number = 0
  private smoothedFrequencies: Float32Array = new Float32Array(32)

  constructor() {
    // Geometry - higher resolution for smoother vocal deformation
    this.geometry = new THREE.IcosahedronGeometry(1, 6) // More vertices for detailed deformation

    // Material with custom shaders
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        audioAmplitude: { value: 0 },
        audioFrequencies: { value: new Float32Array(32) },
        baseColor: { value: new THREE.Color(ASSISTANT_THEME.primaryDark) },
        glowColor: { value: new THREE.Color(ASSISTANT_THEME.accent) },
        fresnelPower: { value: 3.0 },
        noiseScale: { value: 2.0 },
        glowIntensity: { value: 0.0 },
        deformationIntensity: { value: 0.0 }, // Overall deformation strength
        frequencyResponse: { value: 1.5 }, // How much frequencies affect deformation
      },
      transparent: true,
      side: THREE.DoubleSide,
    })

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  update(frequencyData: Uint8Array<ArrayBuffer> | null) {
    // Idle animation (always active)
    this.material.uniforms.time.value += 0.01

    // Smoothing factor (higher = faster response, lower = smoother)
    const smoothingFactor = 0.15 // Smooth transitions

    if (frequencyData) {
      // Extract audio features
      const volume = average(frequencyData) / 255
      const lowFreq = average(Array.from(frequencyData.slice(0, 10))) / 255 // Bass
      const midFreq = average(Array.from(frequencyData.slice(10, 20))) / 255 // Mid (vocal range)
      const highFreq = average(Array.from(frequencyData.slice(30, 64))) / 255 // Highs

      // Smooth audio amplitude
      const targetAmplitude = volume
      this.smoothedAudioAmplitude += (targetAmplitude - this.smoothedAudioAmplitude) * smoothingFactor
      this.material.uniforms.audioAmplitude.value = this.smoothedAudioAmplitude

      // Smooth frequency data array
      for (let i = 0; i < 32; i++) {
        const targetFreq = frequencyData[i] / 255.0
        this.smoothedFrequencies[i] += (targetFreq - this.smoothedFrequencies[i]) * smoothingFactor
      }
      this.material.uniforms.audioFrequencies.value = this.smoothedFrequencies
      
      // Smooth deformation intensity based on vocal range (mid frequencies) and overall volume
      const targetDeformationIntensity = Math.max(
        midFreq * 1.5,
        volume * 0.8
      )
      this.smoothedDeformationIntensity += (targetDeformationIntensity - this.smoothedDeformationIntensity) * smoothingFactor
      this.material.uniforms.deformationIntensity.value = this.smoothedDeformationIntensity

      // Scale (bass response) - already uses lerp for smoothing
      const targetScale = 1.0 + lowFreq * 0.3
      this.mesh.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1,
      )

      // Smooth glow intensity
      const targetGlowIntensity = highFreq
      this.smoothedGlowIntensity += (targetGlowIntensity - this.smoothedGlowIntensity) * smoothingFactor
      this.material.uniforms.glowIntensity.value = this.smoothedGlowIntensity
    } else {
      // Fade out audio effects when no input - use smooth interpolation
      const fadeFactor = 0.92 // Slower fade for smoother transition
      this.smoothedAudioAmplitude *= fadeFactor
      this.smoothedGlowIntensity *= fadeFactor
      this.smoothedDeformationIntensity *= fadeFactor
      
      // Smooth frequency fade
      for (let i = 0; i < 32; i++) {
        this.smoothedFrequencies[i] *= fadeFactor
      }
      
      this.material.uniforms.audioAmplitude.value = this.smoothedAudioAmplitude
      this.material.uniforms.glowIntensity.value = this.smoothedGlowIntensity
      this.material.uniforms.deformationIntensity.value = this.smoothedDeformationIntensity
      this.material.uniforms.audioFrequencies.value = this.smoothedFrequencies
      
      this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
    }

    // Gentle rotation
    this.mesh.rotation.y += 0.002
    this.mesh.rotation.x += 0.001
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
