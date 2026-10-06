# Verse image sharing

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