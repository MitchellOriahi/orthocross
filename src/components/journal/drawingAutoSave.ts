/**
 * A drawing has no save button: it is inserted when the panel is exited. This
 * guard keeps an untouched or cleared panel from inserting a blank drawing.
 */
export interface DrawingAutoSaveState {
  canvas: { getObjects(): unknown[] } | null | undefined;
  onSave?: (dataUrl: string) => void;
  dirty: boolean;
}

export function shouldAutoSaveDrawing({
  canvas,
  onSave,
  dirty,
}: DrawingAutoSaveState): boolean {
  return (
    !!canvas &&
    typeof onSave === "function" &&
    dirty &&
    canvas.getObjects().length > 0
  );
}
