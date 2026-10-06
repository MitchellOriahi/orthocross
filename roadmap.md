# Verse image sharing

- [x] Fix image authorization rejecting a valid sign-in; live request passes authentication and reaches generation configuration.

- [x] Make each image choice request matching, visibly different artwork; deploy the updated image function.
- [x] Share the composed image without pasted verse text; support browser files and add native attachment support.
- [x] Verify three distinct style requests, cached image restoration, and a PNG-only share payload using controlled images; five tests pass.
- [x] Replace missing image-service credential dependency with managed Lovable AI; deployed function returned HTTP 200 and a live verse image with the current signed-in session; sharing tests pass.
- [ ] Verify native device sharing — requires a new phone build with the added sharing plugins.