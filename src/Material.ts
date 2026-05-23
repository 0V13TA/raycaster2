// src/Material.ts
import type { Color, MaterialOptions } from "./Types";
import { colorToRGBA } from "./utils";

export default class Material {
  color: Color;
  texture: HTMLImageElement | null = null;
  isLoaded: boolean = false;

  isFloor: boolean;
  isCeiling: boolean;

  textureWidth: number = 0;
  textureHeight: number = 0;
  texturePixels: Uint8ClampedArray | null = null;

  constructor(
    options: MaterialOptions & { isFloor?: boolean; isCeiling?: boolean },
  ) {
    this.color = options.color || [255, 255, 255, 1];
    this.isFloor = options.isFloor ?? false;
    this.isCeiling = options.isCeiling ?? false;

    if (options.textureSrc) {
      this.texture = new Image();
      this.texture.src = options.textureSrc;
      this.texture.onload = () => {
        const offscreenCanvas = document.createElement("canvas");
        const offCtx = offscreenCanvas.getContext("2d");
        if (offCtx && this.texture) {
          this.textureWidth = this.texture.width;
          this.textureHeight = this.texture.height;
          offscreenCanvas.width = this.textureWidth;
          offscreenCanvas.height = this.textureHeight;
          offCtx.drawImage(this.texture, 0, 0);
          const imgData = offCtx.getImageData(
            0,
            0,
            this.textureWidth,
            this.textureHeight,
          );
          this.texturePixels = imgData.data;
          this.isLoaded = true;
        }
      };
    }
  }

  shadeColor(percent: number) {
    let [R, G, B, A] = this.color;
    let amt = Math.round(2.55 * percent);
    R = Math.min(255, Math.max(0, R + amt));
    G = Math.min(255, Math.max(0, G + amt));
    B = Math.min(255, Math.max(0, B + amt));
    return [R, G, B, A] as Color;
  }

  sampleTexture(u: number, v: number): Color {
    if (!this.isLoaded || !this.texturePixels) return this.color;
    let tx = Math.floor(u * this.textureWidth) % this.textureWidth;
    let ty = Math.floor(v * this.textureHeight) % this.textureHeight;
    if (tx < 0) tx += this.textureWidth;
    if (ty < 0) ty += this.textureHeight;
    const pixelIdx = (ty * this.textureWidth + tx) * 4;
    return [
      this.texturePixels[pixelIdx],
      this.texturePixels[pixelIdx + 1],
      this.texturePixels[pixelIdx + 2],
      this.texturePixels[pixelIdx + 3] / 255,
    ];
  }

  /**
   * NEW: High-performance Textured Wall Renderer
   * Renders a single vertical strip of a wall texture into the global screen data buffer.
   */
  drawWallColumn(
    data: Uint8ClampedArray,
    screenWidth: number,
    screenHeight: number,
    screenX: number,
    yStart: number,
    clampedHeight: number,
    u: number, // Horizontal texture offset percentage (0.0 to 1.0)
    shadingFactor: number, // Combines distance and surface normal lighting
  ) {
    // Fallback to solid color if the texture asset hasn't fully loaded yet
    if (!this.isLoaded || !this.texturePixels) {
      const shaded = this.shadeColor(shadingFactor * 100 - 100);
      for (let y = yStart; y < yStart + clampedHeight; y++) {
        if (y < 0 || y >= screenHeight) continue;
        const pixelIdx = (y * screenWidth + screenX) * 4;
        data[pixelIdx] = shaded[0];
        data[pixelIdx + 1] = shaded[1];
        data[pixelIdx + 2] = shaded[2];
        data[pixelIdx + 3] = 255;
      }
      return;
    }

    // Determine which exact horizontal pixel column to read from the image
    let tx = Math.floor(u * this.textureWidth) % this.textureWidth;
    if (tx < 0) tx += this.textureWidth;

    for (let y = 0; y < clampedHeight; y++) {
      const screenY = yStart + y;
      if (screenY < 0 || screenY >= screenHeight) continue; // Out of bounds clipping

      // Calculate vertical texture coordinate percentage (v) matching this line slice position
      const v = y / clampedHeight;
      const ty = Math.floor(v * this.textureHeight) % this.textureHeight;

      // Extract colors out of raw texture memory
      const texIdx = (ty * this.textureWidth + tx) * 4;
      let r = this.texturePixels[texIdx];
      let g = this.texturePixels[texIdx + 1];
      let b = this.texturePixels[texIdx + 2];

      // Apply the pre-calculated lighting adjustments
      r = Math.min(255, Math.max(0, Math.round(r * shadingFactor)));
      g = Math.min(255, Math.max(0, Math.round(g * shadingFactor)));
      b = Math.min(255, Math.max(0, Math.round(b * shadingFactor)));

      // Splice the finalized color directly into the screen buffer array
      const screenIdx = (screenY * screenWidth + screenX) * 4;
      data[screenIdx] = r;
      data[screenIdx + 1] = g;
      data[screenIdx + 2] = b;
      data[screenIdx + 3] = 255; // Force fully opaque walls
    }
  }

  drawBackground(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    ctx.save();
    if (this.texture && this.isLoaded) {
      const pattern = ctx.createPattern(this.texture, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(x, y, width, height);
      }
    } else {
      ctx.fillStyle = colorToRGBA(this.color);
      ctx.fillRect(x, y, width, height);
    }
    ctx.restore();
  }
}
