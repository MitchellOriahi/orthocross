# Architecture Rules
<!-- LOVABLE:BEGIN -->
- Persist terminal read-aloud service failures across reloads and stop prefetch/lookahead on failure; this prevents credit/access failures from producing repeated requests or unhandled rejections.
- Estimate read-aloud word starts from WAV speech regions and follow the playing media clock; Gemini supplies no exact timestamps.
<!-- LOVABLE:END -->
- Cache avatars by source in bounded CacheStorage; AvatarImage uses local blobs, bounded retries and online resets to survive failures.
- Embed Church Guide cross variants as data URLs so rendering never waits on image requests.
- Track lifetime saint-story completion by exact roster ID in private reading records and shared query cache; award all-stories completion by unique IDs to avoid namesake and membership inflation.

- Pause Saints via a visibility selector; keep the saved catalog and presentation intact.
- Keep the Saints browser separate from saved biographies; audited portrait registries preserve identities and classifications.

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track Journal drafts separately with shared empty-note cleanup to preserve existing/edited notes. Expand in the same editor, hiding columns to retain list state.
- Use shared donor tiers and server-resolved anonymous names; portrait, crown and tag colors follow tier, not rank. Header glow uses account-keyed donor-status refreshed on donors-changed to avoid cross-account glow.
- History: a pure ordered-progress selector advances the glow; rows prioritize island width and fixed checkpoints over optional spacers, keeping translations readable.
- Render the Board daily verse via a dedicated card reusing the deterministic local selector and share dialog; notifications unchanged.
- Compose verse images locally from bundled licensed photos picked by date index (no repeats per cycle) and cached, so rotation never waits on AI or sign-in.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.
- Validate the image function's bearer token with getUser(token) on a stateless auth client; global headers do not create an SDK session.
- Keep the legacy verse artwork function isolated so sharing never triggers billed image generation.
- Keep style-specific verse typography in a dedicated canvas renderer with measured text fitting and global artwork palette tokens, so all styles preserve the complete verse without clipping.
- Reset island detail scroll before paint on each selection; same-page selection skips route scroll restoration.
- Resolve saint card icons through a bundled roster-keyed registry with focus/zoom crop values, overridden by admin-saved rows from the hidden icon tuner; derive detail images and credits from the same registry so new portraits keep attribution without touching the saved catalog or card layout.
- Fetch Athonite catalogs via an authenticated fixed-collection function with storage caching and a blocked-feed stop flag; it cannot approve portraits or alter saints.
- Verify Stripe payments and totals server-side; friend donation alerts come from a service-only queue enforcing anonymity, friendship, blocks and preferences, idempotent per push.

- Share donation interval validation. Currency estimates use dated public USD rates; checkout amounts and tiers stay unchanged.
- Use a tested gift-preview selector for slider position, portrait tier and glow; shared thresholds align custom gifts.
- Schedule donation and rating prompts through one pure, tested coordinator (src/lib/promptScheduler) mounted only on the Board, so prompts never collide or interrupt reading.

- Resolve island lesson and category artwork via the shared provenance registry with credits; preserve originals; transparent panels render borderless at stable dimensions. A panel too tall for its square tile is fitted whole with a slight vertical compression, never cropped away or padded with flat bands.
- Derive tradition defaults (history, Saints/Prayers filters, icons) from one orientation store; branch edits and onboarding write through it for consistency.
- Store the chosen category icon style per section (saints, prayers) so a manual pick in one never moves the other; a church choice writes both, and the older single-style key migrates into both on first read.
- Gate tradition onboarding by account/legacy completion, not branch or signup flags; include unseen accounts without cross-device repeats.
- Define auth context outside components to preserve identity during refresh.
- Some subdirectories have their own AGENTS.md; read it before changing files there.
- LanguageContext sets lang/dir/fallback; reveal switches after React and DOM translation settle.
- public/i18n drives DOM translation; protect scripture, fit whole words, scroll dialogs. content_keys.py extracts rendered History and JSON Saints to prevent omissions.
- Offer the OSB plus the app language's own Bibles, fetched from fixed public sources by the chapter function.
- DonorTierName uses angelic dictionary keys; billing ranks stay unchanged.
- Reminder runs auth via a grant-less scheduler_secrets row and send leaderboard pushes server-side, so closed apps still get them.
