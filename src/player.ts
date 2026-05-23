// src/player.ts
import type Boundary from "./boundaries";
import type { Vector2 } from "./Types";
import { DEG2RAD, Input, normalizeVector, RAD2DEG } from "./utils";

export default class Player {
  fov: number;
  dir: Vector2;
  halfFov: number;
  position: Vector2;
  viewAngle: number;

  // Collision Configuration Constants
  public radius: number = 8; // Physical thickness size of the player body boundary box
  private moveSpeed: number = 80; // Units traveled per second

  constructor(position: Vector2) {
    this.position = [...position] as Vector2;
    this.fov = 60; //(Math.PI / 2) * RAD2DEG; // 90 Degrees
    this.halfFov = this.fov / 2;
    this.dir = [1, 0];
    this.viewAngle = 0;
  }

  lookAt(angle: number) {
    this.viewAngle = ((angle % 360) + 360) % 360;
    this.dir = normalizeVector([
      Math.cos(this.viewAngle * DEG2RAD),
      Math.sin(this.viewAngle * DEG2RAD),
    ]);
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Render the 2D overview map circle representation marker indicator block
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "#ff3333"; // Vibrant red player dot indicator
    ctx.arc(this.position[0], this.position[1], this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw a short directional line pointing where the player is looking
    ctx.beginPath();
    ctx.strokeStyle = "#ff3333";
    ctx.lineWidth = 2;
    ctx.moveTo(this.position[0], this.position[1]);
    ctx.lineTo(
      this.position[0] + this.dir[0] * 12,
      this.position[1] + this.dir[1] * 12,
    );
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Evaluates a target coordinate against all walls and returns a safe,
   * adjusted position vector that slides smoothly along obstacles.
   */
  checkWallCollisions(targetPos: Vector2, walls: Boundary[]): Vector2 {
    let outputPos: Vector2 = [targetPos[0], targetPos[1]];

    // Run multiple passes (resolves corner pinching bottlenecks)
    for (let pass = 0; pass < 2; pass++) {
      for (const wall of walls) {
        // 1. Get the closest coordinate point on this wall segment to the player
        const closest = wall.getClosestPoint(outputPos);

        // 2. Compute absolute offset tracking vector metrics
        const vx = outputPos[0] - closest[0];
        const vy = outputPos[1] - closest[1];
        const distance = Math.sqrt(vx * vx + vy * vy);

        // 3. Resolve intersection if distance is smaller than player size bounds
        if (distance < this.radius) {
          // If perfectly overlapping, fallback to pushing out along surface normal orientation
          const overlap = this.radius - distance;
          // const normal = wall.getNormal();

          // Determine push direction vector components
          let pushX = vx / (distance || 1);
          let pushY = vy / (distance || 1);

          // Correct pushing tracking adjustments to safely displace boundaries
          outputPos[0] += pushX * overlap;
          outputPos[1] += pushY * overlap;
        }
      }
    }
    return outputPos;
  }

  update(dt: number, walls: Boundary[]) {
    // --- 1. HANDLE CAMERA VIEW ROTATION ---
    if (Input.isHeld("ArrowLeft") || Input.isHeld("KeyA")) {
      this.viewAngle -= 140 * dt; // Turn left (degrees per second)
    }
    if (Input.isHeld("ArrowRight") || Input.isHeld("KeyD")) {
      this.viewAngle += 140 * dt; // Turn right
    }
    this.lookAt(this.viewAngle);

    // --- 2. CALCULATE INTENDED VECTOR VELOCITY ---
    let moveX = 0;
    let moveY = 0;

    if (Input.isHeld("ArrowUp") || Input.isHeld("KeyW")) {
      moveX += this.dir[0];
      moveY += this.dir[1];
    }
    if (Input.isHeld("ArrowDown") || Input.isHeld("KeyS")) {
      moveX -= this.dir[0];
      moveY -= this.dir[1];
    }

    // --- 3. APPLY POSITION PROJECTIONS & RESOLVE OBSTACLES ---
    if (moveX !== 0 || moveY !== 0) {
      // Normalize combined inputs to prevent diagonal movement speed boosts
      const moveMag = Math.sqrt(moveX * moveX + moveY * moveY);
      const velocityX = (moveX / moveMag) * this.moveSpeed * dt;
      const velocityY = (moveY / moveMag) * this.moveSpeed * dt;

      // Project where the player wants to step on this animation tick cycle
      const intendedPosition: Vector2 = [
        this.position[0] + velocityX,
        this.position[1] + velocityY,
      ];

      // Filter position coordinates using our sliding geometric solver engine parameters
      this.position = this.checkWallCollisions(intendedPosition, walls);
    }
  }
}
