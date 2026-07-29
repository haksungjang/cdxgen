# v13/03 Blockers

## D5 — Split `lib/helpers/utils.poku.js` — DEFERRED

**Status:** Not started. Deferred to a follow-up session.

**What:** The 12,422-line test file contains 250 `it`/`test` blocks (6 `describe`
blocks) that should be split across ~15 new `.poku.js` files mirroring the source
split.

**Why deferred:** The task is purely mechanical (move test cases verbatim) but
extremely large. Each split file requires:
1. Categorizing every test by which source module it primarily tests
2. Updating `esmock` targets for tests whose functions moved to new modules
   (already partially done for parsePkgLock tests targeting `./parsers-js.js`)
3. Setting up per-file imports from the specific leaf modules

The source decomposition (D1–D4) is the priority deliverable and is complete.
All 250 tests pass through the barrel today. The split improves test isolation
but does not affect functionality.

**Before count:** 250 test blocks in `lib/helpers/utils.poku.js`.

**Notes for the follow-up session:**
- The parsePkgLock esmock targets were already updated to `./parsers-js.js`
  (commit b94e7894) — that pattern applies to all esmock calls in split files.
- The `getPyMetadata` esmock at L1339 and `getNugetMetadata` esmock at L4797
  already use globalMocks (arg 3) for `./httpClient.js` — these should work
  unchanged when moved to `ecosystems.poku.js`.
- The `parseReqFile` esmock at L8958 also uses globalMocks — works unchanged
  when moved to `parsers-python.poku.js`.
