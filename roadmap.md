# Prayers category browser
## Reader swipe clarity
- [x] Separate vertical scrolling from deliberate page turns and reveal the bottom bar promptly with bounce-safe scroll detection. Eleven tests pass; signed-in phone-sized checks confirm vertical arcs, left/right turns, cancellation, scroll fallback, programmatic suppression and real touch hide/reveal without chapter changes. Preview build clean; external website needs deployment, native device testing remains unverified.
## Mobile navigation swipes
- [x] Cancel swipes on navigation buttons without losing first-tap or keyboard activation; horizontal overscroll contained where supported. Four tests pass; signed-in phone-sized checks verify all five first taps, returning swipes, real left/right touch swipes and keyboard activation; build clean. Safari's system edge gestures and native device behavior remain device-specific and unverified.
## Journal highlight modes
- [x] Add Word/Sentence chooser and eight colors; preserve sentence highlights when removing or repainting one word. Thirty-five focused checks and one signed-in save/reload flow passed.
## Revenue offer rollout
- [x] Feature yearly $8/$12/$16 (default $12), $2.99 monthly; preserve existing subscriptions and lifetime tiers. Created tracked Stripe preset prices; authenticated $12 yearly checkout creation returned success without submitting payment.
- [x] Show honest annual comparison, renewal terms, warm impact copy and direct cancellation. Pricing and cancellation rule checks passed; offer controls translated into all 16 non-English languages. Full browser checkout check was blocked by the first-run tutorial; no paid transaction or actual donor cancellation was performed.
- [ ] Paid narration and media perks: blocked until native recurring store products and verified entitlements are configured; do not advertise unavailable perks.
## Welcome and calendar tradition
- [x] Add the question mark while preserving translated titles, and a subtle matching glow to Get Started.
- [x] Keep Eastern choices blue, including hovered buttons after language selection; shared styles verified once in both themes.
- [x] Default the calendar to the saved profile family and preserve account-keyed undecided choices. Twenty-eight focused tests passed; one signed-in calendar switch/grid check passed without runtime errors.
## Journal folder organization
- [x] Name the nested-folder option "Subfolder", enlarge the Folders title and exit X, and make Edit and New Folder larger and clearly separated. Signed-in checks confirm the menu reads Subfolder, the title is 24px with all 16 languages fitting its slot, and Edit/New Folder/exit are 44px targets with 8px gaps and no edge overflow; 51 tests pass, build clean.
- [x] Indent the Folders title so it is no longer flush with the screen edge; it now starts at the same 20px as the folder rows' icons, on both left-to-right and right-to-left screens; 51 tests pass, build clean.
- [x] Give the Folders exit X the same highlight as Edit and New Folder; measured identical background tint, border and corner radius across all three, X fully visible with clear space; build clean.
- [x] Merge the Folders bars; Edit saves sibling ordering. Expandable nested folders persist across reload; deleting a parent preserves child folders/notes. Signed-in phone flow verified, temporary records removed, 51 tests pass, no runtime errors, preview clean.
- [x] Open Journal on Folders without a hamburger; All Notes contains only unfiled notes. Signed-in phone checks confirm moving stays on All Notes with confirmation, destination readback, reopening on Folders, and saved untouched-note deletion. Temporary records removed; 45 tests pass, no runtime errors, preview clean.
- [x] Fix drawing toolbar clipping with a full-screen drawing sheet and additive safe-area spacing. Signed-in 393×763 check confirms full viewport bounds and all seven controls below the top edge; red/blue strokes and save/reload verified; temporary data removed; 19 tests pass, no runtime errors, build clean.
- [x] Keep drawing controls within the page and switch to the pen when selecting colors. Signed-in red/blue strokes verified after erase/select; all controls fit 393×763; saved drawing persisted after reload; temporary note and attachment removed; 19 regression tests pass, no runtime errors, preview build clean.
- [x] Remove redundant Notes folder and clear folder/note selection on exit. Nineteen tests pass; signed-in folder Back, note Back and X verified with no retained highlights or runtime errors; temporary records removed; preview build clean.
- [x] Folder Back returns to folders, X returns to general Journal notes, and manual list/gallery choices persist without late reads overwriting them. Sixteen tests pass; signed-in navigation and both views verified across folders and reload; temporary folder removed; no runtime errors; preview build clean.
- [x] Separate general notes from named folders; retain All Notes, folder counts, in-folder creation and moving notes. Eleven tests pass; signed-in create/move/reload/delete flow verified at 393×681 with no runtime errors; deleting folders preserves their notes; temporary records removed; preview build clean.
## Translation accuracy audit
- [x] Correct ambiguous Orthodox tradition names in French, Spanish, Portuguese and Armenian; signed-in language selection and distinct, fitting tradition choices verified across all 17 languages with no runtime errors.
- [x] Audit 148,096 dictionary entries for integrity, review meaning and numeric discrepancies, correct confirmed errors and document linguistic-review limits. Fifty JS and four Python tests pass; preview build clean. Full native-speaker certification remains outside this audit.
- [x] Replace the bottom two Tewahedo prayer images with the supplied transparent cross photographs; reduce the middle pair to balance their long stems, without cropping or squeezing.
## Donation controls and currency estimates
- [x] Translate donation controls, periods and impact messages in all 16 non-English languages; add optional dated local-currency estimates while preserving USD checkout. Signed-in checks passed across all 17 language choices; live EUR estimates, yearly changes, saved selection and unavailable-rate fallback verified. Eighteen tests and content coverage pass; preview build clean. No payment was made.
## Island and Saints translation coverage
- [x] Fill missing island reading/quiz text, Oriental titles, and every Saints name, subtitle and story in all supported languages. Coverage checks pass for all 16 non-English dictionaries; signed-in French/Serbian Eastern and Oriental lessons and Saint cards/stories verified, no runtime errors. Bible text unchanged; native-speaker review of machine-translated biographies remains advisable.
## History island width
- [x] Widen islands and move alternating checkpoints outward. Russian, Arabic and English checked signed in at phone and desktop sizes without horizontal overflow; five journey tests pass and preview build is clean.
## Final sticker spacing
- [x] Keep bottom sticker gaps equal in all 17 languages on Church, Friends and Board using the measured bottom-bar height; all measured equal on a phone-sized screen, no runtime errors.
- [x] Match the bottom-bar gap to the gap above Churches Near Me and Your Groups. Phone-size measurements: Church 24px above and below; Friends 16px above and below.
## Donation tier languages
- [x] Verify and apply confirmed angelic choir names in all 16 non-English languages across donation lists, tier guide, donor tags and thank-you rank lines. All languages checked on a phone-sized screen; selecting Thrones still chooses $500; tests and build pass.
- [ ] Native theological review for unresolved Hebrew, Amharic, Tigrinya and Malayalam terms. Blocked: no reliable equivalent verified; English is retained rather than guessing.
## Translated layouts
- [x] Prevent translated words from splitting across lines and fit overlong labels in their existing slots, excluding protected Bible text. Friends buttons checked in all 16 translated languages; Church, Settings and History word-boundary checks passed in Serbian, Arabic and Malayalam. Three translation tests pass; preview build clean.
- [x] Fix clipped stickers and resource tiles, preserve header/action control positions across languages, and protect OrthoCross. All 17 languages checked on Friends, Church and Settings; additional main-page checks, Russian cancellation/language stickers, phone and desktop screenshots, brand tests and preview build passed.
## Tradition sticker update
- [x] Keep church selection and account completion in one guarded submission; auth refresh no longer restarts the survey. Twenty-seven checks pass; signed-in completion reaches the Board and stays completed after reload. External website requires its next deployment.
- [x] Language precedes tradition even with a saved device language; verified signed in with pending onboarding, then restored account status. Confirmation uses 3 seconds; observed dismissal at 3.36 seconds including animation. All 25 tests pass; preview clean.
- [x] Allow unseen existing accounts to receive the sticker once. Fourteen rule tests pass, including completed-account suppression across devices; signed-in existing account opens the sticker and Eastern church list without runtime errors. Completion saving is unchanged; the account was left uncompleted so its owner can test.
- [x] Alphabetize church lists, remove generic family entries, rename the neutral choice Neither, and mark eligibility only at signup with account-persisted completion. Rule tests pass; real signed-in returning account shows no sticker or runtime errors. Fresh signup and cross-device completion were not exercised end-to-end.
- [x] Make the "Profile updated!" sticker dismiss itself after 3 seconds (one second shorter than before).
## Category icon styles
- [x] Narrow language defaults to their specific communities; 64 tests pass for both sections, branch priority and manual choices. Signed-in Russian, Armenian, Bulgarian, Malayalam, Arabic, Amharic and Greek language selections read back the correct defaults; no runtime errors, preview build clean. Artwork not inspected.
- [x] Apply language-matched icons without a branch, Greek fallback and independent manual picks. All 52 tests pass; signed-in language-menu changes verified Russian in both sections and English returning both to Greek, no runtime errors.
- [x] Rearrange Coptic Saints top and middle rows with the four supplied images; replace Righteous Laypeople. All seven delivered tiles verified signed in, previous artwork preserved, 15 tests pass, build clean.
- [x] Add a far-right Icons dropdown to Saints and Prayers with shared persistent Original, Tewahedo, Coptic and Byzantine choices.
- [x] Source authentic licensed artwork for every category; preserve original images and layout. Twenty tests pass; all 52 category images load across four styles, and shared selection/reload verified signed in using live asset delivery (localhost does not serve the CDN path).
- [x] Place the owner's supplied Tewahedo photographs: Trinity panel and manuscript miniature in the top row (Angels, Biblical Saints), Theotokos and Saint George in the middle row (Monastics, Church Fathers); five tests pass, all seven tiles load, credits plain text, build clean.
- [x] Place the owner's two supplied archangel photographs in the row below the middle (Martyrs, Missionaries); six tests pass, all seven tiles load with readable labels and no bottom-bar overlap, credits plain text, build clean.
- [x] Swap the Tewahedo Church Fathers and Martyrs tiles to the owner's two newest photographs: the Christ-crowned-with-thorns panel whose reclining father holds two golden hand crosses, and the Saint George icon with the standing onlooker at the right. Each framed so the whole panel shows; 23 artwork tests pass, both tiles verified signed in, superseded images removed, build clean.
- [x] Keep Saints and Prayers icon styles separate: a style picked in one section no longer changes the other. Two independence tests plus the existing rules pass (197 checks), signed-in check shows Saints Coptic beside Prayers Tewahedo, build clean.
## Profile identity tags
- [x] Added searchable branch, patron saint and country pills beneath the profile sticker username; signed-in save/reload/clear flow verified, orange/blue/grey colors checked, five tests passed and build clean.
## Donation gift screen
- [x] Fix donation tier tap glitches with scroll-independent sizing and deferred resize writes. All nine tier buttons selected their correct amounts with stable window height and no runtime errors; opening half-slider peek retained. Sixteen tests pass; build clean.
- [x] Updated Acts quote and mission wording; added $1/$2/$5 with increasing Angel glow and clickable custom-tier previews. Fourteen tests and live amount/slider/portrait-selection checks pass; build clean. Hosted tier image delivery could not be verified in the local browser (asset URL did not load).
## Profile portraits
- [ ] Keep successful profile portraits available through temporary image-request failures and navigation; verify saved-image recovery and monthly leaderboard edge-to-edge framing.
## Tier colors and friend donation alerts
- [x] Match all donor portrait rings/glows and crowns to their tier tags; real donor and four sample tiers verified, including fourth place.
- [x] Notify friends of confirmed non-anonymous donations using private in-app alerts and idempotent native push; payment handlers deployed.
- [x] Four notification tests and ten existing donor tests passed; preview has no runtime errors and build passes. Actual payment-to-device delivery remains untested; no real payment or friend push was sent.
## Donation billing options
- [x] Web donations now offer Monthly (selected by default) and Yearly; checkout deployed, 11 tests pass, selection and yearly request verified without submitting payment. Native subscriptions require configured app-store recurring products; existing native purchases unchanged.
- [x] Move the Monthly/Yearly choice to the top of the donation window, where the Bible verse used to sit, with one toggle pair only; verified in preview with Monthly selected by default and Yearly switching correctly.

## Donation cancellation
- [x] Drop the "pause instead?" sticker from the cancellation flow: choosing to cancel now runs the cancellation and opens the thank-you sticker directly. Three flow tests pass (200 checks total); signed-in check shows the cancel dialog with no pause question and no pause screen afterward; build clean. A real cancellation could not be exercised — the signed-in test account has no active monthly donation ("No active monthly donation found").

## Donator presentation
- [x] Show full names for non-anonymous donors (optional name in donation window), match the monthly top-three podium with muted remaining ranks, and open all nine lifetime tiers from donor tiers; 10 tests pass, interactions checked with sample donors, all nine hosted tier images verified. No payment submitted.

- [x] Imported 124 new prayers; merged eight repeated entries, preserved all 12 originals and all supplied placements.
- [x] Added Saints-inspired six-thumbnail browser, independent searches, tradition filters and all 31 ordered micro-category chips.
- [x] 13 tests passed; verified six category pages, all 31 chips, six loaded thumbnails, search/Back/details and phone/computer layouts; compile clean.
- [x] Set the "Prayers to Christ and the Saints", "Foundational Prayers", "Daily Prayers" and "Holy Communion and Liturgy" thumbnails from photographs the owner supplied, credited as owner photographs without archive links; each framing compared against alternate square crops and the delivered picture checked.
- [x] "Daily Prayers" thumbnail replaced with the owner's photograph of a still-life painting (three prosphora loaves marked with crosses on a pedestaled dish beside a lit candle and sheaves of wheat); horizontal framing 38% chosen after comparing three square crops, keeping the flame and dish fully inside.
- [x] "Psalms and Canticles" thumbnail replaced with the owner's icon photograph (a lamb held in an outstretched hand); vertical framing left centred after comparing 40/50/60%, keeping the halo above and the hooves and ground below inside; credited as an owner photograph without an archive link.
- [x] "Needs and Occasions" thumbnail replaced with the owner's icon photograph (the Anastasis — a hand clasping the hand of the one being raised); vertical framing centred after comparing 35/50/65%, both wrists fully inside; credited as an owner photograph without an archive link. All six category tiles now use owner-supplied photographs.

# Verse image sharing
- [x] Rotate three designs and matching names daily; New Image adds up to three unique replacements per day's verse, preserved on reopening. Twelve licensed photos verified; eight tests and replacement/reload browser checks pass, with a clean build.

## Saints
- [x] Show individual saint-completion stickers with glowing portraits; verified dismissal clears search and centers John of Damascus in Theologians; existing all-stories award remains separate.
- [x] Add persistent completed-story golden portrait rings and a heartfelt award for finishing every unique saint story; exact-identity and final-story rules pass tests, and simulated completion/reload/award flows pass in preview.
- [x] Add Prayers-matched All/Eastern/Oriental toggles to every category heading; all seven categories verified in preview, combined filtering works, and nine roster tests pass.
- [x] Populate category pages from the supplied roster with shared identities, original-style cards and short subtitles; verified subgroup/search/empty states and preserved biographies.
- [x] Update all seven requested subgroup sets; verified two filled rows before shared carousel overflow, Angels without scrolling, and hidden saints preserved; 19 targeted tests pass.
- [x] Refine square category tiles with consistent Commons icons and counts; add compact tagged category pages while keeping saints hidden. Holy Rulers uses a neutral cross until a matching licensed portrait is supplied. Verified category navigation, hidden rows, and seven image deliveries; tests pass.
- [x] Temporarily hide all saints without deleting their saved stories, icons, credits or presentation; keep exact restoration available.
- [x] Add exactly 88 relevant saints with accurate lives, verified traditional icons and source/license credits.
- [x] Verify all 100 Saints cards, portrait framing, alphabetical order and detail views; all portraits load, all 100 detail views open, and all 88 additions include icon credits.
- [x] Put Theotokos first and apply a gold background with a light glow to her entire sticker, keeping the image unchanged.
- [x] Add two-column category boxes under the Saints search bar; all 100 saints are pre-classified for filtering once the catalog is shown again.

## Historical island imagery
- [x] Replace every island illustration with authenticated, topic-relevant reusable historical imagery.
- [x] Document sources and verify all 19 islands render their replacement images; browser checks confirm 19/19 load without runtime errors, source/license credits are visible, and six tests pass.

- [x] Give each photo a distinct, fully readable verse composition; verified centered serif, left-aligned editorial, and framed uppercase treatments with Psalm 51:10. Image-sharing tests pass.

- [x] Replace AI backgrounds with licensed royalty-free photos and compose immediately on Share.
- [x] Verify photo styles, immediate composition, and image-only sharing — four tests pass; browser composition ready in approximately 233ms with preloaded photos, three distinct styles, cached reopening, no runtime errors; stored photo delivery returns HTTP 200.

- [x] Fix image authorization rejecting a valid sign-in; live request passes authentication and reaches generation configuration.

- [x] Make each image choice request matching, visibly different artwork; deploy the updated image function.
- [x] Share the composed image without pasted verse text; support browser files and add native attachment support.
- [x] Verify three distinct style requests, cached image restoration, and a PNG-only share payload using controlled images; five tests pass.
- [x] Replace missing image-service credential dependency with managed Lovable AI; deployed function returned HTTP 200 and a live verse image with the current signed-in session; sharing tests pass.
- [ ] Verify native device sharing — requires a new phone build with the added sharing plugins.

## Saints gold backgrounds and descriptions
- [x] Recolor the 88 added saints' plain backgrounds to the app's golden icon palette (53 icons recolored; photos, mosaics, frescoes and stained glass keep their authentic backgrounds).
- [x] Rewrite all 88 short descriptions to clean one-sentence versions; removed internal notes; data tests pass (4).
## Saint card icons (one category at a time)
- [x] Shared 72px circular icon, gold backing, uniform filter, hidden /icon-tuner (admins)
- [x] Angels
- [ ] Biblical Saints, Monastics, Church Fathers, Martyrs, Missionaries, Righteous Laypeople (portrait research authorized; in progress)
- [x] Donor tiers: keep the Donators heart red in both themes via a shared token; verified in preview, 65 tests pass.
- [x] Donation window: single "Donate anonymously" toggle replaces the two-option name pair; verified in preview, 65 tests pass.
- [ ] Donor tiers: Stripe webhook endpoint + signing secret (waiting on user), then resend the Oct 7 $1 invoice.paid event to backfill



## Read aloud
- [x] Remove current-word glow fade-in, change speed in place without replay and freeze highlighting during stalls. Thirteen regression tests pass; signed-in John 1 read-aloud returns audio successfully and shows the active blue word with no runtime errors. Exact per-word synchronization cannot be guaranteed because the current voices provide audio without word timestamps.
- [x] Contain insufficient-credit failures and stop repeated speech requests; 11 tests pass, browser retains Scripture with no uncaught errors and only one failed request across reload. Voice generation remains blocked until the owner tops up AI credits.
- [x] Improve word-highlight timing using measured speech regions and the playing audio clock; nine tests pass for onset, silence, pauses, seeking and speed. Exact word alignment remains unavailable from the current voice service.
- [x] Continuous listening option: mark finished chapter complete, auto-play next chapter, keep playing with screen off.

## Saint profile pictures
- [ ] Complete Athonite matching/review. BLOCKED: collection returned HTTP 429; do not retry or bypass. Requires Athonite product/image files. Remaining portrait work uses other online sources as authorized.
- [x] Michael replaced with Gabriel-style Byzantine icon; Raphael recropped; 48 more saints given face-focused Commons icons.
- [x] Added 32 more verified online painted portraits with individual face/halo crops and retained PD/CC credits; reused five identical saints' existing portraits under alternate roster names. Cards and saved biographies are unchanged. Coverage: 168 of 343 roster saints; 175 remain. Rejected incorrect namesakes, unrelated group images, photos and failed/rate-limited downloads rather than assigning inaccurate icons. Portrait, provenance and roster tests: 24 passed; Monastics preview opened without runtime errors.
- [ ] Complete all 343 matching online portraits, prioritizing gold-background bust-up icons; historical pictures allowed when no suitable icon exists. Current coverage: 331/343; 12 still need identifiable reusable portraits: Remiel, Sariel, Suriel, Garima, Peter of Sebaste, Aphrahat, Jacob Baradaeus, Porphyrios, Gayane, Raphael/Nicholas/Irene of Lesbos, Basil the Elder, Anthusa. Isidore now has an individually identified icon crop; Macarius has a dated 1854 museum portrait; John of Ioannina has a CC0 gold-background icon. Reject unverified figures, nonexistent source claims, and namesakes; no generic substitutions. Rejected the Anthusa of Constantinople namesake, Phanuel-as-Remiel substitution, unidentifiable Suriel church photograph, and Aphrahat the hermit illustration for the Persian Sage. Gayane's medieval group martyrdom scene does not establish an individual portrait crop. Latest portrait/roster tests: 16 passed; all seven category pages loaded their images without runtime errors.
- [x] Continue with other online sources after the Athonite block; audit coverage, retain source/license credits, and verify all seven category pages with loaded images and unchanged cards.

## Monthly leaderboard podium
- [x] Resolve global standings and monthly podium names/photos through the existing authenticated public-profile lookup; deterministic tie ordering gives viewers the same winners. Two identity tests pass; live signed-in standings display the saved winner name without Unknown User or runtime errors. Previous-month podium has no live September data; external website still requires deployment.
- [x] Keep every place circle visible: own ring shade per place, tuned for light and dark pages, with a page-coloured hairline between ring and picture; verified against grey and brown pictures in both themes, build clean.
- [x] Group ranking rows: top-three picture ring lightened to a 1.5px hairline (shadow ring, since a real border is rounded up to a whole pixel and 2px read as too bold); verified gold/silver/bronze outlines still clearly visible on the group page, build clean.
- [x] Group ranking rows: soft glow added to each top-three picture circle in its own metal — gold first, silver second, bronze third — ring and glow share one tone per place and all three differ; verified in preview, build clean.

## Thank-you sticker wording
- [x] Dropped the "$X more to reach Y" line, put "May God continue to bless you." on its own line, added a breathing golden rim glow around the portrait, and capitalized the donator's first letter; 11 donor tests pass, glow/line-break/wording checked in both themes, thank-you email wording redeployed, build clean.

## Settings donation card
- [x] Removed the "Become a donator" card from Settings (heading, button and the occasional-reminders switch); Manage Donation and the Donate pill elsewhere are untouched; verified signed-in that the card is gone with no runtime errors, build clean.

## Sign-out and account-deletion landing
- [x] Signing out or deleting an account now returns to the app's home screen. The root page used a launch-time sign-in snapshot, so after signing out it bounced back to the Board in an endless redirect; it now follows live sign-in state. Verified signed in: Sign Out from Settings and Delete Account from Data Safety both land on the home screen with no runtime errors, and a signed-in visit to the home page still opens the Board.

## Personal calendar reminders
- [x] Open every date with full church-event names and private editable reminders. Signed-in create/reload/edit/delete and empty-date flows verified; four date/notification-ID tests pass, no runtime errors, build clean. Web alerts require the app open; native scheduling wired but phone delivery not tested.

 - [ ] Finish AI translation of all app wording (about 13% done; paused: out of AI credits). Resume with scripts/i18n/tr.py then merge.py.
- [ ] Bibles for Amharic, Tigrinya, Georgian, Armenian, Bulgarian (no free online source found yet).
## Folders panel top bar
- [x] Match the Folders panel top bar to the Journal's bar height and keep one exit control. Both bars measured 65px on a phone-sized screen; the panel closes with its back arrow only; preview build clean.
- [x] Inside a folder, the Journal's top-left control becomes a back arrow to All Notes; the folder list button returns after leaving the folder. Verified signed in on a phone-sized screen; no runtime errors.
## Sign in/up page logo
- [x] Show the app's regular black logo (black rounded tile with the white-outlined cross, as in dark mode) on the sign in/up, forgot-password and reset-password pages, with no white tile behind it.
## Scripture page-turn controls
- [x] Make the floating page arrows larger rounded squares in the bottom bar's style, lift them clear of the chapter-progress slider, and enlarge Mark Complete to fill its row. Signed-in phone measurements: arrows 48×48 with 12px corners and 49px clear of the slider; Mark Complete 295×48; build clean.
