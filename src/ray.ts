import type Boundary from "./boundaries";
import type { Vector2 } from "./Types";
import { DEG2RAD } from "./utils";

export default class Ray {
  angle: number;
  origin: Vector2;
  private length: number;
  constructor(origin: Vector2, angle: number) {
    // Wrap aroud
    this.angle = ((angle % 360) + 360) % 360;
    this.origin = origin;
    this.length = 500000;
  }

  cast(wall: Boundary) {
    const x1 = wall.p1[0];
    const y1 = wall.p1[1];
    const x2 = wall.p2[0];
    const y2 = wall.p2[1];

    const x3 = this.origin[0];
    const y3 = this.origin[1];
    const x4 = this.origin[0] + Math.cos(this.angle * DEG2RAD) * this.length;
    const y4 = this.origin[1] + Math.sin(this.angle * DEG2RAD) * this.length;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return null; // Lines are parallel

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t > 0 && t < 1 && u > 0) {
      const point: Vector2 = [0, 0];
      point[0] = x1 + t * (x2 - x1);
      point[1] = y1 + t * (y2 - y1);
      return point;
    }
    return null;
  }
}
