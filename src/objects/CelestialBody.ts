import * as THREE from "three";

export interface CelestialBodyProps {
  name?: string;
  scalePerUnit?: number;              // meters per Three.js unit
  mass?: number;               // kg
  radius?: number;             // m
  baseRadius?: number;         // m
  rotationPeriod?: number;     // s
  totalRotationPeriod: number; // s
  orbitPeriod?: number;        // s
  axialTilt?: number;          // degrees
  textureMap?: string;         // Diffuse map
  specularMap?: string;        // Specular map
  bumpMap?: string;     
  cloudsMap?: string;          // Optional clouds texture
}

export class CelestialBody {
  public group: THREE.Group;
  public mesh: THREE.Mesh;
  public clouds?: THREE.Mesh;
  public atmosphereMesh?: THREE.Mesh;

  // Physical properties
  public name: string;
  public geometry: THREE.IcosahedronGeometry;
  public mass: number;
  public radius: number;
  public baseRadius: number;
  public rotationPeriod: number;
  public totalRotationPeriod: number;
  public orbitPeriod: number;
  public axialTilt: number;
  public scalePerUnit: number;

  // Physics state (SI)
  public r_m: THREE.Vector3;    // position in meters (world)
  public v_mps: THREE.Vector3;  // velocity in m/s (world)
  public a_mps2: THREE.Vector3; // acceleration in m/s^2

  constructor(props: CelestialBodyProps, loaderManager?: THREE.LoadingManager) {
    this.name = props.name ?? "Unknown";
    this.mass = props.mass ?? 0;
    this.radius = props.radius ?? 1;
    this.baseRadius = props.baseRadius ?? 1;
    this.rotationPeriod = props.rotationPeriod ?? 1;
    this.totalRotationPeriod = props.totalRotationPeriod ?? 1;
    this.orbitPeriod = props.orbitPeriod ?? 1;
    this.axialTilt = props.axialTilt ?? 0;
    this.scalePerUnit = props.scalePerUnit ?? 1_000_000; // default: 1 unit = 1000 km

    this.group = new THREE.Group();
    this.group.rotation.z = -this.axialTilt * Math.PI / 180;

    const loader = new THREE.TextureLoader(loaderManager);
    const detail = 12;
    const scaledRadius = this.radius / this.scalePerUnit;

    // Main planet mesh
    this.geometry = new THREE.IcosahedronGeometry(scaledRadius, detail);
    const material = new THREE.MeshPhongMaterial({
      map: props.textureMap ? loader.load(props.textureMap) : undefined,
      specularMap: props.specularMap ? loader.load(props.specularMap) : undefined,
      bumpMap: props.bumpMap ? loader.load(props.bumpMap) : undefined,
      bumpScale: props.bumpMap ? scaledRadius * 0.5 : 0, // relative bump scale
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.name = `${this.name}_mesh`;
    this.group.add(this.mesh);

    // Clouds layer (optional)
    if (props.cloudsMap) {
      const cloudsMat = new THREE.MeshStandardMaterial({
        map: loader.load(props.cloudsMap),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      this.clouds = new THREE.Mesh(this.geometry, cloudsMat);
      this.clouds.name = `${this.name}_clouds`;
      this.clouds.scale.setScalar(1.003);
      this.group.add(this.clouds);
    }

    // initialize physics state at visual position (converted)
    const worldPos = new THREE.Vector3();
    this.group.getWorldPosition(worldPos); // scene units
    const meters = worldPos.multiplyScalar(this.scalePerUnit); // meters
    this.r_m = meters.clone();

    // default zero velocity
    this.v_mps = new THREE.Vector3(0, 0, 0);
    // default zero acceleration
    this.a_mps2 = new THREE.Vector3(0, 0, 0);
    
  }

  /** Update rotation based on deltaTime in seconds */
  update(deltaTime: number) {
    const rotationSpeed = (2 * Math.PI) / this.totalRotationPeriod; // rad/s
    this.mesh.rotation.y += rotationSpeed * deltaTime;

    if (this.clouds) {
      this.clouds.rotation.y += rotationSpeed * 0.5 * deltaTime; // slower clouds
    }
  }

  setRadius(newRadius: number) {
    const scaleFactor = newRadius / this.baseRadius;
    this.radius = newRadius;
    this.group.scale.setScalar(scaleFactor);
  }

  /** set initial physical state (meters, m/s) */
  public setInitialState(positionMeters: THREE.Vector3, velocityMps: THREE.Vector3) {
    this.r_m.copy(positionMeters);
    this.v_mps.copy(velocityMps);
    this.syncVisualFromPhysics();
  }

  /** update Three.js group position from r_m (meters -> scene units) */
  public syncVisualFromPhysics() {
    const invScale = 1 / this.scalePerUnit;
    this.group.position.set(this.r_m.x * invScale, this.r_m.y * invScale, this.r_m.z * invScale);
  }
}
