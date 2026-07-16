# Wilds World-Class Production Audio Design

**Date:** July 15, 2026  
**Status:** Approved design  
**Product:** Receiz Wilds  

## 1. Objective

Replace the current oscillator-tone audio runtime with an original, production-grade adaptive sound system for the complete Wilds experience. The finished system must make location, weather, ecology, creatures, combat, bosses, settlements, proof actions, and story state recognizable through sound alone.

The release includes original music, ambience, sound effects, creature performances, boss suites, and a full human-sounding voice cast. Assets ship locally with the game. No browser speech synthesis, runtime generation service, or third-party runtime audio dependency is allowed.

This design supersedes earlier Wilds slice constraints that required oscillator-only audio or prohibited generated/downloaded production assets. It preserves their lifecycle, accessibility, determinism, performance, and authority requirements.

## 2. Success Standard

The audio system succeeds when:

- every major player action and world state has an authored audio response;
- each major region has a distinct sonic identity while remaining part of one world;
- transitions adapt smoothly to position, intensity, weather, story, and combat state;
- characters sound like human performances rather than browser-generated speech;
- dialogue remains intelligible over music, ambience, creatures, and combat;
- repeated actions remain varied without sounding random or procedurally cheap;
- mobile, laptop, headphones, and full-range playback all retain clarity;
- audio memory, network, concurrency, and lifecycle behavior remain bounded;
- missing assets are caught before release and never replaced by oscillator beeps.

## 3. Selected Approach

Use an adaptive cinematic asset system.

Rendered music stems, looping ambience, authored one-shots, creature performances, and dialogue assets are coordinated by a semantic audio director. The director responds to game meaning rather than raw UI events. It selects regional variants, manages intensity, spatializes world emitters, prevents repetition, and mixes through dedicated buses.

This approach is preferred over simple playlist swapping because it supports seamless transitions and living-world responsiveness. It is preferred over an unbounded procedural library because it preserves authored quality, predictable performance, and a manageable release surface.

## 4. Regional Sonic Identities

### Verdant Heartlands and Amberweald

**Identity:** organic mythic science fiction.

Use living wood, breath, leaves, skin percussion, resonant crystal, warm strings, low brass, intimate choir, tactile creature detail, and restrained synthetic harmonics. The sound should suggest that nature and proof technology evolved together.

### Echo Highlands and Moonwater Reach

**Identity:** epic high fantasy.

Use orchestral strings, horns, deep drums, ancient winds, choirs, water, stone, ruin resonance, and broad melodic writing. Echo Highlands leans heroic and windswept; Moonwater Reach is fluid, nocturnal, mysterious, and emotionally expansive.

### Prism Coast

**Identity:** futuristic electronic.

Use premium synth architecture, granular shimmer, holographic transients, deep controlled pulses, hybrid percussion, spectral movement, and crystalline digital detail. The result must feel engineered and physical, not like generic menu beeps.

### World Cohesion

A shared Receiz leitmotif appears in all three identities through different instrumentation and harmony. Border zones crossfade compatible stems and ambience layers. A player moving across the map hears a transformation of one world rather than a hard switch between unrelated soundtracks.

## 5. Runtime Architecture

### Audio director

Create one bounded audio director that receives semantic state and events:

- player region and exact position;
- biome, landmark, settlement, and interior context;
- time, weather, ecology, and aftermath state;
- discovery, travel, interaction, and proof events;
- encounter and combat intensity;
- boss family, phase, telegraph, and raid state;
- story chapter, speaking character, and dialogue priority.

The director chooses assets from a typed manifest, maintains anti-repetition history, schedules musical transitions, applies concurrency policy, and controls spatial emitters.

### Mix buses

Use six independently controlled buses:

1. master;
2. music;
3. ambience;
4. effects;
5. creatures;
6. dialogue.

Each bus supports gain, mute, pause/resume, and lifecycle cleanup. Dialogue applies bounded ducking to music and ambience. Critical telegraphs may temporarily reduce noncritical effects without muting the world.

### Playback strategy

- Decode short effects and frequently reused creature cues into audio buffers.
- Stream long music, ambience, and dialogue where appropriate.
- Preload the active region plus bounded likely transitions.
- Evict inactive regional banks using an explicit memory budget.
- Limit simultaneous one-shots by category and priority.
- Stop or suspend playback when the page is hidden, audio is muted, or the experience unmounts.
- Resume only after a valid browser gesture.

### Spatial audio

Position creature, landmark, portal, weather, settlement, crowd, and boss emitters in the world. Apply distance rolloff, stereo position, and category-specific near/far behavior. Do not spatialize narration or essential interface confirmation in a way that harms intelligibility.

## 6. Music System

Music uses compatible adaptive stems rather than restarting a finished track for every state change. Stem groups include:

- exploration foundation;
- wonder and discovery;
- motion and rhythm;
- tension;
- encounter;
- battle;
- boss escalation;
- raid climax;
- victory and aftermath.

Transitions occur on musically useful boundaries with short crossfades. Region changes transform instrumentation while retaining the shared leitmotif. Bosses and landmark activities can temporarily own the score, then return cleanly to the current regional state.

The initial official score includes:

- one shared world theme;
- five regional exploration suites;
- settlement and festival material;
- ecology tension and resolution material;
- encounter and general battle suites;
- eight boss identities with compatible escalation layers;
- global raid music;
- discovery, capture, proof-seal, reveal, evolution, lineage, victory, defeat, and memorial cues.

## 7. Ambience System

Ambience is layered from stable beds and event-specific detail. Coverage includes:

- all five regions;
- day and night variants;
- wind, rain, storm, pollen, water, coast, forest, ruins, and open terrain;
- settlements, interiors, markets, festivals, portals, and raid arenas;
- wandering markets, echo ruins, unstable portals, convergence festivals, migrations, lumen blooms, stormfronts, and settlement distress;
- boss territory, aftermath, celebrations, and memorials.

Loops must be seamless. Random detail emitters use bounded timing and deterministic selection where game replay requires stable presentation.

## 8. Interaction Sound Effects

Author complete coverage for:

- footsteps by surface, walking, sprinting, dashing, landing, foliage, and water;
- search, proximity, clues, discovery, pickup, capture, and reveal;
- cards, vaults, inventory, trading, marketplace, checkout, and rewards;
- proof inspection, verification, sealing, append, rejection, and success;
- navigation, confirmation, cancellation, error, modal, and settings interactions;
- Rift travel, portals, doors, landmarks, crafting, lineage, and evolution;
- attacks, impacts, guard, focus, damage, healing, switching, victory, and defeat;
- settlement services, route memory, civic actions, ecology work, and raids.

Each repeated family receives alternate performances and anti-repetition rules. Variation may use restrained gain and timing differences, but must not rely on obvious random pitch shifting.

## 9. Creature and Boss Sound

### Creatures

All 750 forms receive a coherent vocal identity through an authored vocal grammar:

- multiple real source performances per anatomical vocal family;
- species-specific combinations of breath, throat, body, material, and environment layers;
- distinct idle, notice, movement, hurt, attack, bond, capture, victory, and evolution behaviors;
- evolution-stage continuity so a family remains recognizable as it matures;
- mood and size treatment that does not reduce every creature to pitch-shifted copies.

### Bosses

Each of the eight boss families receives a bespoke suite:

- distant territory presence;
- idle and movement;
- encounter reveal;
- telegraph families;
- semantic actions and impacts;
- damage and vulnerable state;
- transformation;
- defeat;
- aftermath;
- musical motif and escalation layers.

Boss audio must communicate gameplay timing as well as spectacle. Shape, animation, text, and audio remain redundant accessibility signals.

## 10. Human Voice Cast

Browser speech synthesis is prohibited.

Use rendered, human-sounding voice assets with a stable cast registry. Every canonical named character receives one consistent voice identity. The cast covers:

- cinematic narrator;
- guides and onboarding characters;
- settlement residents and service characters;
- merchants;
- rivals and social roles;
- recurring regional story characters;
- major ecology characters;
- bosses and raid announcements.

Dynamic supporting characters use bounded cast archetypes with consistent direction rather than arbitrary voice selection.

Every spoken line includes:

- character and voice identity;
- exact script;
- subtitle key and subtitle text;
- emotional direction;
- priority and interruption class;
- repetition cooldown;
- trigger and story-state conditions;
- source asset path and production metadata.

Critical dialogue cannot be interrupted by incidental barks. Dialogue lowers music and ambience by a bounded amount, never hard-mutes the world, and remains clear during combat. Users can control dialogue volume and subtitles independently.

## 11. Asset Manifest and Provenance

The typed manifest records:

- stable asset ID;
- file path and format;
- category and mix bus;
- duration and loop points;
- gain and loudness metadata;
- preload bank;
- spatial behavior;
- trigger and variation group;
- priority, cooldown, and concurrency limit;
- character, voice ID, script, and subtitle data when applicable;
- generation or recording prompt/direction;
- production date and tool/provider;
- usage-rights and account-plan assumptions;
- content digest for release validation.

All shipped audio is original and stored in the repository or its approved release asset channel. Provider credentials never enter browser code or committed files.

## 12. Formats and Mastering

- Keep lossless production masters outside the runtime bundle or in the approved source archive.
- Ship browser-ready compressed assets with a consistent sample rate and channel policy.
- Use mono for spatial one-shots when stereo content is unnecessary.
- Use stereo for music, ambience beds, narration, and authored wide effects.
- Normalize by category rather than forcing every file to the same loudness.
- Preserve headroom for boss, raid, and cinematic peaks.
- Create mobile-safe masters whose bass and transients survive small speakers.
- Avoid clipping, excessive limiting, harsh high frequencies, and uncontrolled sub-bass.

## 13. Accessibility and Controls

Settings include:

- master volume;
- music volume;
- ambience volume;
- effects volume;
- creature volume;
- dialogue volume;
- mute;
- subtitles;
- reduced audio intensity for sharp transients and heavy low-frequency effects.

All critical gameplay information remains available visually and textually. Dialogue always has subtitles. Audio failure never blocks play.

## 14. Failure Behavior

Development and CI fail on missing manifest entries, missing files, invalid loop metadata, duplicate IDs, orphan assets, or absent required cue coverage.

Production behavior is bounded:

- a failed noncritical asset degrades to silence and records a diagnostic;
- a failed regional bank preserves already loaded audio and attempts a bounded retry;
- a failed dialogue asset displays its subtitle without synthetic speech;
- audio context failure exposes a retryable muted state;
- no failure path creates oscillator beeps or browser-generated voices.

## 15. Performance Budgets

The implementation plan must define measured budgets for:

- initial audio payload;
- per-region preload payload;
- decoded buffer memory;
- streamed media concurrency;
- simultaneous effects, creatures, ambience layers, music stems, and dialogue;
- transition latency;
- mobile decode and playback behavior;
- long-session node, timer, listener, and cache cleanup.

Only the active region, adjacent transition material, global UI/proof cues, and currently relevant encounter banks may remain warm by default.

## 16. Verification and Release Qualification

Automated coverage includes:

- manifest schema and file existence;
- stable IDs and content digests;
- required event-to-cue coverage;
- regional and boss bank completeness;
- music stem compatibility metadata;
- loop and duration validation;
- anti-repetition and concurrency behavior;
- mix-bus gain, mute, and ducking behavior;
- dialogue priority, interruption, subtitle, and cooldown behavior;
- gesture unlock, hidden-tab suspension, pause/resume, route cleanup, and disposal;
- preload, eviction, and memory-bound behavior;
- removal of oscillator and browser speech synthesis fallbacks;
- typecheck, lint, tests, production build, and browser diagnostics.

Manual audio QA covers:

- all five regions and transition borders;
- every ecology family and boss family;
- exploration, settlements, encounters, battle, raids, proof actions, commerce, evolution, lineage, victory, defeat, and return-player continuity;
- headphones, laptop speakers, mobile speakers, and a full-range playback system;
- quiet and noisy listening environments;
- minimum, default, and maximum volume combinations;
- mute, subtitles, reduced audio intensity, backgrounding, interrupted loading, and long-session repetition.

## 17. Delivery Slices

The work is large enough to require coordinated production slices:

1. asset pipeline, manifest, mix buses, loader, lifecycle, and removal of oscillator fallback;
2. global UI, proof, movement, interaction, and gameplay effects;
3. five regional music and ambience suites with adaptive transitions;
4. ecology, creature vocal grammar, and all creature behavior families;
5. eight boss suites, combat expansion, raid mix, and cinematic peaks;
6. full character cast, dialogue system, subtitles, ducking, and narrative coverage;
7. mastering, performance optimization, browser qualification, and release evidence.

Each slice must be independently playable, tested, and production-safe. A slice may not claim final audio completion while required categories remain represented by placeholders, oscillators, browser speech, or missing assets.

## 18. Non-Goals

- Runtime audio generation.
- Browser speech synthesis.
- Unlicensed commercial music or sound libraries.
- A single generic sound reused across unrelated actions.
- Unique hand-recording sessions for every one of the 750 forms when the authored vocal grammar already produces a coherent individual identity.
- Audio-only communication of critical gameplay information.
- Unbounded preload, decode, node creation, or background playback.

## 19. Completion Condition

The production audio program is complete only when every required category has final original assets, every semantic trigger resolves through the typed manifest, all five regions transition coherently, all creature and boss families have recognizable identities, the full cast uses rendered human-sounding performances with subtitles, the mix remains intelligible and bounded across target devices, oscillator/browser-voice fallbacks are absent, and the automated plus manual release gates pass.
