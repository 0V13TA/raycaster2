import type { Color, MaterialOptions } from "./Types";

export default class Material {
  color: Color;
  texture: HTMLImageElement | null;
  isLoaded: boolean = false;

  constructor(options: MaterialOptions) {
    this.color = options.color || [255, 255, 255, 100];
    this.texture = null;
    if (options.textureSrc) {
      this.texture = new Image();
      this.texture.src = options.textureSrc;
      this.texture.onload = () => (this.isLoaded = true);
    }
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
}
