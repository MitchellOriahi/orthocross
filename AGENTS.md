# Architecture Rules
<!-- LOVABLE:BEGIN -->
- Persist terminal read-aloud service failures across reloads and stop prefetch/lookahead on failure; this prevents credit/access failures from producing repeated requests or unhandled rejections.
- Estimate read-aloud word starts from WAV speech regions and follow the playing media clock; Gemini supplies no exact timestamps.
<!-- LOVABLE:END -->
- Cache avatars by source in bounded CacheStorage; shared AvatarImage uses local blobs, bounded cache-busting retries and online-event resets to survive navigation and transient failures.
- Embed optimized Church Guide cross variants as data URLs in the page bundle so rendering does not wait for separate image requests.
- Track lifetime saint-story completion by exact roster ID in private reading records and shared query cache; award all-stories completion by unique IDs to avoid namesake and membership inflation.

- Pause Saints via a visibility selector; keep the saved catalog and presentation intact.
- Keep the Saints browser separate from saved biographies; audited portrait registries preserve identities and classifications.

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track Journal drafts separately with shared empty-note cleanup to preserve existing/edited notes. Expand in the same editor, hiding columns to retain list state.
- Use shared donor tiers and server-resolved anonymous names; portrait, crown and tag colors follow tier, not rank. Header glow uses account-keyed donor-status refreshed on donors-changed to avoid cross-account glow.
- Derive the next journey island from ordered islands and completion progress through a shared pure selector, so the highlight advances without hardcoded island IDs.
- Render the Board daily verse through a dedicated card using the original deterministic local verse selector and existing share dialog, keeping notification delivery unchanged.
- Preload licensed photos and compose locally; pick each day's three photos by date index from a bundled per-category library (no repeats within the cycle) and cache compositions, so daily rotation never waits on AI or sign-in.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.
- Validate the image function's bearer token with getUser(token) on a stateless auth client; global headers do not create an SDK session.
- Keep the legacy server-side verse artwork function isolated from photo-based sharing, so the current dialog never invokes a billed image-generation request.
- Keep style-specific verse typography in a dedicated canvas renderer with measured text fitting and global artwork palette tokens, so all styles preserve the complete verse without clipping.
- Resolve every island lesson image through a provenance registry of stored assets, retain source/license credits, and use cover framing with upper alignment for face-focused artwork so frames stay filled without cropping out faces.
- Reset island detail scroll before paint on each island selection, because same-page selection does not trigger route scroll restoration.
- Resolve saint card icons through a bundled roster-keyed registry with focus/zoom crop values, overridden by admin-saved rows from the hidden icon tuner; derive detail images and credits from the same registry so new portraits keep attribution without touching the saved catalog or card layout.
- Fetch public permission-based Athonite catalogs through an authenticated, fixed-collection cloud function with storage caching and a persistent blocked-feed stop flag; this operation cannot approve portraits or alter saint records.
- Verify Stripe payments and compute totals server-side; queue friend alerts via a service-only donation-keyed function enforcing anonymity, friendship, blocks and preferences, with push UUID idempotency to prevent duplicate alerts.

- Share donation interval validation between dialog and checkout to keep billing consistent.
- Use a tested gift-preview selector for slider position, portrait tier and glow; shared thresholds align custom gifts.
- Schedule donation and rating prompts through one pure, tested coordinator (src/lib/promptScheduler) mounted only on the Board, so prompts never collide or interrupt reading.

- Resolve category artwork and silhouette framing through the shared provenance registry; preserve originals and identities. Transparent panels render without borders or backgrounds at stable dimensions.
- Derive tradition defaults (history, Saints/Prayers filters, icons) from one orientation store; branch edits and onboarding write through it for consistency.
- Store the chosen category icon style per section (saints, prayers) so a manual pick in one never moves the other; a church choice writes both, and the older single-style key migrates into both on first read.
- Determine tradition onboarding eligibility from account completion metadata and legacy local completion, not a saved branch or signup marker; this includes unseen existing accounts while preventing repeats across devices after completion.
- Define the auth context in a separate non-component module so provider refreshes preserve context identity for mounted consumers.
- Some subdirectories have their own AGENTS.md; read it before changing files there.
- Resolve UI text through LanguageContext t(key) with English fallback and set document lang/dir there, so untranslated strings never break and RTL languages flip layout.
