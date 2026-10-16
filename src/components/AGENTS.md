- Red confirm buttons use the alert dialog's `destructive` prop, not a `bg-destructive` override.
- BottomNavigation publishes its measured height to --bottom-nav-height for .pb-nav so translated label wrapping preserves page bottom gaps.

- CalendarDayDialog exposes full dated events and account-private calendar reminders; date keys use local calendar components to avoid timezone shifts. Native reminder IDs derive from saved IDs so edits and deletions target the original notification; web reminders notify only while the app is open.
