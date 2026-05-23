import type { BoxEntity, Color, KeyCode, Vector2 } from "./Types";

interface Timer {
  id: number;
  elapsed: number;
  paused: boolean;
  repeat: boolean;
  interval: number;
  callback: () => void;
}

//#endregion
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export function normalizeVector(vec: Vector2): Vector2 {
  const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
  if (length === 0) return [0, 0];
  return [vec[0] / length, vec[1] / length];
}

export function distanceBtwVectors(v1: Vector2, v2: Vector2) {
  return Math.sqrt((v2[0] - v1[0]) ** 2 + (v2[1] - v1[1]) ** 2);
}

// Version with opacity support (0-255 or 0-1)
export function colorToRGBA(
  color: Color,
  normalizeAlpha: boolean = true,
): string {
  let [r, g, b, a] = color;

  // Clamp RGB
  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));

  // Handle alpha normalization
  if (normalizeAlpha && a > 1) {
    // If alpha > 1, assume it's 0-255 range, convert to 0-1
    a = a / 255;
  }
  a = Math.min(1, Math.max(0, a));

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const Colors = {
  red: (alpha: number = 1): string => colorToRGBA([255, 0, 0, alpha]),
  green: (alpha: number = 1): string => colorToRGBA([0, 255, 0, alpha]),
  blue: (alpha: number = 1): string => colorToRGBA([0, 0, 255, alpha]),
  white: (alpha: number = 1): string => colorToRGBA([255, 255, 255, alpha]),
  black: (alpha: number = 1): string => colorToRGBA([0, 0, 0, alpha]),

  // Custom color creator
  custom: (r: number, g: number, b: number, a: number = 1): string =>
    colorToRGBA([r, g, b, a]),
};

export function drawLine(
  start: Vector2,
  end: Vector2,
  width: number,
  color: Color,
  ctx: CanvasRenderingContext2D,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.lineWidth = width;
  ctx.strokeStyle = colorToRGBA(color);
  ctx.stroke();
  ctx.restore();
}

// --- Timer Manager ---
export const TimerManager = {
  timers: [] as Timer[],
  counterId: 0,

  add(interval: number, callback: () => void, repeat: boolean = true): number {
    const id = this.counterId++;
    this.timers.push({
      id,
      interval,
      callback,
      elapsed: 0,
      paused: false,
      repeat,
    });
    return id;
  },

  setInterval(interval: number, callback: () => void): number {
    return this.add(interval, callback, true);
  },

  update(dt: number): void {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const t = this.timers[i];
      if (t.paused) continue;

      t.elapsed += dt;
      if (t.elapsed >= t.interval) {
        t.callback();
        if (t.repeat) {
          t.elapsed -= t.interval;
        } else {
          this.timers.splice(i, 1);
        }
      }
    }
  },

  clearAll(): void {
    this.timers = [];
    this.counterId = 0;
  },
};

// --- Input Handling ---
export const Input = {
  held: new Set<KeyCode>(),
  pressed: new Set<KeyCode>(),
  released: new Set<KeyCode>(),

  init(): void {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (!this.held.has(e.code as KeyCode)) {
        this.pressed.add(e.code as KeyCode);
      }
      this.held.add(e.code as KeyCode);
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.held.delete(e.code as KeyCode);
      this.released.add(e.code as KeyCode);
    });
  },

  isHeld(key: KeyCode): boolean {
    return this.held.has(key);
  },

  isPressed(key: KeyCode): boolean {
    return this.pressed.has(key);
  },

  isReleased(key: KeyCode): boolean {
    return this.released.has(key);
  },

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  },
};

// --- Collision Logic (Standard AABB) ---
export function checkCollision(a: BoxEntity, b: BoxEntity): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function checkCollisionCircleRec(
  centerX: number,
  centerY: number,
  radius: number,
  recX: number,
  recY: number,
  recWidth: number,
  recHeight: number,
) {
  let collision = false;

  let recCenterX = recX + recWidth / 2;
  let recCenterY = recY + recHeight / 2;

  let dx = Math.abs(centerX - recCenterX);
  let dy = Math.abs(centerY - recCenterY);

  if (dx <= recWidth / 2 + radius && dy <= recHeight / 2 + radius) {
    if (dx <= recWidth / 2) collision = true;
    else if (dy <= recHeight / 2) collision = true;
    else {
      let cornerDistanceSq =
        (dx - recWidth / 2) * (dx - recWidth / 2) +
        (dy - recHeight / 2) * (dy - recHeight / 2);
      collision = cornerDistanceSq <= radius * radius;
    }
  }

  return collision;
}
