// Flow rules for the monthly-donation cancellation dialog.
// A donor who chooses to cancel is first offered a pause; only if they
// still want to cancel does the subscription end and the thank-you show.

export type CancelStep = "confirm" | "pause" | "thanks";
export type CancelAction = "keep" | "cancel" | "cancel_final" | "close";

export const INITIAL_CANCEL_STEP: CancelStep = "confirm";

export function nextCancelStep(step: CancelStep, action: CancelAction): CancelStep {
  switch (action) {
    case "cancel":
      // First cancellation attempt: offer a pause instead of cancelling.
      return "pause";
    case "cancel_final":
      // Declined the pause: cancel for real and show the thank-you.
      return "thanks";
    case "keep":
    case "close":
      return INITIAL_CANCEL_STEP;
    default:
      return step;
  }
}
