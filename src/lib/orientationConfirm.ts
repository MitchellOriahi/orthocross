export type FamilyChoice = "eastern" | "oriental" | "unaffiliated";

export type OrientationConfirmAction =
  | { type: "step"; step: "eastern" | "oriental" }
  | { type: "neither" }
  | { type: "save"; branch: string }
  | null;

/** A tap only selects; nothing advances or saves until Confirm, so a mistaken tap can be changed. */
export function orientationConfirmAction(
  step: "family" | "eastern" | "oriental",
  familyChoice: FamilyChoice | null,
  churchChoice: string | null,
): OrientationConfirmAction {
  if (step === "family") {
    if (familyChoice === "eastern" || familyChoice === "oriental") return { type: "step", step: familyChoice };
    return familyChoice === "unaffiliated" ? { type: "neither" } : null;
  }
  return churchChoice ? { type: "save", branch: churchChoice } : null;
}
