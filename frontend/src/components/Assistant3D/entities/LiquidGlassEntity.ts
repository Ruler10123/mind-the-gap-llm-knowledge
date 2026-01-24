import * as THREE from 'three'
import { average } from '../utils/noiseUtils'

export class LiquidGlassEntity {
  mesh: THREE.Points
  material: THREE.PointsMaterial
  geometry: THREE.BufferGeometry
  private texture: THREE.CanvasTexture
  
  // Smoothing state for gradual transitions
  private smoothedAudioAmplitude: number = 0
  private smoothedFrequencies: Float32Array = new Float32Array(32)
  private particleCount: number = 5000
  private basePositions: Float32Array
  private positions: Float32Array
  private spikeRotationTime: number = 0 // Time for spike pattern rotation

  constructor() {
    // Create particle positions in sphere formation
    this.particleCount = 5000
    this.positions = new Float32Array(this.particleCount * 3)
    this.basePositions = new Float32Array(this.particleCount * 3)
    
    // Generate particles in sphere pattern
    for (let i = 0; i < this.particleCount; i++) {
      // Spherical distribution
      const radius = 1.0
      const theta = Math.random() * Math.PI * 2 // Azimuth
      const phi = Math.acos(2 * Math.random() - 1) // Inclination
      
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)
      
      const i3 = i * 3
      this.basePositions[i3] = x
      this.basePositions[i3 + 1] = y
      this.basePositions[i3 + 2] = z
      
      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z
    }

    // Geometry
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))

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

    // White particle material with circular texture
    this.material = new THREE.PointsMaterial({
      color: 0xffffff, // White
      size: 0.02,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: this.texture,
      alphaTest: 0.001,
    })

    // Points mesh
    this.mesh = new THREE.Points(this.geometry, this.material)
  }

  update(frequencyData: Uint8Array<ArrayBuffer> | null) {
    // Smoothing factor (higher = faster response, lower = smoother)
    const smoothingFactor = 0.30 // Smooth transitions

    if (frequencyData) {
      // Extract audio features
      const volume = average(frequencyData) / 255
      const lowFreq = average(Array.from(frequencyData.slice(0, 10))) / 255 // Bass
      const midFreq = average(Array.from(frequencyData.slice(10, 20))) / 255 // Mid (vocal range)
      const highFreq = average(Array.from(frequencyData.slice(30, 64))) / 255 // Highs

      // Smooth audio amplitude
      const targetAmplitude = volume
      this.smoothedAudioAmplitude += (targetAmplitude - this.smoothedAudioAmplitude) * smoothingFactor
      
      // Update spike rotation time - speed increases with voice volume
      const baseRotationSpeed = 0.005 // Base rotation speed
      const volumeBoost = this.smoothedAudioAmplitude * 0.005 // Additional speed based on volume
      this.spikeRotationTime += baseRotationSpeed + volumeBoost

      // Smooth frequency data array
      for (let i = 0; i < 32; i++) {
        const targetFreq = frequencyData[i] / 255.0
        this.smoothedFrequencies[i] += (targetFreq - this.smoothedFrequencies[i]) * smoothingFactor
      }
      
      // Deformation intensity based on vocal range
      const deformationIntensity = Math.max(midFreq * 1.5, volume * 0.8)
      
      // Create spike centers distributed across the sphere based on frequency bands
      // Each frequency band creates a spike at a specific location
      const numSpikes = 20 // Number of spike centers
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
        const rotatedX = spikeX * Math.cos(rotationY) - spikeZ * Math.sin(rotationY)
        const rotatedZ = spikeX * Math.sin(rotationY) + spikeZ * Math.cos(rotationY)
        
        // Map spike to frequency band (distribute across all 32 bands)
        const freqIndex = Math.floor((i / numSpikes) * 32)
        const spikeIntensity = this.smoothedFrequencies[freqIndex] * deformationIntensity
        
        spikeCenters.push({
          pos: new THREE.Vector3(rotatedX, spikeY, rotatedZ),
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
        const basePos = new THREE.Vector3(baseX, baseY, baseZ)
        const normal = basePos.clone().normalize()
        
        let totalDisplacement = 0.0
        let displacementDirection = new THREE.Vector3(0, 0, 0)
        
        // Calculate displacement from each spike center
        // Combine multiple spikes with smooth blending
        let totalSpikeInfluence = 0.0
        let weightedDirection = new THREE.Vector3(0, 0, 0)
        
        for (const spike of spikeCenters) {
          if (spike.intensity < 0.01) continue // Skip inactive spikes
          
          // Calculate angular distance on sphere surface (dot product of normalized vectors)
          const baseNormal = basePos.clone().normalize()
          const dot = baseNormal.dot(spike.pos)
          const angularDistance = Math.acos(Math.max(-1, Math.min(1, dot))) // Clamp to avoid NaN
          
          // Smooth falloff function for spike shape (smoothstep-like)
          const spikeRadius = 0.6 // Angular radius of influence for each spike
          const normalizedDist = angularDistance / spikeRadius
          let falloff = 0
          if (normalizedDist < 1) {
            falloff = 1 - (normalizedDist * normalizedDist * (3 - 2 * normalizedDist))
          }
          
          // Displacement magnitude based on spike intensity and falloff
          const spikeInfluence = spike.intensity * falloff
          
          if (spikeInfluence > 0) {
            // Weighted direction toward spike center
            const toSpike = spike.pos.clone().sub(basePos).normalize()
            weightedDirection.add(toSpike.multiplyScalar(spikeInfluence))
            totalSpikeInfluence += spikeInfluence
          }
        }
        
        // Apply displacement - spikes extend outward from sphere surface
        if (totalSpikeInfluence > 0) {
          // Normalize weighted direction and project onto normal
          weightedDirection.normalize()
          const displacementAmount = totalSpikeInfluence * 0.35 // Spike height multiplier
          const maxSpikeHeight = 0.4 // Maximum spike height
          const displacement = Math.min(displacementAmount, maxSpikeHeight)
          
          // Displace along normal (outward)
          positions[i3] = baseX + normal.x * displacement
          positions[i3 + 1] = baseY + normal.y * displacement
          positions[i3 + 2] = baseZ + normal.z * displacement
        } else {
          // No displacement, return to base
          positions[i3] = baseX
          positions[i3 + 1] = baseY
          positions[i3 + 2] = baseZ
        }
      }
      
      this.geometry.attributes.position.needsUpdate = true

      // Particle size based on high frequencies
      this.material.size = 0.02 + highFreq * 0.03
    } else {
      // Fade out audio effects when no input
      const fadeFactor = 0.80
      this.smoothedAudioAmplitude *= fadeFactor
      
      // Continue rotation at base speed when no audio
      const baseRotationSpeed = 0.02
      this.spikeRotationTime += baseRotationSpeed
      
      for (let i = 0; i < 32; i++) {
        this.smoothedFrequencies[i] *= fadeFactor
      }
      
      // Return particles to base positions
      const positions = this.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3
        positions[i3] += (this.basePositions[i3] - positions[i3]) * 0.1
        positions[i3 + 1] += (this.basePositions[i3 + 1] - positions[i3 + 1]) * 0.1
        positions[i3 + 2] += (this.basePositions[i3 + 2] - positions[i3 + 2]) * 0.1
      }
      this.geometry.attributes.position.needsUpdate = true
      
      this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
      this.material.size = 0.02
    }

    // Much slower rotation
    this.mesh.rotation.y += 0.0003
    this.mesh.rotation.x += 0.00015
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    this.texture.dispose()
  }
}
