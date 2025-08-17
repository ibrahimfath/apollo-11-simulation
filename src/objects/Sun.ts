import * as THREE from "three";
import vertexShader from "../visualization/shaders/atmosphere.vert.glsl";
import fragmentShader from "../visualization/shaders/atmosphere.frag.glsl";

export class Sun {
  public material?: THREE.MeshStandardMaterial;
  public geometry?: THREE.IcosahedronGeometry;
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public rimHex?: number;     // Rim scattering color
  public facingHex?: number;  // Center-facing color
  public bias?: number;
  public scale?: number;
  public power?: number;
  public baseRadius?: number

  public light: THREE.DirectionalLight;

  constructor(){
    this.rimHex = 0xf5be29;
    this.facingHex = 0xd9cb81;
    this.bias = 10.0;
    this.scale = 1.1;
    this.power = 17.0;

    this.group = new THREE.Group();

    const uniforms = {
      color1: { value: new THREE.Color(this.rimHex) },
      color2: { value: new THREE.Color(this.facingHex) },
      atmosphereBias: { value: this.bias },
      atmosphereScale: { value: this.scale },
      atmospherePower: { value: this.power},
    };

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const detail = 7;
    this.geometry = new THREE.IcosahedronGeometry(7, detail);

    const glowMesh = new THREE.Mesh(this.geometry, glowMaterial);
    glowMesh.position.set(0, 0, 700);
    glowMesh.scale.setScalar(1.01);

    this.group.add(glowMesh);

    const loader = new THREE.TextureLoader();
    

    this.material = new THREE.MeshStandardMaterial({
      map: loader.load("/textures/sun/8k_sun.jpg")
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 700);

    this.group.add(this.mesh);
    

    this.light = new THREE.DirectionalLight(0xffffff, 1.5);
    this.light.position.set(0, 0, 130);

    this.group.add(this.light);
    
    }
}
