import * as THREE from 'three'
import { average } from '../utils/noiseUtils'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'

export class ParticleSphereEntity {
  mesh: THREE.Points
  material: THREE.PointsMaterial
  geometry: THREE.BufferGeometry
  private texture: THREE.CanvasTexture
  private continentsTexture: THREE.Texture | null = null
  private continentsImageData: ImageData | null = null

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

    // Load continents mask asynchronously
    this.loadContinentsMask()

    // Initialize with uniform distribution first (will be replaced once texture loads)
    this.generateUniformParticles()

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

  /**
   * Load the continents mask texture and extract ImageData for sampling
   */
  private async loadContinentsMask(): Promise<void> {
    console.log('[ParticleSphereEntity] Loading continents mask...')
    const loader = new THREE.TextureLoader()

    try {
      this.continentsTexture = await loader.loadAsync('/continents.png')
      console.log('[ParticleSphereEntity] Continents texture loaded')

      // Extract ImageData for pixel sampling
      const image = this.continentsTexture.image as HTMLImageElement
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(image, 0, 0)
      this.continentsImageData = ctx.getImageData(0, 0, image.width, image.height)
      console.log('[ParticleSphereEntity] ImageData extracted', {
        width: this.continentsImageData.width,
        height: this.continentsImageData.height,
      })

      // Regenerate particles with continent weighting
      this.generateContinentWeightedParticles()
      this.updateGeometryPositions()
    } catch (error) {
      console.error('[ParticleSphereEntity] Failed to load continents mask:', error)
      // Keep uniform distribution if loading fails
    }
  }

  /**
   * Sample the continents mask at given UV coordinates
   * Returns darkness value (0 = white/ocean, 1 = black/continent)
   */
  private sampleContinentsMask(u: number, v: number): number {
    if (!this.continentsImageData) return 0.5 // Neutral if no texture

    const width = this.continentsImageData.width
    const height = this.continentsImageData.height

    // Wrap UV coordinates to [0, 1)
    u = ((u % 1) + 1) % 1
    v = ((v % 1) + 1) % 1

    // Convert to pixel coordinates
    const x = Math.floor(u * width) % width
    const y = Math.floor(v * height) % height

    const index = (y * width + x) * 4
    const r = this.continentsImageData.data[index]
    const g = this.continentsImageData.data[index + 1]
    const b = this.continentsImageData.data[index + 2]

    // Convert to grayscale and invert (black = 1, white = 0)
    const brightness = (r + g + b) / (3 * 255)
    return 1 - brightness // Darker = higher value
  }

  /**
   * Generate particles uniformly on sphere (fallback)
   */
  private generateUniformParticles(): void {
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
  }

  /**
   * Generate particles with continent weighting using rejection sampling
   * More particles on continents (black), fewer on oceans (white)
   */
  private generateContinentWeightedParticles(): void {
    console.log('[ParticleSphereEntity] Generating continent-weighted particles...')
    const radius = 1.0
    const continentBias = 10.0 // How much to favor continents (higher = more bias)

    let generated = 0
    let attempts = 0
    const maxAttempts = this.particleCount * 100 // Safety limit

    while (generated < this.particleCount && attempts < maxAttempts) {
      attempts++

      // Generate random point on sphere using uniform angular distribution
      const theta = Math.random() * Math.PI * 2 // Azimuthal angle [0, 2π]
      const phi = Math.acos(2 * Math.random() - 1) // Polar angle [0, π] (uniform distribution)

      // Convert spherical to UV coordinates for texture sampling
      // For equirectangular projection:
      // u = theta / (2π) - maps longitude [0, 2π] to [0, 1]
      // v = phi / π - maps latitude [0, π] to [0, 1] (0 at north pole, 1 at south)
      const u = theta / (Math.PI * 2)
      const v = phi / Math.PI

      // Sample continent mask (0 = ocean, 1 = continent)
      const continentValue = this.sampleContinentsMask(u, v)

      // Rejection sampling: accept with probability weighted by continent value
      // Ocean (white, 0): low acceptance probability (1 / continentBias)
      // Continent (black, 1): high acceptance probability (1.0)
      const acceptanceProbability = (1 + continentValue * (continentBias - 1)) / continentBias

      if (Math.random() < acceptanceProbability) {
        // Accept this particle position
        // Y-up spherical to cartesian
        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)

        const i3 = generated * 3
        this.uniformPositions[i3] = x
        this.uniformPositions[i3 + 1] = y
        this.uniformPositions[i3 + 2] = z

        this.basePositions[i3] = x
        this.basePositions[i3 + 1] = y
        this.basePositions[i3 + 2] = z

        this.positions[i3] = x
        this.positions[i3 + 1] = y
        this.positions[i3 + 2] = z

        generated++
      }
    }

    console.log('[ParticleSphereEntity] Generated particles:', {
      generated,
      attempts,
      efficiency: (generated / attempts * 100).toFixed(2) + '%',
    })

    // If we didn't generate enough particles (shouldn't happen), fill remaining uniformly
    if (generated < this.particleCount) {
      console.warn('[ParticleSphereEntity] Failed to generate all particles, filling remaining uniformly')
      for (let i = generated; i < this.particleCount; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        const x = radius * Math.sin(phi) * Math.cos(theta)
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)

        const i3 = i * 3
        this.uniformPositions[i3] = x
        this.uniformPositions[i3 + 1] = y
        this.uniformPositions[i3 + 2] = z

        this.basePositions[i3] = x
        this.basePositions[i3 + 1] = y
        this.basePositions[i3 + 2] = z

        this.positions[i3] = x
        this.positions[i3 + 1] = y
        this.positions[i3 + 2] = z
      }
    }
  }

  /**
   * Update geometry positions after regenerating particles
   */
  private updateGeometryPositions(): void {
    const positionAttr = this.geometry.attributes.position
    if (positionAttr) {
      positionAttr.array.set(this.positions)
      positionAttr.needsUpdate = true
      this.geometry.computeBoundingSphere()
      console.log('[ParticleSphereEntity] Geometry positions updated with continent weighting')
    }
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
   * Processing mode: spike-based displacement similar to active mode, but without voice input.
   * Uses time-based varying spike intensities to create distinct spikes that rotate slowly.
   */
  private applyProcessingNoiseDisplacement(): void {
    // Update spike rotation time for processing mode
    const baseRotationSpeed = ANIMATION_CONSTANTS.spikeRotation.baseSpeed * 0.5 // Slower rotation
    this.spikeRotationTime += baseRotationSpeed

    // Create time-based varying spike intensities (no frequency data)
    const t = performance.now() * 0.001
    const baseIntensity = 0.2 // Base intensity for spikes (scaled up since no voice input)
    const intensityVariation = 0.3 // Variation amount
    const intensityScale = 1.2 // Scale multiplier to make spikes more distinct

    // Create spike centers distributed across the sphere (same as active mode)
    const numSpikes = ANIMATION_CONSTANTS.spikes.count
    const spikeCenters: Array<{ pos: THREE.Vector3; intensity: number }> = []

    // Use Fibonacci sphere distribution for even spacing (same as active mode)
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

      // Time-based varying intensity per spike (creates pulsing effect)
      const timeOffset = i * 0.3 // Offset each spike's animation
      const intensityWave = Math.sin(t * 0.5 + timeOffset) * 0.5 + 0.5 // 0 to 1
      const spikeIntensity =
        (baseIntensity + intensityWave * intensityVariation) * intensityScale

      spikeCenters.push({
        pos: new THREE.Vector3(rotatedX, spikeY, rotatedZ),
        intensity: spikeIntensity,
      })
    }

    // Update particle positions to create smooth spikes (same logic as active mode)
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

      // Apply displacement - scaled up for processing mode
      if (totalSpikeInfluence > 0) {
        this.tempVector3.normalize()
        const displacementAmount =
          totalSpikeInfluence * ANIMATION_CONSTANTS.spikes.heightMultiplier
        // Use max height from active mode (scaled up for processing)
        const maxSpikeHeight = ANIMATION_CONSTANTS.spikes.maxHeight * 1.2
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
    this.material.size = ANIMATION_CONSTANTS.particles.baseSize
  }

  setAutoRotation(enabled: boolean) {
    this.autoRotationEnabled = enabled
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.texture.dispose()
    if (this.continentsTexture) {
      this.continentsTexture.dispose()
    }
  }
}
