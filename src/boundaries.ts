import type { Vector2 } from "./utils";

export default class Boundary {
  p1: Vector2;
  p2: Vector2;

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
}
