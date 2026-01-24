varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 baseColor;
uniform vec3 glowColor;
uniform float glowIntensity;

void main() {
  // Flat gradient based on position (vertical gradient)
  // Map position to 0-1 range for gradient
  float gradientFactor = (vPosition.y + 1.0) * 0.5; // Normalize y position to 0-1
  gradientFactor = smoothstep(0.0, 1.0, gradientFactor); // Smooth the gradient
  
  // Create gradient from baseColor to glowColor
  vec3 gradientColor = mix(baseColor, glowColor, gradientFactor);
  
  // Add subtle variation based on normal for depth
  float normalVariation = vNormal.y * 0.1 + 0.9; // Subtle shading based on normal
  gradientColor *= normalVariation;
  
  // Inner glow (audio-reactive)
  vec3 glow = glowColor * glowIntensity;
  
  // Combine gradient with glow
  vec3 color = gradientColor + glow;
  
  // Constant transparency (no lighting-based alpha)
  float alpha = 0.8;

  gl_FragColor = vec4(color, alpha);
}
