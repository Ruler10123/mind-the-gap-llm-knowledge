import * as THREE from 'three'
import { average } from '../utils/noiseUtils'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'

export type SphereMode = 'earth' | 'default'

export class ParticleSphereEntity {
  mesh: THREE.Points
  material: THREE.PointsMaterial
  geometry: THREE.BufferGeometry
  private texture: THREE.CanvasTexture

  // Smoothing state for gradual transitions
  private smoothedAudioAmplitude = 0
  private smoothedFrequencies: Float32Array = new Float32Array(32)
  private particleCount: number = ANIMATION_CONSTANTS.particles.count
  private basePositions: Float32Array
  private positions: Float32Array
  private spikeRotationTime = 0 // Time for spike pattern rotation
  private autoRotationEnabled = true // Whether automatic rotation is enabled
  private isInitialized = false // Track if geometry has been initialized

  // Mode system - DEPRECATED: Only uniform white sphere mode now
  // private currentMode: SphereMode = 'earth'
  private targetColors: Float32Array // Target colors for smooth transitions
  private uniformPositions: Float32Array // Uniformly distributed positions (only mode now)
  // DEPRECATED: Earth mode disabled
  // private continentPositions: Float32Array // Continent-biased positions for earth mode

  // DEPRECATED: Heightmap data (continents mask: black=continents, white=oceans)
  // private heightmapCanvas: HTMLCanvasElement | null = null
  // private heightmapContext: CanvasRenderingContext2D | null = null
  // private heightmapLoaded = false
  // private sphericalCoords: Array<{ theta: number; phi: number }> = [] // Store spherical coords for UV mapping

  // DEPRECATED: Precalculated color lookup tables
  // private earthColors: {
  //   rotationBuckets: Array<Float32Array> // Precomputed colors at rotation intervals
  //   bucketAngleStep: number // Radians between buckets (e.g., π/18 = 10°)
  // }
  private defaultColors: Float32Array // Precalculated white colors (only mode now)

  // Reusable Vector3 objects (reduce GC pressure)
  private tempVector1: THREE.Vector3
  private tempVector2: THREE.Vector3
  private tempVector3: THREE.Vector3

  constructor() {
    // Create particle positions in sphere formation
    this.particleCount = ANIMATION_CONSTANTS.particles.count
    this.positions = new Float32Array(this.particleCount * 3)
    this.basePositions = new Float32Array(this.particleCount * 3)
    this.targetColors = new Float32Array(this.particleCount * 3)
    this.uniformPositions = new Float32Array(this.particleCount * 3)
    
    // DEPRECATED: Earth mode disabled - initialized but never used
    this.continentPositions = new Float32Array(this.particleCount * 3)
    this.earthColors = {
      rotationBuckets: [],
      bucketAngleStep: 0,
    }

    // Initialize default colors (all white) - only mode now
    this.defaultColors = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount * 3; i += 3) {
      this.defaultColors[i] = 1.0 // R
      this.defaultColors[i + 1] = 1.0 // G
      this.defaultColors[i + 2] = 1.0 // B
    }

    // Initialize reusable Vector3 objects
    this.tempVector1 = new THREE.Vector3()
    this.tempVector2 = new THREE.Vector3()
    this.tempVector3 = new THREE.Vector3()

    // Generate uniform random sphere positions (only mode now)
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

    // DEPRECATED: Earth mode disabled - continent-biased generation removed
    // this.loadHeightmap()
    // ... (earth generation code commented out)

    // Geometry - use the positions array directly
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3),
    )

    // Initialize color array (RGB per particle)
    const colors = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      // Default to white, will be updated when heightmap loads
      colors[i3] = 1.0 // R
      colors[i3 + 1] = 1.0 // G
      colors[i3 + 2] = 1.0 // B
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
  }

  /**
   * DEPRECATED: Load continents mask texture (black=continents, white=oceans)
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private loadHeightmap() {
    const img = new Image()

    img.onload = () => {
      // Create canvas to sample pixel data
      this.heightmapCanvas = document.createElement('canvas')
      this.heightmapCanvas.width = img.width
      this.heightmapCanvas.height = img.height
      this.heightmapContext = this.heightmapCanvas.getContext('2d', {
        willReadFrequently: true,
      })!
      this.heightmapContext.drawImage(img, 0, 0)

      this.heightmapLoaded = true

      // 1. Regenerate particles with index-aligned buffers
      this.regenerateParticlesWithBias()

      // 2. Precalculate earth colors for all rotations
      this.precalculateEarthColors()
    }

    img.onerror = (error) => {
      console.error('Failed to load continents mask:', error)
    }

    // Load from public folder
    img.src = '/continents.png'
  }

  /**
   * Regenerate particles with continent bias (called after heightmap loads)
   * Creates index-aligned buffers: uniformPositions[i] is closest to continentPositions[i]
   */
  private regenerateParticlesWithBias() {
    if (
      !this.heightmapLoaded ||
      !this.heightmapContext ||
      !this.heightmapCanvas
    )
      return

    // Clear existing positions
    this.sphericalCoords = []

    // Regenerate with bias
    let particlesGenerated = 0
    const maxAttempts = this.particleCount * 10

    for (
      let attempt = 0;
      attempt < maxAttempts && particlesGenerated < this.particleCount;
      attempt++
    ) {
      const radius = 1.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      // Check if on continent
      const { u, v } = this.sphericalToUV(theta, phi)
      const maskValue = this.sampleHeightmap(u, v)
      const isContinent = maskValue < 0.5

      // Acceptance probability
      const acceptProbability = isContinent
        ? 1.0
        : 1.0 / ANIMATION_CONSTANTS.continentSampling.bias

      if (Math.random() < acceptProbability) {
        this.sphericalCoords.push({ theta, phi })

        // Store earth position with elevation
        const elevatedRadius = isContinent
          ? radius + ANIMATION_CONSTANTS.continentSampling.elevation
          : radius
        const x = elevatedRadius * Math.sin(phi) * Math.cos(theta)
        const y = elevatedRadius * Math.cos(phi)
        const z = elevatedRadius * Math.sin(phi) * Math.sin(theta)

        const i3 = particlesGenerated * 3
        this.continentPositions[i3] = x
        this.continentPositions[i3 + 1] = y
        this.continentPositions[i3 + 2] = z

        // Calculate closest uniform sphere point (same angles, radius=1.0)
        const uniformX = Math.sin(phi) * Math.cos(theta)
        const uniformY = Math.cos(phi)
        const uniformZ = Math.sin(phi) * Math.sin(theta)

        this.uniformPositions[i3] = uniformX
        this.uniformPositions[i3 + 1] = uniformY
        this.uniformPositions[i3 + 2] = uniformZ

        // Initialize basePositions and positions
        this.basePositions[i3] = x
        this.basePositions[i3 + 1] = y
        this.basePositions[i3 + 2] = z

        this.positions[i3] = x
        this.positions[i3 + 1] = y
        this.positions[i3 + 2] = z

        particlesGenerated++
      }
    }

    // Fill remaining with uniform distribution
    while (particlesGenerated < this.particleCount) {
      const radius = 1.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      this.sphericalCoords.push({ theta, phi })

      // Y-up spherical to cartesian (phi=0 is north pole at +Y)
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.cos(phi)
      const z = radius * Math.sin(phi) * Math.sin(theta)

      const i3 = particlesGenerated * 3

      // For unfilled particles, use same position for both modes
      this.continentPositions[i3] = x
      this.continentPositions[i3 + 1] = y
      this.continentPositions[i3 + 2] = z

      this.uniformPositions[i3] = x
      this.uniformPositions[i3 + 1] = y
      this.uniformPositions[i3 + 2] = z

      this.basePositions[i3] = x
      this.basePositions[i3 + 1] = y
      this.basePositions[i3 + 2] = z

      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z

      particlesGenerated++
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true
  }

  /**
   * DEPRECATED: Convert spherical coordinates to UV coordinates for EPSG:4326 mapping
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sphericalToUV(theta: number, phi: number): { u: number; v: number } {
    // U: longitude mapping (theta wraps around)
    const u = (theta / (Math.PI * 2)) % 1.0
    // V: latitude mapping (phi=0 is north pole, phi=π is south pole)
    // Image has north at top (v=0), south at bottom (v=1)
    const v = phi / Math.PI
    return { u: u < 0 ? u + 1 : u, v }
  }

  /**
   * DEPRECATED: Convert 3D position to spherical coordinates for earth mapping
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private positionToSpherical(
    x: number,
    y: number,
    z: number,
  ): { theta: number; phi: number } {
    const radius = Math.sqrt(x * x + y * y + z * z)
    if (radius < 0.0001) return { theta: 0, phi: 0 }

    // Normalize
    const nx = x / radius
    const ny = y / radius
    const nz = z / radius

    // For earth mapping: poles on Y axis (vertical)
    // phi: latitude from Y axis (0 = north pole at y=1, π = south pole at y=-1)
    const phi = Math.acos(Math.max(-1, Math.min(1, ny)))

    // theta: longitude in xz-plane (0 = +x axis, increasing counterclockwise when viewed from above)
    const theta = Math.atan2(nz, nx)
    const normalizedTheta = theta < 0 ? theta + Math.PI * 2 : theta

    return { theta: normalizedTheta, phi }
  }

  /**
   * DEPRECATED: Get UV coordinates accounting for mesh rotation
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getUVWithRotation(
    x: number,
    y: number,
    z: number,
  ): { u: number; v: number } {
    // Apply inverse of mesh rotation to get texture-space coordinates
    // Rotate around Y axis (vertical) by negative rotation angle
    const ry = -this.mesh.rotation.y

    // Rotate around Y axis
    const cosRy = Math.cos(ry)
    const sinRy = Math.sin(ry)
    const rotatedX = x * cosRy - z * sinRy
    const rotatedZ = x * sinRy + z * cosRy
    const rotatedY = y // Y doesn't change with rotation around Y axis

    // Convert to spherical coordinates
    const { theta, phi } = this.positionToSpherical(
      rotatedX,
      rotatedY,
      rotatedZ,
    )

    // Convert to UV
    return this.sphericalToUV(theta, phi)
  }

  /**
   * Sample continents mask at UV coordinates
   * Returns normalized value: 0 = black (continent), 1 = white (ocean)
   */
  private sampleHeightmap(u: number, v: number): number {
    if (!this.heightmapContext || !this.heightmapCanvas) return 0.5 // Default to ocean if not loaded

    // Clamp UV coordinates
    u = Math.max(0, Math.min(1, u))
    v = Math.max(0, Math.min(1, v))

    // Convert to pixel coordinates
    const x = Math.floor(u * (this.heightmapCanvas.width - 1))
    const y = Math.floor(v * (this.heightmapCanvas.height - 1))

    // Sample pixel (grayscale, use red channel)
    const imageData = this.heightmapContext.getImageData(x, y, 1, 1)
    const maskValue = imageData.data[0] / 255.0 // Normalize to 0-1 (0=black/continent, 1=white/ocean)

    return maskValue
  }


  /**
   * DEPRECATED: Precalculate earth colors for all rotation angles
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private precalculateEarthColors(): void {
    const numBuckets = ANIMATION_CONSTANTS.colorPrecalculation.rotationBuckets
    this.earthColors.bucketAngleStep = (Math.PI * 2) / numBuckets

    for (let bucket = 0; bucket < numBuckets; bucket++) {
      const rotationAngle = bucket * this.earthColors.bucketAngleStep
      const colors = new Float32Array(this.particleCount * 3)

      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3

        // Use CONTINENT positions (not base positions - critical!)
        const x = this.continentPositions[i3]
        const y = this.continentPositions[i3 + 1]
        const z = this.continentPositions[i3 + 2]

        // Apply rotation transform (rotate around Y axis)
        const cosRy = Math.cos(-rotationAngle)
        const sinRy = Math.sin(-rotationAngle)
        const rotatedX = x * cosRy - z * sinRy
        const rotatedZ = x * sinRy + z * cosRy

        // Convert to spherical and then UV
        const { theta, phi } = this.positionToSpherical(rotatedX, y, rotatedZ)
        const { u, v } = this.sphericalToUV(theta, phi)

        // Sample heightmap
        const maskValue = this.sampleHeightmap(u, v)

        // Set color based on continent vs ocean
        if (maskValue < 0.5) {
          // Continent - green
          colors[i3] = 0.2 // R
          colors[i3 + 1] = 0.8 // G
          colors[i3 + 2] = 0.3 // B
        } else {
          // Ocean - blue
          colors[i3] = 0.2 // R
          colors[i3 + 1] = 0.4 // G
          colors[i3 + 2] = 0.9 // B
        }
      }

      this.earthColors.rotationBuckets[bucket] = colors
    }
  }

  /**
   * DEPRECATED: Get interpolated earth colors for current rotation angle
   * Earth mode disabled - this method is kept but not called
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getEarthColorsForRotation(rotationY: number): Float32Array | null {
    // Check if rotation buckets are populated
    if (
      this.earthColors.rotationBuckets.length === 0 ||
      this.earthColors.bucketAngleStep === 0
    ) {
      return null
    }

    const normalized =
      ((rotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const bucketFloat = normalized / this.earthColors.bucketAngleStep

    const numBuckets = ANIMATION_CONSTANTS.colorPrecalculation.rotationBuckets
    const bucket1 = Math.floor(bucketFloat) % numBuckets
    const bucket2 = (bucket1 + 1) % numBuckets
    const t = bucketFloat - Math.floor(bucketFloat)

    const colors1 = this.earthColors.rotationBuckets[bucket1]
    const colors2 = this.earthColors.rotationBuckets[bucket2]

    // Additional safety check
    if (!colors1 || !colors2) {
      return null
    }

    const result = new Float32Array(this.particleCount * 3)
    for (let i = 0; i < result.length; i++) {
      result[i] = colors1[i] + (colors2[i] - colors1[i]) * t
    }

    return result
  }

  /**
   * Update base positions - simplified to always use uniform positions
   * DEPRECATED: Mode switching removed, always uses uniform positions
   */
  private updateBasePositions(): void {
    // No-op: base positions are already set to uniform positions in constructor
    // This method kept for compatibility but does nothing
  }

  /**
   * Apply colors - simplified to always use white colors
   * DEPRECATED: Mode switching removed, always uses white
   */
  private applyColors(): void {
    const colors = this.geometry.attributes.color.array as Float32Array
    const lerpFactor = 0.05

    // Always use white colors (only mode now)
    const targetColors = this.defaultColors

    // Lerp toward white
    for (let i = 0; i < this.particleCount * 3; i++) {
      colors[i] += (targetColors[i] - colors[i]) * lerpFactor
    }

    this.geometry.attributes.color.needsUpdate = true
  }

  update(frequencyData: Uint8Array<ArrayBuffer> | null) {
    // Update base positions with smooth transitions between modes
    this.updateBasePositions()

    // Update colors with smooth transitions (accounts for rotation)
    this.applyColors()

    // Always update spike rotation time for continuous animation
    if (!frequencyData) {
      // Continue rotation at base speed when no audio
      const baseRotationSpeed = ANIMATION_CONSTANTS.spikeRotation.baseSpeed
      this.spikeRotationTime += baseRotationSpeed
    }

    if (frequencyData) {
      // Extract audio features
      const volume = average(frequencyData) / 255
      const lowFreq = average(Array.from(frequencyData.slice(0, 10))) / 255 // Bass
      const midFreq = average(Array.from(frequencyData.slice(10, 20))) / 255 // Mid (vocal range)
      const highFreq = average(Array.from(frequencyData.slice(30, 64))) / 255 // Highs

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

      // Deformation intensity based on vocal range
      const deformationIntensity = Math.max(
        midFreq * ANIMATION_CONSTANTS.deformation.intensityMultiplier,
        volume * ANIMATION_CONSTANTS.deformation.volumeMultiplier,
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

        // Apply displacement
        if (totalSpikeInfluence > 0) {
          this.tempVector3.normalize()
          const displacementAmount =
            totalSpikeInfluence * ANIMATION_CONSTANTS.spikes.heightMultiplier
          const maxSpikeHeight = ANIMATION_CONSTANTS.spikes.maxHeight
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

      // Always mark as needing update to ensure rendering continues
      this.geometry.attributes.position.needsUpdate = true

      this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
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

  setAutoRotation(enabled: boolean) {
    this.autoRotationEnabled = enabled
  }

  /**
   * DEPRECATED: Mode switching removed - only uniform white sphere mode now
   * This method is kept for compatibility but does nothing
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setMode(mode: SphereMode) {
    // No-op: mode switching disabled
    // this.currentMode = mode
  }

  /**
   * DEPRECATED: Mode switching removed - only uniform white sphere mode now
   * Always returns 'default' for compatibility
   */
  getMode(): SphereMode {
    return 'default' // Always default mode now
    // return this.currentMode
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.texture.dispose()
    // DEPRECATED: Clean up heightmap resources (earth mode disabled, but kept for compatibility)
    if (this.heightmapCanvas) {
      this.heightmapCanvas.width = 0
      this.heightmapCanvas.height = 0
    }
  }
}
