import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fittedImageScale, imageCropRect, zoomCrop, wheelCropZoom } from './profileCropGeometry.ts';

test('large phone photos initially fit instead of rendering at natural pixel size', () => {
  assert.equal(fittedImageScale(4032, 3024), 280 / 4032);
  assert.deepEqual(imageCropRect(4032, 3024, { zoom: 1, x: 0, y: 0 }), { x: 20, y: 55, width: 280, height: 210 });
});
test('nearly square pictures fill the circle so no flat edges show', () => {
  assert.equal(fittedImageScale(512, 488), 280 / 488);
  const rect = imageCropRect(512, 488, { zoom: 1, x: 0, y: 0 });
  assert.equal(rect.height, 280);
  assert.ok(rect.width > 280);
});
test('portrait photos fit and can zoom out below the initial framing', () => {
  assert.deepEqual(imageCropRect(3000, 4000, { zoom: 0.25, x: 0, y: 0 }), { x: 133.75, y: 125, width: 52.50000000000001, height: 70 });
});
test('zoom preserves the photo point beneath a pointer', () => {
  assert.deepEqual(zoomCrop({ zoom: 1, x: 10, y: 20 }, 2, { x: 200, y: 100 }), { zoom: 2, x: -20, y: 100 });
});
test('wheel zoom depends on distance, not event frequency', () => {
  let zoom = 1;
  for (let i = 0; i < 20; i++) zoom = wheelCropZoom(zoom, -1, 0);
  assert.ok(Math.abs(zoom - wheelCropZoom(1, -20, 0)) < 1e-12);
  assert.equal(wheelCropZoom(1, 1, 1), wheelCropZoom(1, 16, 0));
});
test('zoom is bounded without changing a centered subject', () => {
  assert.deepEqual(zoomCrop({ zoom: 1, x: 0, y: 0 }, 100), { zoom: 6, x: 0, y: 0 });
  assert.deepEqual(zoomCrop({ zoom: 1, x: 0, y: 0 }, 0), { zoom: 0.25, x: 0, y: 0 });
});