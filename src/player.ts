import type { Vector2 } from "./Types";
import { DEG2RAD, Input, normalizeVector, RAD2DEG } from "./utils";

export default class Player {
  fov: number;
  dir: Vector2;
  halfFov: number;
  position: Vector2;
  viewAngle: number; // Angle the player is looking at in degrees
  constructor(position: Vector2) {
    this.position = [...position] as Vector2; // Break reference links

    this.fov = (Math.PI / 2) * RAD2DEG;
    this.halfFov = this.fov / 2;

    this.dir = [1, 0];
    this.viewAngle = Math.atan2(this.dir[1], this.dir[0]) * RAD2DEG;
  }

  lookAt(angle: number) {
    this.viewAngle = ((angle % 360) + 360) % 360; // Wrap around
    this.dir = normalizeVector([
      Math.cos(angle * DEG2RAD),
      Math.sin(angle * DEG2RAD),
    ]);
  }

  move(position: Vector2) {
    this.position = position;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(this.position[0], this.position[1], 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  update(dt: number) {
    if (Input.isHeld("ArrowLeft")) this.viewAngle -= 90 * dt;
    if (Input.isHeld("ArrowRight")) this.viewAngle += 90 * dt;
    this.lookAt(this.viewAngle);
  }
}
