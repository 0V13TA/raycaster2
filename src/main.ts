// src/main.ts
import "./style.css";
import Boundary from "./boundaries";
import { Input, TimerManager } from "./utils";
import Player from "./player";
import Scene from "./Scene";
import Material from "./Material";

//#region Init
export const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const canvas2 = document.createElement("canvas");
const ctx2 = canvas2.getContext("2d") as CanvasRenderingContext2D;

document.body.appendChild(canvas);
document.body.appendChild(canvas2);

canvas.width = 400;
canvas.height = 400;

canvas2.width = 400;
canvas2.height = 400;

let animationID: number;
let lastTime: number = 0;
//#endregion

// Coordinate Helper
const W = canvas.width;
const H = canvas.height;
const p = (x: number, y: number): [number, number] => [x * W, y * H];

// --- 1. DEFINE BEAUTIFUL THEMED MATERIALS ---
const outerWallMat = new Material({ color: [60, 60, 75, 1] }); // Dark slate gray
const castleTowerMat = new Material({ color: [180, 100, 40, 1] }); // Warm brick orange/red
const pillarsMat = new Material({
  color: [40, 160, 100, 1],
}); // Jade/Emerald green

// --- 2. THE CASTLE COURTYARD MAP CONFIGURATION ---
const castleMap: Boundary[] = [];

// Helper to safely create a wall with an assigned material
function createWall(
  p1: [number, number],
  p2: [number, number],
  material: Material,
) {
  const wall = new Boundary(p1, p2);
  wall.material = material;
  castleMap.push(wall);
}

// A. Outer Boundary Citadel Walls
createWall(p(0.05, 0.05), p(0.95, 0.05), outerWallMat); // Top outer boundary
createWall(p(0.95, 0.05), p(0.95, 0.95), outerWallMat); // Right outer boundary
createWall(p(0.95, 0.95), p(0.05, 0.95), outerWallMat); // Bottom outer boundary
createWall(p(0.05, 0.95), p(0.05, 0.05), outerWallMat); // Left outer boundary

// B. Central Castle Tower (With a doorway on the left side)
createWall(p(0.4, 0.4), p(0.6, 0.4), castleTowerMat); // Tower Top Wall
createWall(p(0.6, 0.4), p(0.6, 0.6), castleTowerMat); // Tower Right Wall
createWall(p(0.6, 0.6), p(0.4, 0.6), castleTowerMat); // Tower Bottom Wall
createWall(p(0.4, 0.6), p(0.4, 0.53), castleTowerMat); // Tower Left Wall (Lower half)
createWall(p(0.4, 0.47), p(0.4, 0.4), castleTowerMat); // Tower Left Wall (Upper half - leaves an opening!)

// C. Scattered Diagonal Courtyard Pillars (Tests your vector diagonal precision)
// Top-Left Triangular Pillar
createWall(p(0.2, 0.2), p(0.25, 0.2), pillarsMat);
createWall(p(0.25, 0.2), p(0.2, 0.25), pillarsMat);
createWall(p(0.2, 0.25), p(0.2, 0.2), pillarsMat);

// Top-Right Diamond Pillar
createWall(p(0.75, 0.2), p(0.8, 0.25), pillarsMat);
createWall(p(0.8, 0.25), p(0.75, 0.3), pillarsMat);
createWall(p(0.75, 0.3), p(0.7, 0.25), pillarsMat);
createWall(p(0.7, 0.25), p(0.75, 0.2), pillarsMat);

// Bottom-Right V-Shaped Retaining Wall
createWall(p(0.7, 0.7), p(0.8, 0.7), pillarsMat);
createWall(p(0.8, 0.7), p(0.8, 0.8), pillarsMat);

// Bottom-Left Hexagonal Spire Base
createWall(p(0.2, 0.7), p(0.25, 0.67), pillarsMat);
createWall(p(0.25, 0.67), p(0.28, 0.72), pillarsMat);
createWall(p(0.28, 0.72), p(0.25, 0.77), pillarsMat);
createWall(p(0.25, 0.77), p(0.2, 0.75), pillarsMat);
createWall(p(0.2, 0.75), p(0.17, 0.7), pillarsMat);
createWall(p(0.17, 0.7), p(0.2, 0.7), pillarsMat);

// Spawn the player safely outside the central fortress tower
const player = new Player([W * 0.15, H * 0.5]);

// A. Create a textured sky material using an image asset link
const skyMaterial = new Material({
  isCeiling: true,
  color: [15, 15, 30, 1], // Fallback if image path breaks
  textureSrc: "../public/pics/wood.png", // Path to your sky image asset
});

// B. Create a solid floor material (no image provided, will safely draw fallback)
const groundMaterial = new Material({
  isFloor: true,
  color: [40, 35, 30, 1],
  textureSrc: "../public/pics/greystone.png", // Path to your sky image asset
});

// Create a pseudo-3D scene manager
const scene = new Scene(
  player,
  canvas2.width,
  canvas2.height,
  skyMaterial,
  groundMaterial,
);

// Load our new vector map layout into the scene renderer
castleMap.forEach((wall) => {
  scene.addBoundary(wall);
});

function animate(currentTime: number): void {
  if (!lastTime) lastTime = currentTime;
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  TimerManager.update(currentTime - (lastTime - dt * 1000));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

  // Update logic
  scene.update(dt);

  // Render operations
  scene.draw(ctx);

  // Let the scene process layout updates and render both views
  scene.render(ctx, ctx2);

  Input.endFrame();
  animationID = requestAnimationFrame(animate);
}

// Global execution hooks
Input.init();
canvas.addEventListener("mousemove", (e) => {
  player.move([e.offsetX, e.offsetY]);
});
animationID = requestAnimationFrame(animate);
