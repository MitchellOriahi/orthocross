import type { ToastProps } from "@/components/ui/toast";

/** The "Profile updated!" sticker closes itself after this many milliseconds. */
export const PROFILE_UPDATED_TOAST_MS = 4000;

/** Shown whenever a tradition or church choice saves to the profile. */
export const PROFILE_UPDATED_TOAST: ToastProps & { title: string; description: string } = {
  title: "Profile updated!",
  description: "Your Orthodox tradition now shows on your profile in the Friends section.",
  duration: PROFILE_UPDATED_TOAST_MS,
};
