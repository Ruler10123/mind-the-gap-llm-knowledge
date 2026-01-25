// Animation constants for the 3D assistant

export const ANIMATION_CONSTANTS = {
  // Auto-rotation (only y-axis for earth-like rotation)
  autoRotation: {
    ySpeed: 0.00015,
    xSpeed: 0, // Disabled - only rotate on y-axis
  },

  // Spike rotation
  spikeRotation: {
    baseSpeed: 0.005,
    volumeBoost: 0.005,
  },

  // Drag rotation
  dragRotation: {
    speed: 0.005,
    damping: 0.95, // Velocity damping factor (0-1, lower = more damping)
    minVelocity: 0.0001, // Minimum velocity before stopping
  },

  // Audio smoothing
  audioSmoothing: {
    factor: 0.3,
    fadeFactor: 0.8,
  },

  // Particle settings
  particles: {
    count: 10000,
    baseSize: 0.02,
    sizeVariation: 0.005,
  },

  // Spike settings
  spikes: {
    count: 20,
    maxHeight: 0.4,
    radius: 0.6,
    heightMultiplier: 0.35,
  },

  // Deformation
  deformation: {
    maxDisplacement: 0.08,
    intensityMultiplier: 1.5,
    volumeMultiplier: 0.8,
    passiveMaxDisplacement: 0.03,
    passiveIntensityMultiplier: 0.5,
    passiveVolumeMultiplier: 0.3,
  },

  // Passive mode transitions
  passiveMode: {
    transitionSpeed: 0.05, // Lerp factor for smooth transitions (0-1, higher = faster)
  },

  // Processing mode – slow noise displacement (no audio reactivity)
  processingMode: {
    noiseScale: 4,
    displacementAmplitude: 0.025,
    driftSpeed: 0.2,
    rotateSpeed: 0.12,
  },
} as const
