---
name: iOS home screen widgets
description: Four widget layouts, their data, and the calendar/verse choices behind them
type: feature
---
Four native iOS widgets: Small = current streak only; Medium = full Verse of the Day + reference; Medium = full verse + reference + streak; Large = streak + full verse + today's fast/feast/holiday (category and name).
Verse is never abbreviated. Widgets must respect the account time zone and the saved Eastern/Oriental and Old/New Calendar choice; provide light and dark appearances.
The Board verse card, the 8 AM verse notification and widgets always show the same verse (user chose to unify them).
The calendar screen's Old/New Calendar choice is saved to the account (user chose this).
Widget sign-in should be whatever is most seamless and glitch-free (user's words): a long-lived read-only widget key, revoked on sign-out.
Do not change the existing dashboard design or functionality for widget work; WidgetKit itself is built natively, not in the web app.
