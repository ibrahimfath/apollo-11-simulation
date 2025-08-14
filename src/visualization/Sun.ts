import * as THREE from "three";
import { markForBloom } from "./bloom";


export class Sun {
  public light: THREE.DirectionalLight;
  public mesh: THREE.Mesh;
  public lightColor: number;
  public lightIntensity: number;

  constructor(){
    const detail = 12;
    const geometry = new THREE.IcosahedronGeometry(7, detail);
    const material = new THREE.MeshBasicMaterial({ color: "#FDB813" })
    this.lightColor = 0xffffff;
    this.lightIntensity = 3.0;
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 700);
    this.light = new THREE.DirectionalLight(this.lightColor, this.lightIntensity);
    this.light.position.set(0, 0, 130);
    
    markForBloom(this.mesh); // Sun glows
    }
}


