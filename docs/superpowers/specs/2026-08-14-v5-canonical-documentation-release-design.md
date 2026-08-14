# Receiz Commerce Kit V5 Canonical Documentation Release Design

Date: August 14, 2026

Status: Approved for implementation

Release target: `5.0.0`

SDK target: `@receiz/sdk@119.0.0`

## Purpose

V5 turns the repository's accumulated Receiz v107 through v119 work into a
clear institutional record and gives every builder one unambiguous route to
current platform guidance.

The release must make two ideas immediately clear:

1. `https://docs.receiz.com` is the canonical documentation origin for Receiz
   concepts, contracts, and build guidance.
2. This repository is the production-shaped implementation and evidence layer
   for applying those contracts to commerce, identity, proof, settlement,
   portable assets, games, and agent-operated products.

The live developer portal is `https://receiz.com/developers`. It complements
the documentation origin with current SDK, API, MCP, authentication, endpoint,
and conformance surfaces.

## Source-of-Truth Hierarchy

Documentation will state the following precedence without implying that prose
can overrule proof:

1. Sealed Receiz proof objects and independently verified history are runtime
   authority for the facts they carry.
2. Published SDK contracts, canonical registries, constitutional laws, and
   conformance suites define the current executable integration contract.
3. `docs.receiz.com` is the canonical human-readable build reference.
4. `receiz.com/developers` is the live developer and API portal.
5. Repository guides explain how this application implements those contracts.
6. Release audits and migration attestations preserve historical evidence.

If repository prose conflicts with the current published platform contract,
builders must follow the published contract and update the repository prose.
Repository implementation notes must link outward rather than duplicate broad
platform documentation that would drift.

## Approaches Considered

### Link layer only

Add prominent external links to the README and release notes. This is low-cost
but does not create a durable documentation system or prevent future drift.

### Canonical documentation system

Establish the source hierarchy, introduce a repository documentation map,
route contributor and support workflows through it, publish a cumulative V5
achievement record, and enforce the critical references in the release gate.
This is the selected approach because it combines clarity, maintainability,
and verifiable governance without duplicating the platform docs.

### Full local mirror

Copy the external documentation into the repository. This was rejected because
it would create a second authority surface and eventually become stale.

## Documentation Surfaces

### README

The opening screen will contain a highly visible "Build with Receiz" entry
point before implementation detail. It will route builders to:

- canonical documentation;
- the live developer portal;
- the repository documentation map;
- the local developer kernel and SDK rail map.

The README will describe V5 as a cumulative institutional release and summarize
the strongest outcomes since V4 without turning the opening into an exhaustive
changelog. Its version will be updated to `5.0.0`; the SDK remains pinned at
`119.0.0`.

### Repository documentation map

A new `docs/README.md` will answer:

- where a new builder starts;
- which source is canonical for each kind of question;
- which local document explains architecture, SDK rails, production readiness,
  migration, security, support, and release evidence;
- how humans and agents should resolve conflicts or stale guidance;
- which documents must be updated for common classes of change.

The map will be concise and task-oriented. It will not reproduce external API
documentation.

### V5 achievement record

A new `docs/V5_ACHIEVEMENTS.md` will document the complete post-V4 arc using
the repository's release audits, changelog, release notes, tags, and executable
contracts as evidence.

It will include:

- an executive account of what became possible;
- an SDK v107 through v119 capability timeline;
- application achievements since `v4.0.0`;
- quantitative evidence such as current operation, skill, law, conformance,
  and verified-test counts only where supported by checked-in evidence or a
  fresh V5 release run;
- a practical "what you can build now" section;
- an evidence index linking every material claim to repository artifacts;
- explicit exclusions for deployment, package publication, production data
  migration, and other actions not performed by the source release.

The tone may be ambitious, but every superlative must be translated into a
specific capability, architectural consequence, or verified result.

### Contributor, support, agent, and GitHub workflows

`CONTRIBUTING.md`, `SUPPORT.md`, `ai-skills/README.md`, the pull-request
template, and issue forms will point to the documentation map and canonical
external sources where relevant. Contribution guidance will require builders
to consult the canonical docs before changing SDK contracts and to update the
local rail map when implementation changes.

## V5 Release Package

The repository release will include:

- `package.json` and lockfile version `5.0.0`;
- README current-release metadata `5.0.0`;
- a top-level `5.0.0` changelog entry;
- a new leading V5 section in `RELEASE_NOTES.md`;
- `docs/releases/2026-08-14-v500-documentation-release-audit.md` containing
  release scope, evidence, qualification results, and exclusions;
- the documentation architecture and achievement documents described above;
- release-gate enforcement of the canonical documentation contract.

This task prepares and commits the official repository release. It does not
push to a remote, create or replace a Git tag, publish npm packages, deploy an
application, or mutate production data. Those external actions require their
own explicit execution and evidence.

## Governance Check

A deterministic, zero-network documentation check will validate:

- the repository version is `5.0.0` everywhere designated as current release
  metadata;
- the README, documentation map, contributor guide, and support guide retain
  the canonical `docs.receiz.com` reference;
- the documentation map retains the canonical `receiz.com/developers` portal;
- the V5 achievement record covers every SDK version from v107 through v119
  represented by this repository's coordinated migration history;
- required V5 release artifacts exist;
- local Markdown links in the governed documents resolve to tracked files.

The check will be exposed as `pnpm docs:check` and added to the existing
`release:check` orchestration. External links will not be fetched during the
release gate because DNS or network availability is not documentation truth.

## Error Handling and Drift Policy

- A missing canonical reference, missing governed file, version mismatch, or
  broken local link fails `docs:check` with a specific file and requirement.
- Unreachable external sites do not fail the offline gate; their canonical URL
  is asserted structurally and may be smoke-tested separately when network is
  available.
- Historical release audits are not rewritten. V5 summarizes and links them.
- Claims unsupported by repository evidence are omitted or explicitly labeled
  as release intent rather than completed fact.
- The plural developer route, `https://receiz.com/developers`, is used because
  it is the current indexed live platform surface.

## Verification

Implementation is complete only after fresh evidence confirms:

1. `pnpm docs:check` passes.
2. `pnpm secret:scan` passes.
3. `pnpm release:check` passes in full.
4. A repository search confirms the canonical documentation references are
   present in all governed entry points.
5. Version searches confirm no active current-release metadata still claims
   `4.10.0`.
6. The final diff contains documentation and release-governance changes only,
   with no unintended product-runtime behavior change.

The V5 release audit will record the actual results from these runs and will
not inherit old counts as if they were newly verified.
