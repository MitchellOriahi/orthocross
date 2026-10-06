# Architecture Rules

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track new Journal drafts separately from persisted notes and evaluate cleanup with the shared empty-note predicate, so exit cleanup cannot delete existing or edited notes.
- Render the monthly leaderboard's top three through a dedicated presentation component using existing profile data, keeping ranking and data fetching unchanged.
- Derive the next journey island from ordered islands and completion progress through a shared pure selector, so the highlight advances without hardcoded island IDs.
- Render the Board daily verse through a dedicated card using the original deterministic local verse selector and existing share dialog, keeping notification delivery unchanged.
- Preload licensed verse photo backgrounds when the share dialog mounts, compose the verse locally on opening, and cache each style's composed image, so sharing does not wait on AI or require sign-in.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.
- Validate the image function's bearer token explicitly with getUser(token) on a stateless auth client, because global request headers do not create an SDK session.
- Keep the legacy server-side verse artwork function isolated from photo-based sharing, so the current dialog never invokes a billed image-generation request.
- Keep style-specific verse typography in a dedicated canvas renderer with measured text fitting and global artwork palette tokens, so all styles preserve the complete verse without clipping.
- Resolve every island lesson image through a provenance registry of stored assets and render its source/license credit with uncropped artwork, so authentic historical imagery remains attributable and inspectable.