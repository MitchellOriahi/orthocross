export const CROP_VIEW_SIZE = 320;
export const CROP_DIAMETER = 280;
export const MIN_CROP_ZOOM = 0.25;
export const MAX_CROP_ZOOM = 6;

export interface CropTransform { zoom: number; x: number; y: number }

export const NEAR_SQUARE_RATIO = 1.1;

export function fittedImageScale(width: number, height: number) {
  const long = Math.max(width, height, 1);
  const short = Math.max(Math.min(width, height), 1);
  return CROP_DIAMETER / (long / short <= NEAR_SQUARE_RATIO ? short : long);
}

export function zoomCrop(transform: CropTransform, zoom: number, anchor = { x: 160, y: 160 }): CropTransform {
  const next = Math.min(MAX_CROP_ZOOM, Math.max(MIN_CROP_ZOOM, zoom));
  const ratio = next / transform.zoom;
  const x = anchor.x - CROP_VIEW_SIZE / 2;
  const y = anchor.y - CROP_VIEW_SIZE / 2;
  return { zoom: next, x: x - (x - transform.x) * ratio, y: y - (y - transform.y) * ratio };
}

export function wheelCropZoom(zoom: number, delta: number, mode: number) {
  return zoom * Math.exp(-delta * (mode === 1 ? 16 : mode === 2 ? 100 : 1) * 0.0015);
}

export function imageCropRect(width: number, height: number, transform: CropTransform) {
  const scale = fittedImageScale(width, height) * transform.zoom;
  return { x: 160 + transform.x - width * scale / 2, y: 160 + transform.y - height * scale / 2, width: width * scale, height: height * scale };
}