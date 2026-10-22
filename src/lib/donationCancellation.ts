// A cancellation has one confirmation; show thanks only after server success.

export type CancelStep = "confirm" | "thanks";
export type CancelAction = "keep" | "cancel" | "cancel_final" | "close";

export const INITIAL_CANCEL_STEP: CancelStep = "confirm";

export function nextCancelStep(step: CancelStep, action: CancelAction): CancelStep {
  switch (action) {
    case "cancel":
      // Request alone cannot claim cancellation succeeded.
      return "confirm";
    case "cancel_final":
      // The server confirmed cancellation.
      return "thanks";
    case "keep":
    case "close":
      return INITIAL_CANCEL_STEP;
    default:
      return step;
  }
}
