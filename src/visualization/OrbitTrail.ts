import * as THREE from "three";

export class OrbitTrail {
  private points: THREE.Vector3[] = [];
  private line: THREE.Points;
  public frameCounter = 0;
  public sampleRate: number;
  private maxPoints?: number;
  

  constructor(
    color = 0xffffff,
    sampleRate = 1,      // add point every N frames
    maxPoints?: number,   // optional safety cap
    pointSize = 2          // new: size in pixels
  ) {
    this.sampleRate = Math.max(1, sampleRate);
    this.maxPoints = maxPoints;

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({ color, size: pointSize });
    this.line = new THREE.Points(geometry, material);
  }

  get object3d() {
    return this.line;
  }

  addPoint(pos: THREE.Vector3) {
    this.frameCounter++;
    if (this.frameCounter % this.sampleRate !== 0) return;

    this.points.push(pos.clone());

    // enforce safety cap
    if (this.maxPoints && this.points.length > this.maxPoints) {
      this.points.shift();
    }

    this.updateGeometry();
  }

  private updateGeometry() {
    const positions = new Float32Array(this.points.length * 3);
    for (let i = 0; i < this.points.length; i++) {
      positions[i * 3] = this.points[i].x;
      positions[i * 3 + 1] = this.points[i].y;
      positions[i * 3 + 2] = this.points[i].z;
    }
    this.line.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.line.geometry.setDrawRange(0, this.points.length);
    this.line.geometry.computeBoundingSphere();
  }

  clear() {
    this.points = [];
    this.updateGeometry();
  }
}
