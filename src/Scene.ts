import Boundary from "./boundaries";
import type Player from "./player";
import Ray from "./ray";
import type { Color, Vector2 } from "./Types";
import { distanceBtwVectors, drawLine } from "./utils";

export default class Scene {
  private rays: Ray[];
  private boundaries: Boundary[];

  player: Player;

  private screenWidth: number;
  private screenHeight: number;

  private deltaAngle: number; // Angle step between rays in degrees
  private leftMostRayAngle: number; // Angle of the leftmost ray in degrees

  constructor(player: Player, screenWidth: number, screenHeight: number) {
    this.rays = [];
    this.boundaries = [];

    this.player = player;

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.deltaAngle = player.fov / this.screenWidth;
    this.leftMostRayAngle = player.fov / this.screenWidth;

    for (let i = 0; i < screenWidth; i += 1) {
      // 4. Multiply i by deltaAngle so the rays actually spread across the fan!
      const currentAngle = this.leftMostRayAngle + i * this.deltaAngle;

      // Keep the degree values strictly between 0 and 360
      const angle = ((currentAngle % 360) + 360) % 360;

      const ray = new Ray(player.position, angle);
      this.rays.push(ray);
    }
  }

  addBoundary(boundary: Boundary) {
    this.boundaries.push(boundary);
  }

  castRay(ray: Ray) {
    let recordDistance = Infinity;
    let closestPoint: Vector2 | null = null;
    let bound: Boundary | null = null;
    for (const boundary of this.boundaries) {
      const point = ray.cast(boundary);
      if (point === null) continue;

      const currentDistance = distanceBtwVectors(this.player.position, point);
      if (currentDistance < recordDistance) {
        recordDistance = currentDistance;
        closestPoint = point;
        bound = boundary;
      }
    }
    return { recordDistance, closestPoint, bound };
  }

  render(ctx1: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
    const deltaAngle = this.player.fov / this.screenWidth;
    const leftMostRayAngle = this.player.viewAngle - this.player.halfFov;

    for (let i = 0; i < this.screenWidth; i++) {
      const ray = this.rays[i];
      // Update ray position and angle relative to the player's current frame state
      ray.origin = this.player.position;
      ray.angle = (((leftMostRayAngle + i * deltaAngle) % 360) + 360) % 360;

      const { closestPoint, recordDistance, bound } = this.castRay(ray);
      if (
        bound === null ||
        closestPoint === null ||
        recordDistance === Infinity
      )
        continue;

      drawLine(this.player.position, closestPoint, 1, [255, 255, 255, 1], ctx1);
      // --- Draw the 3D Pseudo View (Canvas 2) ---
      // Fix perspective distortion (fish-eye effect)
      const correctedDistance =
        recordDistance *
        Math.cos((ray.angle - this.player.viewAngle) * (Math.PI / 180));

      const lineHeight = (this.screenHeight * 20) / correctedDistance; // Scale height by distance
      const clampedHeight = Math.min(lineHeight, this.screenHeight);

      // Determine wall slice colors (use default color if no material exists)
      const baseColor: Color = bound.material
        ? bound.material.color
        : [255, 255, 255, 1];

      // Calculate a shading percentage based on distance (e.g., further away = darker)
      // Here, walls further than 400 pixels fade into blackness
      const maxRange = 400;
      const percent = -((correctedDistance / maxRange) * 100);
      const finalColor = bound.material
        ? bound.material.shadeColor(percent)
        : baseColor;

      // Draw vertical slice for this ray
      drawLine(
        [i, this.screenHeight / 2 - clampedHeight / 2],
        [i, this.screenHeight / 2 + clampedHeight / 2],
        1,
        finalColor,
        ctx2,
      );
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.player.draw(ctx);
    this.boundaries.forEach((boundary) => boundary.draw(ctx));
  }

  update(dt: number) {
    this.player.update(dt);
  }
}
