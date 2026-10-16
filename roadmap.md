# Prayers category browser
## Tradition sticker update
- [x] Allow unseen existing accounts to receive the sticker once. Fourteen rule tests pass, including completed-account suppression across devices; signed-in existing account opens the sticker and Eastern church list without runtime errors. Completion saving is unchanged; the account was left uncompleted so its owner can test.
- [x] Alphabetize church lists, remove generic family entries, rename the neutral choice Neither, and mark eligibility only at signup with account-persisted completion. Rule tests pass; real signed-in returning account shows no sticker or runtime errors. Fresh signup and cross-device completion were not exercised end-to-end.
- [x] Make the "Profile updated!" sticker dismiss itself after 4 seconds. One duration test passes; signed-in timing check shows it closing at ~4s against the ~5s default sticker, build clean.
## Category icon styles
- [x] Rearrange Coptic Saints top and middle rows with the four supplied images; replace Righteous Laypeople. All seven delivered tiles verified signed in, previous artwork preserved, 15 tests pass, build clean.
- [x] Add a far-right Icons dropdown to Saints and Prayers with shared persistent Original, Tewahedo, Coptic and Byzantine choices.
- [x] Source authentic licensed artwork for every category; preserve original images and layout. Twenty tests pass; all 52 category images load across four styles, and shared selection/reload verified signed in using live asset delivery (localhost does not serve the CDN path).
- [x] Place the owner's supplied Tewahedo photographs: Trinity panel and manuscript miniature in the top row (Angels, Biblical Saints), Theotokos and Saint George in the middle row (Monastics, Church Fathers); five tests pass, all seven tiles load, credits plain text, build clean.
- [x] Place the owner's two supplied archangel photographs in the row below the middle (Martyrs, Missionaries); six tests pass, all seven tiles load with readable labels and no bottom-bar overlap, credits plain text, build clean.
- [x] Keep Saints and Prayers icon styles separate: a style picked in one section no longer changes the other. Two independence tests plus the existing rules pass (197 checks), signed-in check shows Saints Coptic beside Prayers Tewahedo, build clean.
## Profile identity tags
- [x] Added searchable branch, patron saint and country pills beneath the profile sticker username; signed-in save/reload/clear flow verified, orange/blue/grey colors checked, five tests passed and build clean.
## Donation gift screen
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
