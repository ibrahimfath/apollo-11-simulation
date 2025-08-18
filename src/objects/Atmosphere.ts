import * as THREE from "three";
import vertexShader from "../visualization/shaders/atmosphere.vert.glsl";
import fragmentShader from "../visualization/shaders/atmosphere.frag.glsl";


export class Atmosphere {
  public material?: THREE.ShaderMaterial;
  public mesh?: THREE.Mesh;
  public rimHex?: number;     // Rim scattering color
  public facingHex?: number;  // Center-facing color
  public bias?: number;
  public scale?: number;
  public power?: number;
  public baseRadius?: number

  constructor() {
    this.rimHex = 0x0088ff;
    this.facingHex = 0x000000;
    this.bias = 0.1;
    this.scale = 0.5;
    this.power = 5.0;

    const uniforms = {
      color1: { value: new THREE.Color(this.rimHex) },
      color2: { value: new THREE.Color(this.facingHex) },
      atmosphereBias: { value: this.bias },
      atmosphereScale: { value: this.scale },
      atmospherePower: { value: this.power},
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    

  }
}
