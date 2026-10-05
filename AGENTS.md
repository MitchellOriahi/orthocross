# Architecture Rules

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track new Journal drafts separately from persisted notes and evaluate cleanup with the shared empty-note predicate, so exit cleanup cannot delete existing or edited notes.
- Render the monthly leaderboard's top three through a dedicated presentation component using existing profile data, keeping ranking and data fetching unchanged.
- Derive the next journey island from ordered islands and completion progress through a shared pure selector, so the highlight advances without hardcoded island IDs.
- Render the Board daily verse through a dedicated card using the existing daily-verse RPC and share dialog, keeping notification delivery unchanged.