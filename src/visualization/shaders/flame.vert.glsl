varying vec2 vUv;
varying float vPosY;
void main() {
  vUv = uv;
  vPosY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}