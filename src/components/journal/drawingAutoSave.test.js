import { expect, test } from "bun:test";
import {
  hasDrawingToSave,
  shouldAutoSaveDrawing,
} from "./drawingAutoSave";

const canvasWith = (count) => ({
  getObjects: () => Array.from({ length: count }),
});

const noop = () => {};

test("exiting after a stroke inserts the drawing", () => {
  expect(
    shouldAutoSaveDrawing({ canvas: canvasWith(1), onSave: noop, dirty: true }),
  ).toBe(true);
});

test("exiting an untouched panel inserts no blank drawing", () => {
  expect(
    shouldAutoSaveDrawing({ canvas: canvasWith(0), onSave: noop, dirty: false }),
  ).toBe(false);
});

test("clearing the canvas then exiting inserts nothing", () => {
  expect(
    shouldAutoSaveDrawing({ canvas: canvasWith(0), onSave: noop, dirty: true }),
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

test("an edited drawing is offered to the verse note", () => {
  expect(hasDrawingToSave({ canvas: canvasWith(2), dirty: true })).toBe(true);
});

test("an untouched canvas offers nothing to the verse note", () => {
  expect(hasDrawingToSave({ canvas: canvasWith(1), dirty: false })).toBe(false);
});

test("a missing canvas offers nothing to the verse note", () => {
  expect(hasDrawingToSave({ canvas: null, dirty: true })).toBe(false);
});
