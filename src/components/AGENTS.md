- Red confirm buttons use the alert dialog's `destructive` prop, not a `bg-destructive` override.
- BottomNavigation publishes its measured height to --bottom-nav-height for .pb-nav so translated label wrapping preserves page bottom gaps.
- LanguageList uses Intl.DisplayNames for localized language labels and excludes both labels from DOM translation, so native names stay intact and dictionary gaps cannot leave English labels.
- Position category artwork images absolutely inside their aspect-ratio wrappers so intrinsic image height cannot enlarge silhouette tiles; contain fitting preserves whole crosses at a consistent height.
- Journal exits use the shared folder-scope selection helper so exited notes and folders cannot retain selected highlights.
- Journal highlighting keeps its palette visible until explicitly stopped; intercept plain typing inside marks after stopping to prevent native contenteditable highlight inheritance without altering saved highlights.
- Journal folders use owner-checked parent links, atomic sibling-order saves and a separate expandable tree; deletion promotes children to preserve their notes.
- Drawing color selection switches immediately to the pencil; the drawing sheet fills the viewport with additive safe-area padding and a fixed two-row toolbar, so safe-area utilities cannot remove the toolbar's top clearance.

- CalendarDayDialog exposes full dated events and account-private calendar reminders; date keys use local calendar components to avoid timezone shifts. Native reminder IDs derive from saved IDs so edits and deletions target the original notification; web reminders notify only while the app is open.
