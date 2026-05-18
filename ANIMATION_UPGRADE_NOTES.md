# Animation Upgrade Notes

This pass adds a Duolingo/Shepherd-style reward layer without introducing new build dependencies.

## Added

- `src/components/MascotCompanion.tsx`
  - Reusable animated dove mascot with moods: `idle`, `happy`, `cheering`, `thinking`, `encouraging`.
  - Speech bubble support for contextual encouragement.

- `src/components/AnimatedProgress.tsx`
  - Shimmering animated progress bar with optional spark reward marker.

- `src/components/CelebrationOverlay.tsx`
  - Full-screen celebration with confetti, mascot, XP reward, and call-to-action.

- `src/index.css`
  - Mascot float/bounce/cheer animations.
  - Confetti animation.
  - Duolingo-like card hover/tap motion.
  - Reward pop and progress shimmer effects.

## Updated

- `src/pages/Index.tsx`
  - Added animated hero card with mascot guidance.
  - Added continue-reading CTA.
  - Replaced static completion bar with animated progress.
  - Added XP reward messaging.
  - Added celebration overlay when Bible completion increases.
  - Added springy card/button interactions across book sections.

- `src/components/CongratulationsModal.tsx`
  - Replaced static cross bounce with mascot/saint reward animation.
  - Added reusable confetti pieces.
  - Made continue button more animated.

- `src/components/CompletionCongratulationsModal.tsx`
  - Added mascot next to trophy reward.
  - Updated trophy motion and reward button interactions.

## Future Lottie Drop-In

The mascot system is structured so you can later replace the CSS-powered mascot with actual Lottie JSON files while keeping the same `MascotCompanion` API. For example, add Lottie JSON files under:

```txt
src/assets/lottie/mascot-idle.json
src/assets/lottie/mascot-cheer.json
src/assets/lottie/confetti.json
src/assets/lottie/streak-flame.json
```

Then replace the internal icon rendering in `MascotCompanion` with a Lottie player while leaving the rest of the app unchanged.
