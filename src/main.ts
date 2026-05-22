import "./style.css";
import Boundary from "./boundaries";
import { Input, TimerManager } from "./utils";
import Player from "./player";

//#region Init
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

document.body.appendChild(canvas);

canvas.width = 400;
canvas.height = 400;

let animationID: number;
let lastTime: number = 0;
//#endregion

const walls: Boundary[] = [];
const player = new Player([canvas.width / 2, canvas.height / 2]);
walls.push(new Boundary([0, 0], [canvas.width, 0]));
walls.push(new Boundary([canvas.width, 0], [canvas.width, canvas.height]));
walls.push(new Boundary([canvas.width, canvas.height], [0, canvas.height]));
walls.push(new Boundary([0, canvas.height], [0, 0]));
walls.push(new Boundary([100, 150], [200, 50]));

// for (let i = 0; i < 6; i++) {
//   let x1 = Math.random() * canvas.width,
//     y1 = Math.random() * canvas.height;
//   let x2 = Math.random() * canvas.width,
//     y2 = Math.random() * canvas.height;
//
//   const wall = new Boundary([x1, y1], [x2, y2]);
//   walls.push(wall);
// }

function animate(currentTime: number): void {
  if (!lastTime) lastTime = currentTime;
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  TimerManager.update(currentTime - (lastTime - dt * 1000));
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.draw(ctx);
  walls.forEach((wall) => {
    wall.draw(ctx);
  });
  player.look(walls, ctx);
  Input.endFrame();
  animationID = requestAnimationFrame(animate);
}

// Global execution hooks
Input.init();
canvas.addEventListener("mousemove", (e) =>
  player.lookAt([e.offsetX, e.offsetY]),
);
animationID = requestAnimationFrame(animate);
