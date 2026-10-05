# Architecture Rules

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track new Journal drafts separately from persisted notes and evaluate cleanup with the shared empty-note predicate, so exit cleanup cannot delete existing or edited notes.