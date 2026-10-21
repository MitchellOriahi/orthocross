/**
 * A drawing has no save button: it is taken from the canvas when the visitor
 * exits the panel. These guards keep an untouched or cleared panel from
 * inserting a blank drawing.
 */
export interface DrawingAutoSaveState {
  canvas: { getObjects(): unknown[] } | null | undefined;
  onSave?: (dataUrl: string) => void;
  dirty: boolean;
}

/** True when the canvas holds real work that has not been saved yet. */
export function hasDrawingToSave({
  canvas,
  dirty,
}: Pick<DrawingAutoSaveState, "canvas" | "dirty">): boolean {
  return !!canvas && dirty && canvas.getObjects().length > 0;
}

/** True when the drawing should be handed to onSave as the panel closes. */
export function shouldAutoSaveDrawing({
  canvas,
  onSave,
  dirty,
}: DrawingAutoSaveState): boolean {
  return typeof onSave === "function" && hasDrawingToSave({ canvas, dirty });
}
