# Speech Rules
- Read scripture through cloudSpeechEngine (Gemini TTS WAV); estimate word starts from measured speech regions excluding sustained silence and drive glow/seek from the playing media clock. Gemini supplies no exact word timestamps; retain webSpeechEngine behind the same interface.
- Plan cloud speech from canonical chapter chunks (short opener, longer rest) with edge-silence trimming, multi-chunk lookahead and two alternating audio elements, so playback starts fast, resumes from cache mid-chunk and has no gaps between chunks.
- Continuous read-aloud chains chapters through the speech hook's chapter-end callback and skips the hidden-page pause only in that mode, so normal listening still pauses when backgrounded.
