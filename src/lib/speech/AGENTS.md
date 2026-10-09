# Speech Rules
- Read scripture aloud through the cloudSpeechEngine (read-aloud edge function, Gemini TTS WAV per chunk) with word glow timed from each chunk's real audio duration; keep the device webSpeechEngine as a drop-in fallback behind the same SpeechEngine interface.
- Plan cloud speech from canonical chapter chunks (short opener, longer rest) with edge-silence trimming, multi-chunk lookahead and two alternating audio elements, so playback starts fast, resumes from cache mid-chunk and has no gaps between chunks.
- Continuous read-aloud chains chapters through the speech hook's chapter-end callback and skips the hidden-page pause only in that mode, so normal listening still pauses when backgrounded.
