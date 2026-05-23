import Boundary from "./boundaries";
import type Material from "./Material";
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

  // render(ctx1: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
  //   // Ceiling takes up top half
  //   this.ceilingMaterial.drawBackground(
  //     ctx2,
  //     0,
  //     0,
  //     this.screenWidth,
  //     this.screenHeight / 2,
  //   );
  //
  //   // Floor takes up bottom half
  //   this.floorMaterial.drawBackground(
  //     ctx2,
  //     0,
  //     this.screenHeight / 2,
  //     this.screenWidth,
  //     this.screenHeight / 2,
  //   );
  //
  //   const deltaAngle = this.player.fov / this.screenWidth;
  //   const leftMostRayAngle = this.player.viewAngle - this.player.halfFov;
  //
  //   for (let i = 0; i < this.screenWidth; i++) {
  //     const ray = this.rays[i];
  //     // Update ray position and angle relative to the player's current frame state
  //     ray.origin = this.player.position;
  //     ray.angle = (((leftMostRayAngle + i * deltaAngle) % 360) + 360) % 360;
  //
  //     const { closestPoint, recordDistance, bound } = this.castRay(ray);
  //     if (
  //       bound === null ||
  //       closestPoint === null ||
  //       recordDistance === Infinity
  //     )
  //       continue;
  //
  //     drawLine(this.player.position, closestPoint, 1, [255, 255, 255, 1], ctx1);
  //     // --- Draw the 3D Pseudo View (Canvas 2) ---
  //     // Fix perspective distortion (fish-eye effect)
  //     const correctedDistance =
  //       recordDistance *
  //       Math.cos((ray.angle - this.player.viewAngle) * (Math.PI / 180));
  //
  //     const lineHeight = (this.screenHeight * 20) / correctedDistance; // Scale height by distance
  //     const clampedHeight = Math.min(lineHeight, this.screenHeight);
  //
  //     // 1. Get the wall surface normal vector
  //     const normal = bound.getNormal();
  //
  //     // 2. Extract the ray's forward facing unit components
  //     const rayDirX = Math.cos(ray.angle * (Math.PI / 180));
  //     const rayDirY = Math.sin(ray.angle * (Math.PI / 180));
  //
  //     // 3. Compute the Dot Product (measures alignment between -1.0 and 1.0)
  //     // Math.abs handles hits coming from either side of the wall asset
  //     const dotProduct = Math.abs(rayDirX * normal[0] + rayDirY * normal[1]);
  //
  //     // 4. Transform alignment into a natural shading multiplier
  //     // Walls hit dead-on (perpendicularly) look fully bright.
  //     // Walls glanced at a steep, shallow angle look progressively darker.
  //     const directionalShade = 0.4 + dotProduct * 0.6; // Scales lighting range between 40% and 100%
  //
  //     // 5. Calculate final distance dimming
  //     const maxRange = 400;
  //     const distancePercent = -((correctedDistance / maxRange) * 100);
  //
  //     // Combine spatial distance degradation with the directional layout
  //     const finalShadePercent = distancePercent * (2 - directionalShade);
  //
  //     const baseColor: Color = bound.material
  //       ? bound.material.color
  //       : [255, 255, 255, 1];
  //     const finalColor = bound.material
  //       ? bound.material.shadeColor(finalShadePercent)
  //       : baseColor;
  //
  //     // Calculate vertical column bounds
  //     const yStart = this.screenHeight / 2 - clampedHeight / 2;
  //
  //     // --- DRAW AN ABSOLUTELY OPAQUE SOLID WALL SLICE USING RECT-FILL ---
  //     ctx2.save();
  //     // Force alpha channel to a strict 1.0 to guarantee zero background bleeding
  //     ctx2.fillStyle = `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, 1.0)`;
  //     // Draw a crisp 1-pixel wide block from yStart down to clampedHeight
  //     ctx2.fillRect(i, yStart, 1, clampedHeight);
  //     ctx2.restore();
  //   }
  // }

  // src/Scene.ts -> Replace your current render() method with this optimized method:
  render(ctx1: CanvasRenderingContext2D, ctx2: CanvasRenderingContext2D) {
    // Clear screen to prepare target buffers
    ctx2.fillStyle = "#0f0f14";
    ctx2.fillRect(0, 0, this.screenWidth, this.screenHeight);

    // High-performance direct per-pixel screen manipulation buffer
    const screenBuffer = ctx2.createImageData(
      this.screenWidth,
      this.screenHeight,
    );
    const data = screenBuffer.data;

    const halfH = this.screenHeight / 2;
    const playerAngleRad = this.player.viewAngle * (Math.PI / 180);

    // Cache trace results for walls to draw them on top later
    const columnWalls: Array<{ yStart: number; height: number; color: Color }> =
      [];

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

      if (
        bound !== null &&
        closestPoint !== null &&
        recordDistance !== Infinity
      ) {
        // 2D top-down helper line
        drawLine(
          this.player.position,
          closestPoint,
          1,
          [255, 255, 255, 0.2],
          ctx1,
        );

        const correctedDistance =
          recordDistance *
          Math.cos((ray.angle - this.player.viewAngle) * (Math.PI / 180));
        const lineHeight = (this.screenHeight * 20) / correctedDistance;
        wallHeight = Math.floor(Math.min(lineHeight, this.screenHeight));
        wallYStart = Math.floor(halfH - wallHeight / 2);

        // Normal dot shading configuration calculations
        const normal = bound.getNormal();
        const rayDirX = Math.cos(ray.angle * (Math.PI / 180));
        const rayDirY = Math.sin(ray.angle * (Math.PI / 180));
        const dotProduct = Math.abs(rayDirX * normal[0] + rayDirY * normal[1]);
        const directionalShade = 0.4 + dotProduct * 0.6;
        const maxRange = 400;
        const distancePercent = -((correctedDistance / maxRange) * 100);
        const finalShadePercent = distancePercent * (2 - directionalShade);

        const baseColor: Color = bound.material
          ? bound.material.color
          : [255, 255, 255, 1];
        const wallColor = bound.material
          ? bound.material.shadeColor(finalShadePercent)
          : baseColor;

        columnWalls[i] = {
          yStart: wallYStart,
          height: wallHeight,
          color: wallColor,
        };
      } else {
        columnWalls[i] = { yStart: halfH, height: 0, color: [0, 0, 0, 1] };
      }

      // --- 3D PERSPECTIVE ENVIRONMENT PROJECTION ---
      const rayAngleRad = ray.angle * (Math.PI / 180);
      const cosRay = Math.cos(rayAngleRad);
      const sinRay = Math.sin(rayAngleRad);
      const cosBeta = Math.cos(rayAngleRad - playerAngleRad);

      // Render from the bottom of this specific wall slice down to the screen edge
      const bottomOfWall = Math.floor(halfH + wallHeight / 2);

      for (let y = bottomOfWall; y < this.screenHeight; y++) {
        if (y <= halfH) continue;

        // Calculate absolute 3D perspective distance matching this specific screen height slice
        const distance = (this.screenHeight * 10) / (y - halfH) / cosBeta;

        // Project coordinates outward in world map space
        const spaceX = this.player.position[0] + cosRay * distance;
        const spaceY = this.player.position[1] + sinRay * distance;

        // Distance fading shadow coefficient factor
        const shadow = Math.max(0, 1 - distance / 350);

        // 1. Process Floor Textures if the flag matches
        if (this.floorMaterial.isFloor) {
          // Generate scale coordinates (dividing by a metric factor like 32 tiles things cleanly)
          const u = spaceX / 32;
          const v = spaceY / 32;
          const sampledColor = this.floorMaterial.sampleTexture(u, v);

          const pixelIdx = (y * this.screenWidth + i) * 4;
          data[pixelIdx] = Math.round(sampledColor[0] * shadow);
          data[pixelIdx + 1] = Math.round(sampledColor[1] * shadow);
          data[pixelIdx + 2] = Math.round(sampledColor[2] * shadow);
          data[pixelIdx + 3] = 255;
        }

        // 2. Process Ceiling Textures (Inverted mirror index on the top screen half)
        if (this.ceilingMaterial.isCeiling) {
          const u = spaceX / 32;
          const v = spaceY / 32;
          const sampledColor = this.ceilingMaterial.sampleTexture(u, v);

          const ceilingY = this.screenHeight - y - 1;
          const pixelIdx = (ceilingY * this.screenWidth + i) * 4;
          data[pixelIdx] = Math.round(sampledColor[0] * shadow);
          data[pixelIdx + 1] = Math.round(sampledColor[1] * shadow);
          data[pixelIdx + 2] = Math.round(sampledColor[2] * shadow);
          data[pixelIdx + 3] = 255;
        }
      }
    }

    // Blit the perspective background pixel layout directly into view
    ctx2.putImageData(screenBuffer, 0, 0);

    // Overlay completely opaque wall slices cleanly on top
    for (let i = 0; i < this.screenWidth; i++) {
      const wall = columnWalls[i];
      if (!wall || wall.height === 0) continue;

      ctx2.save();
      ctx2.fillStyle = `rgba(${wall.color[0]}, ${wall.color[1]}, ${wall.color[2]}, 1.0)`;
      ctx2.fillRect(i, wall.yStart, 1, wall.height);
      ctx2.restore();
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
