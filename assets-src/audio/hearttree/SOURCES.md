# Hearttree official local audio sources

This pack is produced offline from real recorded material. Runtime code performs no generation and uses no third-party playback dependency. All source recordings below are dedicated to the public domain under Creative Commons Zero 1.0; the exact source page is retained in `licenses.json`.

The Freesound high-quality preview files are committed as the immutable production inputs because Freesound requires an account for original-file downloads. They remain CC0 derivatives of the identified recordings. The build script never creates oscillator tones: it edits, layers, pitch-transposes, filters, crossfades, and loudness-masters the recorded forest, leaves, wood, water, stone, frame drum, kalimba, and chime performances.

Production chain:

1. `scripts/build-hearttree-audio.sh` renders 24-bit/44.1 kHz archival masters into `assets-src/audio/hearttree/master/`.
2. The same script exports 44.1 kHz/128 kbps runtime MP3 files into `public/audio/wilds/hearttree/`.
3. `scripts/generate-hearttree-audio-manifest.mjs` measures duration, integrated loudness, true peak, and SHA-256.
4. `scripts/validate-hearttree-audio.mjs` rejects missing, unlicensed, undecodable, tone-placeholder, duplicate, unclipped-loop, over-peak, or checksum-invalid assets.

No dialogue is shipped. Narrator and Root Master lines remain deliberately absent until actual performers, releases, session logs, and final recordings exist.
