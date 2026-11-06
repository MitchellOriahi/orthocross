// Pure state transitions for the first-ever Bible completion "i" tap.
// The explanation sticker must sit on top of the already-open
// "Mark Chapters as Read" section, so dismissing it leaves the reader in
// that section instead of back on the Dashboard.

export interface BibleIntroFlowState {
  infoPulse: boolean;
  chapterMarking: boolean;
  tutorial: boolean;
}

export const idleBibleIntroState = (): BibleIntroFlowState => ({
  infoPulse: false,
  chapterMarking: false,
  tutorial: false,
});

// Tapping the glowing "i": stop pulsing, open the section, explain it on top.
export const introInfoClick = (): BibleIntroFlowState => ({
  infoPulse: false,
  chapterMarking: true,
  tutorial: true,
});

// Tapping the explanation away: the section stays open behind it.
export const dismissIntroTutorial = (): BibleIntroFlowState => ({
  infoPulse: false,
  chapterMarking: true,
  tutorial: false,
});

// While the explanation is up, the section behind it must not be dismissed.
export const introTutorialBlocksSectionDismiss = (tutorialOpen: boolean) => tutorialOpen;
