# Architecture Rules
- Recover transient avatar image failures in the shared AvatarImage with bounded retries and an online-event reset, so every profile portrait can recover without remounting its page.
- Embed optimized Church Guide cross variants as data URLs in the page bundle so rendering does not wait for separate image requests.
- Track lifetime saint-story completion by exact roster ID in the existing private reading records and shared query cache; derive the all-stories award from unique roster IDs so same-name saints and cross-category memberships cannot inflate completion.

- Pause Saints via a visibility selector; keep the saved catalog and presentation intact.
- Separate the Saints browser from the saved catalog; use audited replaceable portrait registries to preserve identities, icons and classifications.
- Keep the supplied browser roster separate from preserved biographies, with category-qualified many-to-many memberships and shared identities, so cross-category saints are not duplicated or old classifications overwritten.
- Apply Saints tradition filtering in the roster selector alongside category, subgroup and search; shared-tradition records belong to both filters so presentation never rewrites classifications.

- Deduplicate React and React DOM in Vite resolution so the renderer and hook-based dependencies share one React instance and dispatcher.
- Track Journal drafts separately with shared empty-note cleanup to preserve existing/edited notes. Expand in the same editor, hiding columns to retain list state.
- Use shared donor tiers and server-resolved names for anonymity; inherit portrait, crown and tag colors from one tier token, not rank.
- Derive the next journey island from ordered islands and completion progress through a shared pure selector, so the highlight advances without hardcoded island IDs.
- Render the Board daily verse through a dedicated card using the original deterministic local verse selector and existing share dialog, keeping notification delivery unchanged.
- Preload licensed photos and compose locally; pick each day's three photos by date index from a bundled per-category library (no repeats within the cycle) and cache compositions, so daily rotation never waits on AI or sign-in.
- Share composed verse images as file-only payloads through native attachment sharing or browser file sharing, downloading when unsupported; text-only email/SMS links cannot carry image attachments.
- Validate the image function's bearer token explicitly with getUser(token) on a stateless auth client, because global request headers do not create an SDK session.
- Keep the legacy server-side verse artwork function isolated from photo-based sharing, so the current dialog never invokes a billed image-generation request.
- Keep style-specific verse typography in a dedicated canvas renderer with measured text fitting and global artwork palette tokens, so all styles preserve the complete verse without clipping.
- Resolve every island lesson image through a provenance registry of stored assets, retain source/license credits, and use cover framing with upper alignment for face-focused artwork so frames stay filled without cropping out faces.
- Reset island detail scroll before paint on each island selection, because same-page selection does not trigger route scroll restoration.
- Keep additional saint lives in a typed catalog with stored icon pointers and per-icon provenance, merging alphabetically with the original saints so additions preserve existing identities and presentation.- Show Synaxaria-researched roster stories from a separate id-keyed stories file ahead of preserved biographies, so expanded lives never overwrite the saved catalog.
- Resolve saint card icons through a bundled roster-keyed registry with focus/zoom crop values, overridden by admin-saved database rows from the hidden icon tuner; derive roster detail images and credits from the same registry so newly sourced portraits retain attribution without changing the saved catalog or card layout.
- Fetch public permission-based Athonite catalogs through an authenticated, fixed-collection cloud function with storage caching and a persistent blocked-feed stop flag; this operation cannot approve portraits or alter saint records.
- Verify Stripe payments and compute totals server-side; queue friend alerts via a service-only donation-keyed function enforcing anonymity, friendship, blocks and preferences, with push UUID idempotency to prevent duplicate alerts.

- Share prayers in one catalog with category-qualified placements; retain IDs, text, pins and highlights.
- Share donation interval validation between dialog and checkout to keep billing consistent.
- Schedule donation and rating prompts through one pure, tested coordinator (src/lib/promptScheduler) mounted only on the Board, so prompts never collide or interrupt reading.
