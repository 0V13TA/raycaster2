import type Material from "./Material";
import type { Vector2 } from "./Types";
import { RAD2DEG } from "./utils";

export default class Boundary {
  p1: Vector2;
  p2: Vector2;
  material: Material | null = null;

  constructor(p1: Vector2, p2: Vector2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#fff";
    ctx.moveTo(this.p1[0], this.p1[1]);
    ctx.lineTo(this.p2[0], this.p2[1]);
    ctx.stroke();
    ctx.restore();
  }

  getAngle() {
    const dx = this.p2[0] - this.p1[0];
    const dy = this.p2[1] - this.p1[1];
    const angle = Math.atan2(dy, dx);
    const angleDeg = angle * RAD2DEG;
    return (angleDeg + 360) % 360; // Wrap around to [0, 360)
  }

  getNormal() {
    const dx = this.p2[0] - this.p1[0];
    const dy = this.p2[1] - this.p1[1];

    // perpendicular vector (normal) to the boundary
    const nx = -dy;
    const ny = dx;

    const length = Math.sqrt(nx * nx + ny * ny);
    if (length === 0) return [0, 0] as Vector2; // Avoid division by zero
    return [nx / length, ny / length] as Vector2; // Normalize the normal vector
  }
}
