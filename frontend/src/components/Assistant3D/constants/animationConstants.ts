// Animation constants for the 3D assistant

export const ANIMATION_CONSTANTS = {
  // Auto-rotation
  autoRotation: {
    ySpeed: 0.0003,
    xSpeed: 0.00015,
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
    factor: 0.30,
    fadeFactor: 0.80,
  },

  // Particle settings
  particles: {
    count: 5000,
    baseSize: 0.02,
    sizeVariation: 0.03,
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
  },
} as const
