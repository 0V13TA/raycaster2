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

  /**
   * Calculates how far along the wall line segment a specific collision point is.
   * Returns a value between 0.0 (exactly at p1) and 1.0 (exactly at p2).
   */
  getHitPercentage(hitPoint: Vector2): number {
    const x1 = this.p1[0];
    const y1 = this.p1[1];
    const x2 = this.p2[0];
    const y2 = this.p2[1];

    const segLengthSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (segLengthSq === 0) return 0;

    // Projection math to find distance from p1 to hitPoint normalized by segment length
    const currentDistSq = (hitPoint[0] - x1) ** 2 + (hitPoint[1] - y1) ** 2;
    return Math.sqrt(currentDistSq / segLengthSq);
  }

  /**
   * Finds the closest coordinate point on this wall segment to an external target point.
   */
  getClosestPoint(toPoint: Vector2): Vector2 {
    const x1 = this.p1[0];
    const y1 = this.p1[1];
    const x2 = this.p2[0];
    const y2 = this.p2[1];
    const px = toPoint[0];
    const py = toPoint[1];

    const dx = x2 - x1;
    const dy = y2 - y1;
    const segmentLengthSq = dx * dx + dy * dy;

    if (segmentLengthSq === 0) return [x1, y1]; // Line is a single dot

    // Project the player point onto the line segment vector to find the linear interpolation factor (t)
    let t = ((px - x1) * dx + (py - y1) * dy) / segmentLengthSq;

    // Clamp t between 0.0 and 1.0 so the point stays strictly on the bounded wall segment
    t = Math.max(0, Math.min(1, t));

    // Return the calculated 2D coordinates
    return [x1 + t * dx, y1 + t * dy];
  }
}
