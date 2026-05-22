import type Boundary from "./boundaries";
import Ray from "./ray";
import type { Vector2 } from "./utils";

export default class Player {
  position: Vector2;
  rays: Ray[];
  constructor(position: Vector2) {
    this.position = position;
    this.rays = [];

    for (let i = 0; i < 360; i += 0.1) {
      const ray = new Ray(position, i);
      this.rays.push(ray);
    }
  }

  lookAt(target: Vector2) {
    this.position[0] = target[0];
    this.position[1] = target[1];
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = "#fff";
    ctx.arc(this.position[0], this.position[1], 7, 0, Math.PI * 2);
    ctx.fill();

    for (let ray of this.rays) {
      ray.draw(ctx);
    }
  }

  look(walls: Boundary[], ctx: CanvasRenderingContext2D) {
    for (let ray of this.rays) {
      let recordDistance = Infinity;
      let closestPoint: Vector2 | null = null;
      for (let wall of walls) {
        const point = ray.cast(wall);
        if (point !== null) {
          const distance = Math.sqrt(
            (ray.origin[0] - point[0]) ** 2 + (ray.origin[1] - point[1]) ** 2,
          );

          if (distance < recordDistance) {
            recordDistance = distance;
            closestPoint = point;
          }
        }
      }
      if (closestPoint) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.moveTo(this.position[0], this.position[1]);
        ctx.lineTo(closestPoint[0], closestPoint[1]);
        ctx.lineWidth = 1;
        // ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }
}
