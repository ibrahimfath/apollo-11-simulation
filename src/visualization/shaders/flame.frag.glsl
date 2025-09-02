varying vec2 vUv;
varying float vPosY;
uniform float uTime;
uniform float uProgress;
uniform float uIntensity;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(){
  // radial coordinate (center at uv.x=0.5)
  float r = distance(vUv, vec2(0.5, 1.0)); // flare tip at top (v=1)
  // brightness envelope: bright near center, fade with r and with progress
  float envelope = smoothstep(0.5*(1.0 - uProgress), 0.0, r);
  // flicker using time and random uv-based offset
  float flick = 0.8 + 0.2 * sin(uTime * 30.0 + (rand(vUv)*10.0));
  // color ramp from yellow -> red -> transparent
  vec3 color = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.9, 0.4), 1.0 - r);
  float alpha = envelope * flick * (1.0 - uProgress) * uIntensity;
  // make alpha fall off quickly near edges
  alpha *= smoothstep(0.6, 0.0, r);
  if(alpha < 0.001) discard;
  gl_FragColor = vec4(color, alpha);
}