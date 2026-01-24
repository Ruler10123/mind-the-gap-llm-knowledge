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
  },

  // Continent sampling
  continentSampling: {
    bias: 8.0, // Statistical weight for sampling particles on continents (3x more likely)
    elevation: 0.015, // Slight elevation for continent particles above ocean level
  },

  // Color precalculation
  colorPrecalculation: {
    rotationBuckets: 36, // Number of precomputed rotation angles (10° intervals)
  },

  // Nearest neighbor mapping
  nearestNeighbor: {
    gridResolution: 20, // Spatial hash grid resolution (20×20)
  },
} as const
