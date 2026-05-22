//#region Type Definitions
type KeyCode = string;

interface Timer {
  id: number;
  elapsed: number;
  paused: boolean;
  repeat: boolean;
  interval: number;
  callback: () => void;
}

export interface BoxEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Vector2 = [x: number, y: number];
//#endregion
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

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
      if (!this.held.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.held.add(e.code);
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.held.delete(e.code);
      this.released.add(e.code);
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
