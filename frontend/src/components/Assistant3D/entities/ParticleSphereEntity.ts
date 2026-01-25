import * as THREE from 'three'
import { average, noise3D } from '../utils/noiseUtils'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'

export class ParticleSphereEntity {
  mesh: THREE.Points
  material: THREE.PointsMaterial
  geometry: THREE.BufferGeometry
  private texture: THREE.CanvasTexture

  private smoothedAudioAmplitude = 0
  private smoothedFrequencies: Float32Array = new Float32Array(32)
  private particleCount: number = ANIMATION_CONSTANTS.particles.count
  private basePositions: Float32Array
  private positions: Float32Array
  private spikeRotationTime = 0
  private autoRotationEnabled = true
  private isInitialized = false

  private uniformPositions: Float32Array
  private defaultColors: Float32Array

  private tempVector1: THREE.Vector3
  private tempVector2: THREE.Vector3
  private tempVector3: THREE.Vector3

  constructor() {
    console.log('[ParticleSphereEntity] Starting initialization...')
    this.particleCount = ANIMATION_CONSTANTS.particles.count
    console.log(`[ParticleSphereEntity] Particle count: ${this.particleCount}`)
    this.positions = new Float32Array(this.particleCount * 3)
    this.basePositions = new Float32Array(this.particleCount * 3)
    this.uniformPositions = new Float32Array(this.particleCount * 3)
    this.defaultColors = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.defaultColors[i] = 1.0
      this.defaultColors[i + 1] = 1.0
      this.defaultColors[i + 2] = 1.0
    }

    this.tempVector1 = new THREE.Vector3()
    this.tempVector2 = new THREE.Vector3()
    this.tempVector3 = new THREE.Vector3()

    for (let i = 0; i < this.particleCount; i++) {
      const radius = 1.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      // Y-up spherical to cartesian
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.cos(phi)
      const z = radius * Math.sin(phi) * Math.sin(theta)

      const i3 = i * 3
      this.uniformPositions[i3] = x
      this.uniformPositions[i3 + 1] = y
      this.uniformPositions[i3 + 2] = z

      // Set base and current positions to uniform positions
      this.basePositions[i3] = x
      this.basePositions[i3 + 1] = y
      this.basePositions[i3 + 2] = z

      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    )

    // Initialize color array (RGB per particle)
    const colors = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      // Default to white for visibility on dark backgrounds
      colors[i3] = 1.0 // R - white
      colors[i3 + 1] = 1.0 // G - white
      colors[i3 + 2] = 1.0 // B - white
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Ensure geometry is ready to render
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.computeBoundingSphere()

    // Create circular texture for particles
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')!

    // Draw white circle with soft edges
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    context.fillStyle = gradient
    context.beginPath()
    context.arc(32, 32, 32, 0, Math.PI * 2)
    context.fill()

    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.needsUpdate = true

    // Particle material with vertex colors and circular texture
    this.material = new THREE.PointsMaterial({
      color: 0xffffff, // Base color (will be multiplied by vertex colors)
      size: ANIMATION_CONSTANTS.particles.baseSize,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: this.texture,
      alphaTest: 0.001,
      vertexColors: true, // Enable vertex colors
    })

    // Points mesh
    this.mesh = new THREE.Points(this.geometry, this.material)
    console.log('[ParticleSphereEntity] Initialization complete', {
      particleCount: this.particleCount,
      hasGeometry: !!this.geometry,
      hasMaterial: !!this.material,
      hasMesh: !!this.mesh,
      meshVisible: this.mesh.visible,
    })
  }

  private updateBasePositions(): void {
    // No-op: base positions are set in constructor
  }

  private applyColors(): void {
    const colors = this.geometry.attributes.color.array as Float32Array
    const lerpFactor = 0.05
    const target = this.defaultColors
    for (let i = 0; i < this.particleCount * 3; i++) {
      colors[i] += (target[i] - colors[i]) * lerpFactor
    }
    this.geometry.attributes.color.needsUpdate = true
  }

  update(
    frequencyData: Uint8Array<ArrayBuffer> | null,
    passiveMode: boolean = false,
    processingMode: boolean = false,
  ) {
    if (!this.isInitialized) {
      console.log('[ParticleSphereEntity] First update call', {
        hasFrequencyData: !!frequencyData,
        passiveMode,
        processingMode,
      })
      this.isInitialized = true
    }

    this.updateBasePositions()
    this.applyColors()

    if (!frequencyData && !processingMode) {
      const baseRotationSpeed = ANIMATION_CONSTANTS.spikeRotation.baseSpeed
      this.spikeRotationTime += baseRotationSpeed
    }

    if (processingMode) {
      this.applyProcessingNoiseDisplacement()
    } else if (frequencyData) {
      const volume = average(frequencyData) / 255
      const midFreq = average(Array.from(frequencyData.slice(10, 20))) / 255
      const highFreq = average(Array.from(frequencyData.slice(30, 64))) / 255

      // Smooth audio amplitude
      const targetAmplitude = volume
      this.smoothedAudioAmplitude +=
        (targetAmplitude - this.smoothedAudioAmplitude) *
        ANIMATION_CONSTANTS.audioSmoothing.factor

      // Update spike rotation time - speed increases with voice volume
      const baseRotationSpeed = 0.005 // Base rotation speed
      const volumeBoost = this.smoothedAudioAmplitude * 0.005 // Additional speed based on volume
      this.spikeRotationTime += baseRotationSpeed + volumeBoost

      // Smooth frequency data array
      for (let i = 0; i < 32; i++) {
        const targetFreq = frequencyData[i] / 255.0
        this.smoothedFrequencies[i] +=
          (targetFreq - this.smoothedFrequencies[i]) *
          ANIMATION_CONSTANTS.audioSmoothing.factor
      }

      // Deformation intensity based on vocal range - use passive mode constants if enabled
      const intensityMult = passiveMode
        ? ANIMATION_CONSTANTS.deformation.passiveIntensityMultiplier
        : ANIMATION_CONSTANTS.deformation.intensityMultiplier
      const volumeMult = passiveMode
        ? ANIMATION_CONSTANTS.deformation.passiveVolumeMultiplier
        : ANIMATION_CONSTANTS.deformation.volumeMultiplier

      const deformationIntensity = Math.max(
        midFreq * intensityMult,
        volume * volumeMult,
      )

      // Create spike centers distributed across the sphere based on frequency bands
      // Each frequency band creates a spike at a specific location
      const numSpikes = ANIMATION_CONSTANTS.spikes.count
      const spikeCenters: Array<{ pos: THREE.Vector3; intensity: number }> = []

      // Use Fibonacci sphere distribution for even spacing
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // Golden angle

      for (let i = 0; i < numSpikes; i++) {
        // Fibonacci sphere distribution for even coverage
        const y = 1 - (i / (numSpikes - 1)) * 2 // y goes from 1 to -1
        const radius = Math.sqrt(1 - y * y)
        const theta = goldenAngle * i + this.spikeRotationTime // Rotate spike positions over time
        const spikeX = Math.cos(theta) * radius
        const spikeY = y
        const spikeZ = Math.sin(theta) * radius

        // Also rotate around Y axis for more complex rotation
        const rotationY = this.spikeRotationTime * 0.7
        const rotatedX =
          spikeX * Math.cos(rotationY) - spikeZ * Math.sin(rotationY)
        const rotatedZ =
          spikeX * Math.sin(rotationY) + spikeZ * Math.cos(rotationY)

        // Map spike to frequency band (distribute across all 32 bands)
        const freqIndex = Math.floor((i / numSpikes) * 32)
        const spikeIntensity =
          this.smoothedFrequencies[freqIndex] * deformationIntensity

        spikeCenters.push({
          pos: new THREE.Vector3(rotatedX, spikeY, rotatedZ), // Only allocated once per spike per frame
          intensity: spikeIntensity,
        })
      }

      // Update particle positions to create smooth spikes
      const positions = this.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3
        const baseX = this.basePositions[i3]
        const baseY = this.basePositions[i3 + 1]
        const baseZ = this.basePositions[i3 + 2]

        // Use reusable vectors to reduce GC pressure
        this.tempVector1.set(baseX, baseY, baseZ)
        const normal = this.tempVector2.copy(this.tempVector1).normalize()

        let totalSpikeInfluence = 0.0
        this.tempVector3.set(0, 0, 0) // weightedDirection

        for (const spike of spikeCenters) {
          if (spike.intensity < 0.01) continue

          // Calculate angular distance using dot product
          const dot = normal.dot(spike.pos)
          const angularDistance = Math.acos(Math.max(-1, Math.min(1, dot)))

          // Smooth falloff function
          const spikeRadius = ANIMATION_CONSTANTS.spikes.radius
          const normalizedDist = angularDistance / spikeRadius
          let falloff = 0
          if (normalizedDist < 1) {
            falloff =
              1 - normalizedDist * normalizedDist * (3 - 2 * normalizedDist)
          }

          const spikeInfluence = spike.intensity * falloff

          if (spikeInfluence > 0) {
            // Calculate direction to spike and add to weighted direction
            const dx = spike.pos.x - baseX
            const dy = spike.pos.y - baseY
            const dz = spike.pos.z - baseZ
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (len > 0) {
              this.tempVector3.x += (dx / len) * spikeInfluence
              this.tempVector3.y += (dy / len) * spikeInfluence
              this.tempVector3.z += (dz / len) * spikeInfluence
            }
            totalSpikeInfluence += spikeInfluence
          }
        }

        // Apply displacement - use passive mode max height if enabled
        if (totalSpikeInfluence > 0) {
          this.tempVector3.normalize()
          const displacementAmount =
            totalSpikeInfluence * ANIMATION_CONSTANTS.spikes.heightMultiplier
          const maxSpikeHeight = passiveMode
            ? ANIMATION_CONSTANTS.deformation.passiveMaxDisplacement
            : ANIMATION_CONSTANTS.spikes.maxHeight
          const displacement = Math.min(displacementAmount, maxSpikeHeight)

          positions[i3] = baseX + normal.x * displacement
          positions[i3 + 1] = baseY + normal.y * displacement
          positions[i3 + 2] = baseZ + normal.z * displacement
        } else {
          positions[i3] = baseX
          positions[i3 + 1] = baseY
          positions[i3 + 2] = baseZ
        }
      }

      this.geometry.attributes.position.needsUpdate = true

      // Particle size based on high frequencies
      this.material.size =
        ANIMATION_CONSTANTS.particles.baseSize +
        highFreq * ANIMATION_CONSTANTS.particles.sizeVariation
    } else {
      // Fade out audio effects when no input
      const fadeFactor = ANIMATION_CONSTANTS.audioSmoothing.fadeFactor
      this.smoothedAudioAmplitude *= fadeFactor

      for (let i = 0; i < 32; i++) {
        this.smoothedFrequencies[i] *= fadeFactor
      }

      // Return particles to base positions (with smooth interpolation)
      const positions = this.geometry.attributes.position.array as Float32Array

      // On first update without audio, ensure positions are set to base
      if (!this.isInitialized) {
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3
          positions[i3] = this.basePositions[i3]
          positions[i3 + 1] = this.basePositions[i3 + 1]
          positions[i3 + 2] = this.basePositions[i3 + 2]
        }
        this.isInitialized = true
      } else {
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3
          const baseX = this.basePositions[i3]
          const baseY = this.basePositions[i3 + 1]
          const baseZ = this.basePositions[i3 + 2]

          // Smoothly return to base position
          const lerpFactor = 0.1
          positions[i3] += (baseX - positions[i3]) * lerpFactor
          positions[i3 + 1] += (baseY - positions[i3 + 1]) * lerpFactor
          positions[i3 + 2] += (baseZ - positions[i3 + 2]) * lerpFactor
        }
      }

      this.geometry.attributes.position.needsUpdate = true
      this.material.size = ANIMATION_CONSTANTS.particles.baseSize
    }

    // Mark as initialized after first update
    if (!this.isInitialized) {
      this.isInitialized = true
    }

    // Much slower rotation (only if auto-rotation is enabled)
    // Rotate on y-axis for earth-like horizontal rotation
    if (this.autoRotationEnabled) {
      this.mesh.rotation.y += ANIMATION_CONSTANTS.autoRotation.ySpeed
    }
  }

  /**
   * Processing mode: slow, continuous noise displacement. No audio reactivity.
   * Noise sampling position drifts and rotates over time.
   */
  private applyProcessingNoiseDisplacement(): void {
    const cfg = ANIMATION_CONSTANTS.processingMode
    const t = performance.now() * 0.001
    const driftX = Math.sin(t * cfg.driftSpeed) * 2
    const driftY = Math.cos(t * cfg.driftSpeed * 0.87) * 2
    const driftZ = t * 0.3
    const rotY = t * cfg.rotateSpeed
    const rotX = t * cfg.rotateSpeed * 0.7
    const cy = Math.cos(rotY)
    const sy = Math.sin(rotY)
    const cx = Math.cos(rotX)
    const sx = Math.sin(rotX)
    const scale = cfg.noiseScale
    const amp = cfg.displacementAmplitude

    const positions = this.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const baseX = this.basePositions[i3]
      const baseY = this.basePositions[i3 + 1]
      const baseZ = this.basePositions[i3 + 2]

      this.tempVector1.set(baseX, baseY, baseZ)
      const normal = this.tempVector2.copy(this.tempVector1).normalize()

      const x1 = baseX * cy - baseZ * sy
      const z1 = baseX * sy + baseZ * cy
      const y1 = baseY
      const y2 = y1 * cx - z1 * sx
      const z2 = y1 * sx + z1 * cx
      const x2 = x1

      const nx = x2 * scale + driftX
      const ny = y2 * scale + driftY
      const nz = z2 * scale + driftZ
      const n = noise3D(nx, ny, nz)
      const displacement = (n * 0.5 + 0.5) * amp

      positions[i3] = baseX + normal.x * displacement
      positions[i3 + 1] = baseY + normal.y * displacement
      positions[i3 + 2] = baseZ + normal.z * displacement
    }
    this.geometry.attributes.position.needsUpdate = true
    this.material.size = ANIMATION_CONSTANTS.particles.baseSize
  }

  setAutoRotation(enabled: boolean) {
    this.autoRotationEnabled = enabled
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.texture.dispose()
  }
}
