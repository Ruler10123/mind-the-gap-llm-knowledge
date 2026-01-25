# Continent-Weighted Particle Distribution - Mathematical Verification

## Overview
Particles are distributed on a sphere with higher density on continents using rejection sampling from a continents mask texture.

## Coordinate Systems

### Spherical Coordinates (Y-up)
- **θ (theta)**: Azimuthal angle [0, 2π] - longitude
- **φ (phi)**: Polar angle [0, π] - latitude from north pole
- **r**: Radius (constant = 1.0)

### Key Points on Sphere
- **North Pole**: φ = 0 → y = cos(0) = 1 ✓
- **South Pole**: φ = π → y = cos(π) = -1 ✓
- **Equator**: φ = π/2 → y = cos(π/2) = 0 ✓

## Spherical to Cartesian Conversion (Y-up)

```
x = r * sin(φ) * cos(θ)
y = r * cos(φ)           ← Y-axis is vertical
z = r * sin(φ) * sin(θ)
```

**Verification**:
- At north pole (φ=0): x=0, y=1, z=0 ✓
- At south pole (φ=π): x=0, y=-1, z=0 ✓
- Y-axis correctly represents north-south orientation ✓

## UV Mapping (Equirectangular Projection)

The continents.png texture uses equirectangular projection:

```
u = θ / (2π)    maps [0, 2π] to [0, 1]
v = φ / π       maps [0, π] to [0, 1]
```

**Texture orientation**:
- v=0 (top of image): φ=0 (north pole) ✓
- v=1 (bottom of image): φ=π (south pole) ✓
- u=0 (left edge): θ=0 (prime meridian)
- u=1 (right edge): θ=2π (wraps to prime meridian)

## Continents Mask Interpretation

The mask uses:
- **Black pixels (RGB ≈ 0)**: Continents
- **White pixels (RGB ≈ 255)**: Oceans

Sampling calculation:
```
brightness = (R + G + B) / (3 * 255)
darkness = 1 - brightness
```

Results:
- Continents (black): brightness ≈ 0 → darkness ≈ 1 ✓
- Oceans (white): brightness ≈ 1 → darkness ≈ 0 ✓

## Rejection Sampling Algorithm

### Acceptance Probability
```
bias = 3.0  (continent preference factor)
acceptance = (1 + darkness * (bias - 1)) / bias
```

**For oceans** (darkness = 0):
```
acceptance = (1 + 0 * 2) / 3 = 1/3 ≈ 0.33
```

**For continents** (darkness = 1):
```
acceptance = (1 + 1 * 2) / 3 = 3/3 = 1.0
```

**Result**: Continents are 3× more likely to accept particles ✓

### Uniform Angular Distribution
The polar angle φ is sampled using:
```
φ = acos(2 * rand() - 1)
```

This ensures uniform distribution on the sphere surface, preventing clustering at poles. The `2 * rand() - 1` produces uniform cos(φ) ∈ [-1, 1], which gives uniform area distribution when converted back via acos.

## Implementation Verification

### Code Flow
1. Generate random spherical coordinates (θ, φ) with uniform surface distribution
2. Convert to UV coordinates (u, v) for texture sampling
3. Sample continents mask at (u, v) to get darkness value
4. Calculate acceptance probability based on darkness and bias
5. Accept/reject particle position using random threshold
6. Convert accepted (θ, φ) to Cartesian (x, y, z)

### Orientation Verification
- Y-up coordinate system ensures north/south poles align vertically ✓
- UV mapping matches equirectangular projection standard ✓
- Texture wraps correctly at θ=0 and θ=2π ✓

### Edge Cases Handled
- UV wrapping: `((u % 1) + 1) % 1` handles edge wrapping
- Pixel clamping: `Math.floor(u * width) % width` prevents out-of-bounds
- Fallback: If mask fails to load, uses uniform distribution
- Safety: maxAttempts prevents infinite loops in rejection sampling

## Expected Results

With `bias = 3.0`:
- Continents should show ~3× particle density vs oceans
- North/South poles should be oriented vertically (up/down)
- Prime meridian (Greenwich) should align with front of sphere when θ=0
- Particle distribution should follow Earth's landmass patterns

## Performance Characteristics

- Typical efficiency: ~40-50% acceptance rate (due to ~30% land coverage on Earth)
- Expected attempts: ~2-3× particle count
- Actual attempts logged to console for verification
