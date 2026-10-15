// Flow rules for the monthly-donation cancellation dialog.
// A donor who chooses to cancel goes straight to the thank-you message:
// they are never asked whether they would rather pause.

export type CancelStep = "confirm" | "thanks";
export type CancelAction = "keep" | "cancel" | "close";

export const INITIAL_CANCEL_STEP: CancelStep = "confirm";

export function nextCancelStep(step: CancelStep, action: CancelAction): CancelStep {
  switch (action) {
    case "cancel":
      return "thanks";
    case "keep":
    case "close":
      return INITIAL_CANCEL_STEP;
    default:
      return step;
  }
}
