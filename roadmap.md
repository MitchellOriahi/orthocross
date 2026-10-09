# Prayers category browser
## Donator presentation
- [ ] Show full names for non-anonymous donors, match the monthly top-three podium with muted remaining ranks, and open a complete lifetime-tier guide from donor tiers; verify privacy and interactions.

- [x] Imported 124 new prayers; merged eight repeated entries, preserved all 12 originals and all supplied placements.
- [x] Added Saints-inspired six-thumbnail browser, independent searches, tradition filters and all 31 ordered micro-category chips.
- [x] 13 tests passed; verified six category pages, all 31 chips, six loaded thumbnails, search/Back/details and phone/computer layouts; compile clean.

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
