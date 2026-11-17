export interface Globe {
  setProgress(p: number): void;
  redraw(): void;
  destroy(): void;
}
export function createGlobe(canvas: HTMLCanvasElement, opts?: { reduce?: boolean; start?: number }): Globe;
