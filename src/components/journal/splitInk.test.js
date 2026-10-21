import { expect, test } from "bun:test";
import { splitInkIntoPieces } from "./splitInk";

/** Builds an RGBA buffer; dots are [x, y] opaque pixels. */
const buffer = (width, height, dots) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of dots) {
    const i = (y * width + x) * 4;
    data[i] = 255;
    data[i + 3] = 255;
  }
  return data;
};

test("a single unbroken stroke stays one piece", () => {
  const data = buffer(5, 1, [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]);
  const pieces = splitInkIntoPieces(data, 5, 1);
  expect(pieces.length).toBe(1);
  expect(pieces[0].minX).toBe(0);
  expect(pieces[0].maxX).toBe(4);
});

test("a stroke cut in two becomes two pieces", () => {
  const data = buffer(5, 1, [[0, 0], [1, 0], [3, 0], [4, 0]]);
  const pieces = splitInkIntoPieces(data, 5, 1);
  expect(pieces.length).toBe(2);
  expect(pieces[0].minX).toBe(0);
  expect(pieces[0].maxX).toBe(1);
  expect(pieces[1].minX).toBe(3);
  expect(pieces[1].maxX).toBe(4);
});

test("a stroke cut twice becomes three pieces", () => {
  const data = buffer(7, 1, [[0, 0], [2, 0], [3, 0], [5, 0], [6, 0]]);
  const pieces = splitInkIntoPieces(data, 7, 1);
  expect(pieces.length).toBe(3);
});

test("diagonally touching ink stays one piece", () => {
  const data = buffer(2, 2, [[0, 0], [1, 1]]);
  const pieces = splitInkIntoPieces(data, 2, 2);
  expect(pieces.length).toBe(1);
});

test("each piece carries only its own pixels", () => {
  const data = buffer(4, 1, [[0, 0], [3, 0]]);
  const pieces = splitInkIntoPieces(data, 4, 1);
  expect(pieces.length).toBe(2);
  for (const piece of pieces) {
    expect(piece.pixels.length).toBe(4);
    expect(piece.pixels[3]).toBe(255);
  }
});

test("fully erased ink leaves no pieces", () => {
  const data = new Uint8ClampedArray(9 * 4);
  expect(splitInkIntoPieces(data, 3, 3).length).toBe(0);
});
