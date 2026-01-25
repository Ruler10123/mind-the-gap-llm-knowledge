varying vec3 vNormal;
varying vec3 vPosition;

uniform float time;
uniform float audioAmplitude;
uniform float noiseScale;
uniform float deformationIntensity;
uniform float frequencyResponse;
uniform float audioFrequencies[32];

// Simplex noise implementation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vNormal = normalize(normalMatrix * normal);

  // Base noise for organic deformation
  vec3 noisePos = position * noiseScale + vec3(time * 0.2);
  float noiseValue = snoise(noisePos);
  
  // Frequency-based deformation - use position to sample different frequency bands
  // Map vertex position to frequency index (0-31)
  float angle = atan(position.y, position.x) + 3.14159; // 0 to 2π
  float height = (position.z + 1.0) * 0.5; // 0 to 1
  float freqIndexFloat = mod(angle * 5.0 + height * 10.0, 32.0);
  
  // Smooth frequency sampling using bilinear interpolation
  float freqIndexFloor = floor(freqIndexFloat);
  float freqIndexCeil = ceil(freqIndexFloat);
  float t = freqIndexFloat - freqIndexFloor;
  
  // Sample multiple nearby frequencies for smooth blending
  float freqMix = 0.0;
  float totalWeight = 0.0;
  
  // Sample a wider range with smooth falloff
  for (int i = -2; i <= 2; i++) {
    float idx = freqIndexFloat + float(i);
    float clampedIdx = clamp(idx, 0.0, 31.0);
    int arrayIdx = int(clampedIdx);
    float weight = 1.0 - abs(float(i)) * 0.3; // Smooth falloff
    weight = max(weight, 0.0);
    freqMix += audioFrequencies[arrayIdx] * weight;
    totalWeight += weight;
  }
  freqMix /= max(totalWeight, 0.001); // Normalize
  
  // Smooth the frequency value using smoothstep
  freqMix = smoothstep(0.0, 1.0, freqMix);
  
  // Create frequency-based wave pattern with smoother transitions
  float freqWave = sin(position.x * 3.0 + position.y * 3.0 + position.z * 3.0) * 0.5 + 0.5;
  freqWave = smoothstep(0.3, 0.7, freqWave); // Smooth the wave pattern
  float freqDeform = freqMix * freqWave * frequencyResponse;
  
  // Combine noise and frequency-based deformation with smoothing
  float baseDisplacement = noiseValue * 0.1;
  float audioDisplacement = (audioAmplitude * 0.4 + freqDeform * 0.6) * deformationIntensity;
  
  // Smooth the displacement transition
  audioDisplacement = smoothstep(0.0, 1.0, audioDisplacement);
  
  // Total displacement - more pronounced for vocal inputs, with smooth blending
  float displacement = mix(baseDisplacement, baseDisplacement + audioDisplacement * 0.8, smoothstep(0.0, 0.3, deformationIntensity));
  
  // Apply displacement along normal
  vec3 displaced = position + normal * displacement;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vPosition = displaced;

  gl_Position = projectionMatrix * mvPosition;
}
