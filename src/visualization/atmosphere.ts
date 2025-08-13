import * as THREE from "three";

interface atmosphereParams {
  rimHex?: number;     // Color on rim (scattering color)
  facingHex?: number;  // Color when facing the camera
}

export function getatmosphereMat({
  rimHex = 0x0088ff,
  facingHex = 0x000000
}: atmosphereParams = {}): THREE.ShaderMaterial {
  
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    atmosphereBias: { value: 0.1 },
    atmosphereScale: { value: 0.27 },
    atmospherePower: { value: 5.0 },
  };

  const vs = `
    uniform float atmosphereBias;
    uniform float atmosphereScale;
    uniform float atmospherePower;
    
    varying float vReflectionFactor;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    
      vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
    
      vec3 I = worldPosition.xyz - cameraPosition;
    
      vReflectionFactor = atmosphereBias + atmosphereScale * pow( 1.0 + dot( normalize( I ), worldNormal ), atmospherePower );
    
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fs = `
    uniform vec3 color1;
    uniform vec3 color2;
    
    varying float vReflectionFactor;
    
    void main() {
      float f = clamp( vReflectionFactor, 0.0, 1.0 );
      gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
}
