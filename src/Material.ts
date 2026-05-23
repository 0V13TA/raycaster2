import type { Color, MaterialOptions } from "./Types";
import { colorToRGBA } from "./utils";

export default class Material {
  color: Color;
  texture: HTMLImageElement | null;

  isLoaded: boolean = false;
  isFloor: boolean = false;
  isCeiling: boolean = false;

  private textureWidth: number = 0;
  private textureHeight: number = 0;
  private texturePixelData: Uint8ClampedArray | null = null;

  constructor(options: MaterialOptions) {
    this.color = options.color || [255, 255, 255, 1];

    this.isFloor = options.isFloor || false;
    this.isCeiling = options.isCeiling || false;

    this.texture = null;
    if (options.textureSrc) {
      this.texture = new Image();
      this.texture.src = options.textureSrc;
      this.texture.onload = () => {
        const offscreenCanvas = document.createElement("canvas");
        const offscreenCtx = offscreenCanvas.getContext(
          "2d",
        ) as CanvasRenderingContext2D;
        this.textureWidth = this.texture!.width;
        this.textureHeight = this.texture!.height;
        offscreenCanvas.width = this.textureWidth;
        offscreenCanvas.height = this.textureHeight;

        offscreenCtx.drawImage(this.texture!, 0, 0);

        this.texturePixelData = offscreenCtx.getImageData(
          0,
          0,
          this.textureWidth,
          this.textureHeight,
        ).data;
        this.isLoaded = true;
      };
    }
  }

  sampleTexture(u: number, v: number): Color {
    if (!this.isLoaded || !this.texturePixelData) {
      return this.color; // Fallback if texture dosen't work
    }

    let tx = Math.floor(u * this.textureWidth) % this.textureWidth;
    let ty = Math.floor(v * this.textureHeight) % this.textureHeight;
    if (tx < 0) tx += this.textureWidth;
    if (ty < 0) ty += this.textureHeight;

    const pixelIdx = (ty * this.textureWidth + tx) * 4;

    return [
      this.texturePixelData[pixelIdx + 0],
      this.texturePixelData[pixelIdx + 1],
      this.texturePixelData[pixelIdx + 2],
      this.texturePixelData[pixelIdx + 3] / 255,
    ] as Color;
  }

  shadeColor(percent: number) {
    let [R, G, B, A] = this.color;
    // Calculate distance dimming factor (negative values dim the walls)
    let amt = Math.round(2.55 * percent);

    //Clamp values between 0 and 255
    R = Math.min(255, Math.max(0, R + amt));
    G = Math.min(255, Math.max(0, G + amt));
    B = Math.min(255, Math.max(0, B + amt));

    return [R, G, B, A] as Color;
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
