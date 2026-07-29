# v13/03 Blockers

## D5 — Split `lib/helpers/utils.poku.js` — DONE (was deferred)

Completed in the review pass. `utils.poku.js` 12,422 → 95 lines, split across 16 new
`*.poku.js` files mirroring the source modules. Live test count preserved exactly at
**247** (and 6 `describe` blocks). See the counting note below.

The split was done from a `@babel/parser` AST, not line heuristics. That matters: a
line-based splitter corrupts this file in two ways that both produce green-looking runs.
First, top-level `});` sequences appear inside TOML/YAML template-literal fixtures, so
naive block-end detection truncates tests. Second, three tests live inside `/* ... */`
comments; extracting a block whose leading `/*` is left behind silently resurrects them as
live code, and they reference an unbound `utils` identifier.

## Open items (decisions, not blockers)

### 1. ~1,174 lines of orphaned JSDoc remain in `lib/helpers/utils.js`

159 of 161 JSDoc blocks in `utils.js` document functions that now live in leaf modules.
`utils.js` declares nothing itself — it is a pure re-export barrel — so those comments
describe code that is no longer adjacent to them. In one case the mismatch was actively
misleading: a `@returns {Object} pkgFilesMap` block sat directly above an unrelated
`isAsciiHexCode` constant.

**Not removed**, because `types/lib/helpers/utils.d.ts` currently carries some of these
comments, so deleting them changes committed types and needs a `gen-types` regen. Worth a
focused follow-up: it would take `utils.js` from 1,760 to roughly 600 lines with no
behaviour change.

### 2. Three tests are commented out in the suite (pre-existing)

The suite contains three `it(...)` blocks inside `/* ... */`, marked *"Slow test"* and
*"These tests are disabled because they are returning undefined"*, covering
`getMvnMetadata` and IRI-reference validation. They were preserved verbatim during the
split (the `getMvnMetadata` one now sits in `ecosystems.poku.js`, the IRI ones in
`core-misc-b.poku.js`) but remain disabled. Re-enabling them means fixing whatever makes
them return `undefined` — a behaviour question, not a decomposition one.

**Note on test counting:** `grep -c '^\s*(it|test)\('` returns **250** because it also
counts those three commented-out blocks. The AST-parsed live count is **247**. Use the AST
count when verifying a test split lost nothing — the grep number agreed before and after
only because it was equally wrong on both sides.
