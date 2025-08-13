uniform float atmosphereBias;
uniform float atmosphereScale;
uniform float atmospherePower;

varying float vReflectionFactor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  vec3 worldNormal = normalize(
    mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal
  );

  vec3 I = worldPosition.xyz - cameraPosition;

  vReflectionFactor = atmosphereBias +
    atmosphereScale * pow(1.0 + dot(normalize(I), worldNormal), atmospherePower);

  gl_Position = projectionMatrix * mvPosition;
}
