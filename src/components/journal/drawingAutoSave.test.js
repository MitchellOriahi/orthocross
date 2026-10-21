import { expect, test } from "bun:test";
import { shouldAutoSaveDrawing } from "./drawingAutoSave";

const canvasWith = (count: number) => ({
  getObjects: () => Array.from({ length: count }),
});

test("exiting after a stroke inserts the drawing", () => {
  expect(
    shouldAutoSaveDrawing({
      canvas: canvasWith(1),
      onSave: () => {},
      dirty: true,
    }),
  ).toBe(true);
});

test("exiting an untouched panel inserts no blank drawing", () => {
  expect(
    shouldAutoSaveDrawing({
      canvas: canvasWith(0),
      onSave: () => {},
      dirty: false,
    }),
  ).toBe(false);
});

test("clearing the canvas then exiting inserts nothing", () => {
  expect(
    shouldAutoSaveDrawing({
      canvas: canvasWith(0),
      onSave: () => {},
      dirty: true,
    }),
  ).toBe(false);
});

test("exiting without a save handler inserts nothing", () => {
  expect(
    shouldAutoSaveDrawing({
      canvas: canvasWith(3),
      onSave: undefined,
      dirty: true,
    }),
  ).toBe(false);
});
