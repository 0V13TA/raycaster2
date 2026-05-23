export type Color = [r: number, g: number, b: number, a: number];
export type Vector2 = [x: number, y: number];
//#region Type Definitions
export type KeyCode = string;

export interface BoxEntity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MaterialOptions {
  color?: Color;
  textureSrc?: string;
}
