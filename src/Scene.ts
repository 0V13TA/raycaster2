// src/Scene.ts
import Boundary from "./boundaries";
import type Material from "./Material";
import type Player from "./player";
import Ray from "./ray";
import type { Vector2 } from "./Types";
import { distanceBtwVectors } from "./utils";

export default class Scene {
  private rays: Ray[];
  private boundaries: Boundary[];

  player: Player;

  private screenWidth: number;
  private screenHeight: number;

  private deltaAngle: number;
  private leftMostRayAngle: number;

  public floorMaterial: Material;
  public ceilingMaterial: Material;

  constructor(
    player: Player,
    screenWidth: number,
    screenHeight: number,
    ceilingMaterial: Material,
    floorMaterial: Material,
  ) {
    this.rays = [];
    this.boundaries = [];

    this.player = player;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.deltaAngle = player.fov / this.screenWidth;
    this.leftMostRayAngle = player.fov / this.screenWidth;

    this.floorMaterial = floorMaterial;
    this.ceilingMaterial = ceilingMaterial;

    for (let i = 0; i < screenWidth; i += 1) {
      const currentAngle = this.leftMostRayAngle + i * this.deltaAngle;
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
    // 1. Initialize screen pixel tracking buffer structures
    const screenBuffer = ctx2.createImageData(
      this.screenWidth,
      this.screenHeight,
    );
    const data = screenBuffer.data;

    const halfH = this.screenHeight / 2;
    const playerAngleRad = this.player.viewAngle * (Math.PI / 180);

    // --- SECONDARY CACHE MAPS ---
    interface WallJob {
      yStart: number;
      height: number;
      u: number;
      shading: number;
      material: Material | null;
    }
    const wallJobs: WallJob[] = [];

    // --- HORIZONTAL SCREEN COLUMN RAY SCANNER ---
    for (let i = 0; i < this.screenWidth; i++) {
      const ray = this.rays[i];
      ray.origin = this.player.position;
      ray.angle =
        (((this.player.viewAngle - this.player.halfFov + i * this.deltaAngle) %
          360) +
          360) %
        360;

      const { closestPoint, recordDistance, bound } = this.castRay(ray);

      let wallHeight = 0;
      let wallYStart = halfH;
      let hitU = 0;
      let combinedLighting = 1.0;

      if (
        bound !== null &&
        closestPoint !== null &&
        recordDistance !== Infinity
      ) {
        // Draw 2D Top-Down View line traces
        ctx1.save();
        ctx1.beginPath();
        ctx1.lineWidth = 1;
        ctx1.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx1.moveTo(this.player.position[0], this.player.position[1]);
        ctx1.lineTo(closestPoint[0], closestPoint[1]);
        ctx1.stroke();
        ctx1.restore();

        // Calculate perspective depth corrections
        const correctedDistance =
          recordDistance *
          Math.cos((ray.angle - this.player.viewAngle) * (Math.PI / 180));
        const wallScale = 32; // Tweak this number to make walls taller or shorter
        const lineHeight = Math.floor(
          (this.screenHeight * wallScale) / (correctedDistance || 1),
        );
        wallHeight = Math.floor(Math.min(lineHeight, this.screenHeight));
        wallYStart = Math.floor(halfH - wallHeight / 2);

        // 1. Compute textured wall column interpolation coordinate (u)
        hitU = bound.getHitPercentage(closestPoint);

        // 2. Compute dynamic surface normal alignment lighting
        const normal = bound.getNormal();
        const rayDirX = Math.cos(ray.angle * (Math.PI / 180));
        const rayDirY = Math.sin(ray.angle * (Math.PI / 180));
        const dotProduct = Math.abs(rayDirX * normal[0] + rayDirY * normal[1]);
        const directionalShade = 0.5 + dotProduct * 0.5;

        // 3. Compute metric distance light dissipation coefficient
        const distanceFade = Math.max(0, 1 - correctedDistance / 400);
        combinedLighting = distanceFade * directionalShade;

        wallJobs[i] = {
          yStart: wallYStart,
          height: wallHeight,
          u: hitU,
          shading: combinedLighting,
          material: bound.material,
        };
      } else {
        wallJobs[i] = {
          yStart: halfH,
          height: 0,
          u: 0,
          shading: 0,
          material: null,
        };
      }

      // --- PERSPECTIVE FLOOR & CEILING BACKGROUND SCANNER ---
      const rayAngleRad = ray.angle * (Math.PI / 180);
      const cosRay = Math.cos(rayAngleRad);
      const sinRay = Math.sin(rayAngleRad);
      const cosBeta = Math.cos(rayAngleRad - playerAngleRad);

      // Start rendering backgrounds right at the base of this column's wall segment
      const bottomOfWall = Math.floor(halfH + wallHeight / 2);

      for (let y = bottomOfWall; y < this.screenHeight; y++) {
        if (y <= halfH) continue;

        // True geometric perspective mapping vector calculations
        const distance = (this.screenHeight * 10) / (y - halfH) / cosBeta;
        const spaceX = this.player.position[0] + cosRay * distance;
        const spaceY = this.player.position[1] + sinRay * distance;
        const shadow = Math.max(0, 1 - distance / 350);

        // Draw Floor Pixels
        if (this.floorMaterial.isFloor) {
          const u = spaceX / 32;
          const v = spaceY / 32;
          const color = this.floorMaterial.sampleTexture(u, v);
          const pixelIdx = (y * this.screenWidth + i) * 4;
          data[pixelIdx] = Math.round(color[0] * shadow);
          data[pixelIdx + 1] = Math.round(color[1] * shadow);
          data[pixelIdx + 2] = Math.round(color[2] * shadow);
          data[pixelIdx + 3] = 255;
        }

        // Draw Ceiling Pixels
        if (this.ceilingMaterial.isCeiling) {
          const u = spaceX / 32;
          const v = spaceY / 32;
          const color = this.ceilingMaterial.sampleTexture(u, v);
          const ceilingY = this.screenHeight - y - 1;
          const pixelIdx = (ceilingY * this.screenWidth + i) * 4;
          data[pixelIdx] = Math.round(color[0] * shadow);
          data[pixelIdx + 1] = Math.round(color[1] * shadow);
          data[pixelIdx + 2] = Math.round(color[2] * shadow);
          data[pixelIdx + 3] = 255;
        }
      }
    }

    // --- OVERLAY TEXTURED WALL SLICES DIRECTLY OVER BACKDROP BUFFER ---
    for (let i = 0; i < this.screenWidth; i++) {
      const job = wallJobs[i];
      if (!job || job.height === 0 || !job.material) continue;

      // Delegate pixel extraction directly to the wall's material properties
      job.material.drawWallColumn(
        data,
        this.screenWidth,
        this.screenHeight,
        i,
        job.yStart,
        job.height,
        job.u,
        job.shading,
      );
    }

    // 5. Blit finalized image buffer instantly onto 3D graphics monitor view
    ctx2.putImageData(screenBuffer, 0, 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.player.draw(ctx);
    this.boundaries.forEach((boundary) => boundary.draw(ctx));
  }

  update(dt: number) {
    this.player.update(dt, this.boundaries);
  }
}
