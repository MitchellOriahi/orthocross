# Verse image sharing

- [x] Fix image authorization rejecting a valid sign-in; live request passes authentication and reaches generation configuration.

- [x] Make each image choice request matching, visibly different artwork; deploy the updated image function.
- [x] Share the composed image without pasted verse text; support browser files and add native attachment support.
- [x] Verify three distinct style requests, cached image restoration, and a PNG-only share payload using controlled images; five tests pass.
- [ ] Verify live artwork generation — blocked by missing GEMINI_API_KEY in the existing image service; requires secure credential setup or an explicitly approved service migration.
- [ ] Verify native device sharing — requires a new phone build with the added sharing plugins.