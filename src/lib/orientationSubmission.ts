/** Keep the choice and account completion in one submission, with recoverable failures. */
export async function submitOrientationChoice({ saveBranch, saveCompletion, onComplete, setSaving }: {
  saveBranch?: () => PromiseLike<{ error: unknown }>;
  saveCompletion: () => PromiseLike<{ error: unknown }>;
  onComplete: () => void;
  setSaving: (saving: boolean) => void;
}) {
  setSaving(true);
  try {
    if (saveBranch) {
      const result = await saveBranch();
      if (result.error) throw result.error;
    }
    const result = await saveCompletion();
    if (result.error) throw result.error;
    onComplete();
  } finally {
    setSaving(false);
  }
}