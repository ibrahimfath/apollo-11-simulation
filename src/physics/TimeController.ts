export class TimeController {
  public scale: number;

  constructor(initialScale: number = 1) {
    this.scale = initialScale;
  }

  // Modify time scale dynamically
  setScale(newScale: number) {
    this.scale = newScale;
  }

  // Apply scaling to delta time
  apply(deltaTime: number): number {
    return deltaTime * this.scale;
  }
}
