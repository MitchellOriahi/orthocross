# Architecture Rules

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track new Journal drafts separately from persisted notes and evaluate cleanup with the shared empty-note predicate, so exit cleanup cannot delete existing or edited notes.
- Render the monthly leaderboard's top three through a dedicated presentation component using existing profile data, keeping ranking and data fetching unchanged.
- Derive the next journey island from ordered islands and completion progress through a shared pure selector, so the highlight advances without hardcoded island IDs.
- Render the Board daily verse through a dedicated card using the original deterministic local verse selector and existing share dialog, keeping notification delivery unchanged.
- Cache verse-sharing images by style within the dialog and generate unseen choices on demand using shared design prompts passed to the image function, so titles match artwork and switching back avoids duplicate generation.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.