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
- Journal opens on Folders; shared scopes keep All Notes unfiled without move navigation. Separate untouched drafts; expand in place to retain list state.
- Journal highlight ranges use Unicode sentence segmentation across inline formatting and split existing marks at selection boundaries, so removing one word preserves the rest of a highlighted sentence. Highlights never paint whitespace: strip spaces out of every mark before folding same-colour marks, and same-colour marks merge only when nothing (not even a space) separates them.
- Use shared donor tiers and server-resolved anonymous names; portrait, crown and tag colors follow tier, not rank. Header glow uses account-keyed donor-status refreshed on donors-changed to avoid cross-account glow.
- Global monthly standings and the previous-month podium resolve identities through the public leaderboard profile lookup, joined by account ID with deterministic tie ordering; friends-only profile reads cannot supply global winners.
- History: a pure ordered-progress selector advances the glow; rows prioritize island width and fixed checkpoints over optional spacers, keeping translations readable.
- Render the Board daily verse via a dedicated card reusing the deterministic local selector and share dialog; notifications unchanged.
- Compose verse images locally from bundled licensed photos picked by date index (no repeats per cycle) and cached, so rotation never waits on AI or sign-in.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.
- Register verse Share/Filesystem proxies through the dynamically loaded bundled Capacitor core; ignored bare-package imports cannot resolve in release WebViews. Native binaries still require both plugins synced.
- Validate the image function's bearer token with getUser(token) on a stateless auth client; global headers do not create an SDK session.
- Keep the legacy verse artwork function isolated so sharing never triggers billed image generation.
- Keep style-specific verse typography in a dedicated canvas renderer with measured text fitting and global artwork palette tokens, so all styles preserve the complete verse without clipping.
- Reset island detail scroll before paint on each selection; same-page selection skips route scroll restoration.
- Resolve saint card icons through a bundled roster-keyed registry with focus/zoom crop values, overridden by admin-saved rows from the hidden icon tuner; derive detail images and credits from the same registry so new portraits keep attribution without touching the saved catalog or card layout.
- Fetch Athonite catalogs via an authenticated fixed-collection function with storage caching and a blocked-feed stop flag; it cannot approve portraits or alter saints.
- Verify Stripe payments and totals server-side; friend donation alerts come from a service-only queue enforcing anonymity, friendship, blocks and preferences, idempotent per push.

- Share donation interval validation. Currency estimates use dated public USD rates; checkout amounts and tiers stay unchanged; the picker sits in the dialog's corner help button, not a standalone row.
- Resolve new preset support checkouts from the shared offer price registry, with custom-gift fallback; never mutate existing subscriptions or equate lifetime donor tiers with recurring entitlements.
- Test gift thresholds; measure peek without scroll, set opening height before paint, and defer resize writes to avoid shifts and loops.
- Schedule donation and rating prompts through one pure, tested coordinator (src/lib/promptScheduler) mounted only on the Board, so prompts never collide or interrupt reading.

- Resolve island lesson and category artwork via the shared provenance registry with credits; preserve originals; transparent panels render borderless at stable dimensions. A panel too tall for its square tile is fitted whole with a slight vertical compression, never cropped away or padded with flat bands.
- Resolve explicit community icon defaults in the orientation store with Greek fallback; identity queries protect branch priority and manual picks.
- Store the chosen category icon style per section (saints, prayers) so a manual pick in one never moves the other; a church choice writes both, and the older single-style key migrates into both on first read.
- Gate onboarding by account completion, not device language or branch; eligible accounts choose language before tradition, without cross-device repeats.
- Initialize the orientation survey by stable account ID, not auth user-object identity; submit branch and completion sequentially with one lock so token refresh cannot restart the survey or strand disabled controls.
- Define auth context outside components to preserve identity during refresh.
- Some subdirectories have their own AGENTS.md; read it before changing files there.
- Bottom navigation activates pointer taps only once on pointer-up, permanently cancels moved gestures and ignores trailing pointer clicks; keyboard clicks remain available, while horizontal overscroll containment reduces browser history gestures where supported.
- Reader gestures use a shared tested axis lock and full two-axis travel; user-driven scroll direction supplements touch visibility while ignoring overscroll and programmatic movement, preventing accidental page turns and delayed bar reveals.
- LanguageContext sets lang/dir/fallback; reveal switches after React and DOM translation settle.
- public/i18n drives DOM translation; protect scripture/whole words. content_keys.py checks History/Saints; audit typed and DOM church-family labels for meaning.
- Offer the OSB plus the app language's own Bibles, fetched from fixed public sources by the chapter function.
- DonorTierName uses angelic dictionary keys; billing ranks stay unchanged.
- Reminder runs auth via a grant-less scheduler_secrets row and send leaderboard pushes server-side, so closed apps still get them.
- Open the Scripture reader at the top of its chapter on mount: an in-app route change keeps the window's old scroll position, so the reader resets scroll before paint.
- Bundle streak sticker mascots as transparent local assets with semantic theme styling; artwork must never delay or change streak evaluation.
