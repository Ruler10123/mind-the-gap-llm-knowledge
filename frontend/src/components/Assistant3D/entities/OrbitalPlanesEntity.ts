import * as THREE from 'three'
import { ANIMATION_CONSTANTS } from '../constants/animationConstants'

interface Airplane {
  group: THREE.Group
  orbitRadius: number
  orbitSpeed: number
  tiltAngle: number
  currentAngle: number
  tiltAxis: THREE.Vector3
  positionHistory: THREE.Vector3[]
  trail: THREE.Line
  trailGeometry: THREE.BufferGeometry
}

export class OrbitalPlanesEntity {
  group: THREE.Group
  airplanes: Airplane[]
  airplaneMaterial: THREE.LineBasicMaterial
  trailMaterial: THREE.LineBasicMaterial

  private targetOpacity: number = 0
  private currentOpacity: number = 0
  private autoRotationActive: boolean = false
  private tempVector1: THREE.Vector3

  constructor() {
    this.group = new THREE.Group()
    this.airplanes = []
    this.tempVector1 = new THREE.Vector3()

    // Shared materials
    this.airplaneMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })

    this.trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })

    const {
      count,
      minOrbitRadius,
      maxOrbitRadius,
      minOrbitSpeed,
      maxOrbitSpeed,
      tiltAngles,
      trailLength,
    } = ANIMATION_CONSTANTS.orbitalPlanes

    for (let i = 0; i < count; i++) {
      // Create airplane model
      const airplaneGroup = this.createAirplaneModel()

      // Random orbit parameters
      const orbitRadius =
        minOrbitRadius + Math.random() * (maxOrbitRadius - minOrbitRadius)
      const orbitSpeed =
        minOrbitSpeed + Math.random() * (maxOrbitSpeed - minOrbitSpeed)

      // Tilt angle from predefined set
      const tiltAngleDeg = tiltAngles[i % tiltAngles.length]
      const tiltAngle = (tiltAngleDeg * Math.PI) / 180

      // Calculate tilt axis (perpendicular, varied by index)
      const axisThetaOffset = (i / count) * Math.PI * 2
      const tiltAxis = new THREE.Vector3(
        Math.cos(axisThetaOffset),
        0,
        Math.sin(axisThetaOffset),
      ).normalize()

      // Phase offset for varied starting positions
      const currentAngle = (i * Math.PI) / 3.5

      // Create trail
      const positionHistory: THREE.Vector3[] = []
      const trailGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(trailLength * 3)
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const trail = new THREE.Line(trailGeometry, this.trailMaterial)

      this.airplanes.push({
        group: airplaneGroup,
        orbitRadius,
        orbitSpeed,
        tiltAngle,
        currentAngle,
        tiltAxis,
        positionHistory,
        trail,
        trailGeometry,
      })

      this.group.add(airplaneGroup)
      this.group.add(trail)
    }
  }

  private createAirplaneModel(): THREE.Group {
    const group = new THREE.Group()
    const scale = 0.02

    // Fuselage (main body)
    const fuselageGeometry = new THREE.BoxGeometry(0.3 * scale, 0.2 * scale, 1.0 * scale)
    const fuselageEdges = new THREE.EdgesGeometry(fuselageGeometry)
    const fuselage = new THREE.LineSegments(fuselageEdges, this.airplaneMaterial)
    group.add(fuselage)

    // Wings (horizontal)
    const wingsGeometry = new THREE.BoxGeometry(2.0 * scale, 0.05 * scale, 0.4 * scale)
    const wingsEdges = new THREE.EdgesGeometry(wingsGeometry)
    const wings = new THREE.LineSegments(wingsEdges, this.airplaneMaterial)
    wings.position.z = -0.1 * scale
    group.add(wings)

    // Tail fin (vertical stabilizer)
    const tailGeometry = new THREE.BoxGeometry(0.05 * scale, 0.5 * scale, 0.3 * scale)
    const tailEdges = new THREE.EdgesGeometry(tailGeometry)
    const tail = new THREE.LineSegments(tailEdges, this.airplaneMaterial)
    tail.position.z = -0.4 * scale
    tail.position.y = 0.15 * scale
    group.add(tail)

    fuselageGeometry.dispose()
    wingsGeometry.dispose()
    tailGeometry.dispose()

    return group
  }

  setAutoRotation(enabled: boolean) {
    this.autoRotationActive = enabled
  }

  update() {
    const { fadeSpeed, maxOpacity, trailLength, trailOpacity } =
      ANIMATION_CONSTANTS.orbitalPlanes

    // Update opacity
    this.targetOpacity = this.autoRotationActive ? maxOpacity : 0.0
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * fadeSpeed
    this.airplaneMaterial.opacity = this.currentOpacity
    this.trailMaterial.opacity = this.currentOpacity * trailOpacity

    // Update each airplane's position and rotation
    for (const airplane of this.airplanes) {
      // Increment orbit angle
      airplane.currentAngle += airplane.orbitSpeed

      // Calculate basic orbit position
      const x = Math.cos(airplane.currentAngle) * airplane.orbitRadius
      const z = Math.sin(airplane.currentAngle) * airplane.orbitRadius
      const y = 0

      // Apply tilt
      this.tempVector1.set(x, y, z)
      this.tempVector1.applyAxisAngle(airplane.tiltAxis, airplane.tiltAngle)
      airplane.group.position.copy(this.tempVector1)

      // Calculate direction of travel for orientation
      const nextAngle = airplane.currentAngle + 0.01
      const nextX = Math.cos(nextAngle) * airplane.orbitRadius
      const nextZ = Math.sin(nextAngle) * airplane.orbitRadius
      const directionVector = new THREE.Vector3(nextX - x, 0, nextZ - z)
      directionVector.applyAxisAngle(airplane.tiltAxis, airplane.tiltAngle)

      // Orient airplane to face direction of travel
      const targetPosition = new THREE.Vector3().addVectors(
        airplane.group.position,
        directionVector
      )
      airplane.group.lookAt(targetPosition)

      // Update trail
      airplane.positionHistory.push(airplane.group.position.clone())
      if (airplane.positionHistory.length > trailLength) {
        airplane.positionHistory.shift()
      }

      // Update trail geometry
      const positions = airplane.trailGeometry.attributes.position.array as Float32Array
      for (let i = 0; i < trailLength; i++) {
        if (i < airplane.positionHistory.length) {
          const pos = airplane.positionHistory[i]
          positions[i * 3] = pos.x
          positions[i * 3 + 1] = pos.y
          positions[i * 3 + 2] = pos.z
        } else {
          // Fill with last known position or zero
          const pos = airplane.positionHistory[airplane.positionHistory.length - 1]
          if (pos) {
            positions[i * 3] = pos.x
            positions[i * 3 + 1] = pos.y
            positions[i * 3 + 2] = pos.z
          }
        }
      }
      airplane.trailGeometry.attributes.position.needsUpdate = true
    }
  }

  dispose() {
    this.airplaneMaterial.dispose()
    this.trailMaterial.dispose()
    for (const airplane of this.airplanes) {
      airplane.group.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose()
        }
      })
      airplane.trailGeometry.dispose()
      this.group.remove(airplane.group)
      this.group.remove(airplane.trail)
    }
    this.airplanes = []
  }
}
