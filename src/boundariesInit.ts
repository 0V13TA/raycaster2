import Boundary from "./boundaries";
import { canvas } from "./main";

// Helpers
const W = canvas.width;
const H = canvas.height;
const p = (x: number, y: number): [number, number] => [x * W, y * H];

// Test 1: Simple square boundaries (relative)
export const squareBoundaries = [
  new Boundary(p(0.125, 0.1667), p(0.625, 0.1667)), // top wall
  new Boundary(p(0.625, 0.1667), p(0.625, 0.6667)), // right wall
  new Boundary(p(0.625, 0.6667), p(0.125, 0.6667)), // bottom wall
  new Boundary(p(0.125, 0.6667), p(0.125, 0.1667)), // left wall
];

// Test 2: Star-shaped boundary (relative)
export const starBoundaries = [
  new Boundary(p(0.5, 0.1667), p(0.5625, 0.3333)),
  new Boundary(p(0.5625, 0.3333), p(0.6875, 0.3667)),
  new Boundary(p(0.6875, 0.3667), p(0.6, 0.4667)),
  new Boundary(p(0.6, 0.4667), p(0.625, 0.6333)),
  new Boundary(p(0.625, 0.6333), p(0.5, 0.55)),
  new Boundary(p(0.5, 0.55), p(0.375, 0.6333)),
  new Boundary(p(0.375, 0.6333), p(0.4, 0.4667)),
  new Boundary(p(0.4, 0.4667), p(0.3125, 0.3667)),
  new Boundary(p(0.3125, 0.3667), p(0.4375, 0.3333)),
  new Boundary(p(0.4375, 0.3333), p(0.5, 0.1667)),
];

// Test 3: Maze-like boundaries (relative)
export const mazeBoundaries = [
  // Outer walls
  new Boundary(p(0.0625, 0.0833), p(0.9375, 0.0833)),
  new Boundary(p(0.9375, 0.0833), p(0.9375, 0.9167)),
  new Boundary(p(0.9375, 0.9167), p(0.0625, 0.9167)),
  new Boundary(p(0.0625, 0.9167), p(0.0625, 0.0833)),

  // Inner walls - vertical
  new Boundary(p(0.25, 0.0833), p(0.25, 0.3333)),
  new Boundary(p(0.25, 0.5), p(0.25, 0.75)),
  new Boundary(p(0.5, 0.25), p(0.5, 0.5833)),
  new Boundary(p(0.75, 0.0833), p(0.75, 0.4167)),
  new Boundary(p(0.75, 0.5833), p(0.75, 0.9167)),

  // Inner walls - horizontal
  new Boundary(p(0.0625, 0.3333), p(0.4375, 0.3333)),
  new Boundary(p(0.3125, 0.5833), p(0.6875, 0.5833)),
  new Boundary(p(0.5625, 0.1667), p(0.9375, 0.1667)),
  new Boundary(p(0.4375, 0.75), p(0.8125, 0.75)),
];

// Test 4: Circular approximation (octagon)
const octagonBoundaries = (
  centerX: number,
  centerY: number,
  radius: number,
) => {
  const points: [number, number][] = [];
  const sides = 8;

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;

    // Scale radius independently for width/height
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    points.push([x * W, y * H]);
  }

  return points.map((point, i) => {
    const nextPoint = points[(i + 1) % points.length];
    return new Boundary(point, nextPoint);
  });
};

// Relative values
export const circularBoundary = octagonBoundaries(0.5, 0.5, 0.25);

// Test 5: Spiral/zigzag pattern (relative)
export const spiralBoundaries = [
  new Boundary(p(0.125, 0.1667), p(0.25, 0.1667)),
  new Boundary(p(0.25, 0.1667), p(0.25, 0.3333)),
  new Boundary(p(0.25, 0.3333), p(0.125, 0.3333)),
  new Boundary(p(0.125, 0.3333), p(0.125, 0.25)),
  new Boundary(p(0.125, 0.25), p(0.1875, 0.25)),
  new Boundary(p(0.1875, 0.25), p(0.1875, 0.2917)),
  new Boundary(p(0.1875, 0.2917), p(0.15625, 0.2917)),
  new Boundary(p(0.15625, 0.2917), p(0.15625, 0.2708)),
];
