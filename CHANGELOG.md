# Changelog

## 1.3.0 — 2026-07-22

### Removed

- **All hooks are gone — the plugin now ships only skills and the
  `clean-room-alternative` agent.**
  - The keyword-suggestion hook (`prompt-keywords.sh`): field telemetry
    showed its per-skill `grep` over the full session transcript hitting the
    hook's 5s timeout on nearly every prompt in long or MCP-heavy sessions —
    a `UserPromptSubmit` hook blocks the agent loop, so this added ~5 seconds
    of latency to almost every prompt, and the practical user response was to
    disable the whole plugin.
  - The plan-mode nudge (`enter-plan-mode.sh`): its `PostToolUse` matcher
    targeted the `EnterPlanMode` tool, which only exists in newer Claude Code
    versions, and the agent doesn't need a hook to consider design
    alternatives when planning.

  Skill routing is served by the skill descriptions themselves and by
  `/clairvoyance:diagnose` for vague symptoms — the agent picks skills fine
  without prompt-time nudging.
- The per-session state directory `~/.claude/clairvoyance/` is no longer
  used or written to. It was never cleaned up automatically, so if you ran
  earlier versions you can safely delete it.

### Added

- CI validation: a GitHub Actions workflow now runs
  `claude plugin validate --strict`, skill/agent frontmatter consistency
  checks (`scripts/check-skills.sh`), and a cross-manifest version-sync check
  on every PR touching skills or manifests — the class of check that would
  have caught 1.2.0's inert-`metadata:` frontmatter bug two releases earlier.
- `scripts/bump-version.sh`: sets the version across all 8 manifests that
  carry one (Claude, Codex, Cursor, Kimi, Gemini, npm, docs) from a single
  declarative list, with a `--check` mode used in CI.
- Marketplace entry metadata: `category`, `tags`, `homepage`, and
  `repository` for discoverability.

### Changed

- Tightened all 16 skill descriptions by ~20% (7,073 → 5,659 chars of
  context resident in every session's skill listing), keeping the
  "Use when…" triggers and "Not for X (use Y)" discriminators that drive
  routing while cutting duplicated clauses.

### Fixed

- Platform manifest versions (Codex, Cursor, Kimi, Gemini, docs site) had
  drifted to 1.2.0 while the Claude manifests said 1.3.0 — now synced via
  the new bump script.
- docs: the OpenCode install guide's version-pinning example no longer shows
  a stale tag.

## 1.2.0 — 2026-06-30

### Fixed

- **Skill frontmatter now actually takes effect.** All 16 `SKILL.md` files
  nested `allowed-tools` (and `design-it-twice` also `context`/`agent`) under
  an inert `metadata:` key, so tool pre-approval never applied and
  `design-it-twice` never forked to its clean-room subagent. Fields are now
  top-level; `design-it-twice` dispatches the `clean-room-alternative`
  subagent inline (via `Task`) instead of forking the whole skill, so the
  first design stays available to compare against — and its instructions now
  explain up front *why* isolation requires a real subagent (a design already
  in context contaminates the second attempt regardless of intent).
- Skill descriptions gained "Not for X (use Y)" disambiguation clauses;
  `deep-modules` and `pull-complexity-down` now cross-reference each other;
  restored three concrete detection examples in red-flags'
  `flag-interaction-map.md` that an earlier editing pass had flattened.
- Plugin/marketplace manifests: moved `$schema` URLs off a 404ing
  anthropic.com path onto the live schemastore.org schemas, removed
  unrecognized `metadata` nesting flagged by `claude plugin validate`, and
  switched the marketplace entry to a relative `./` source (avoids cloning
  the same repo twice at install).

### Added

- **Native plugin support for 7 more coding agents**, all sharing the same
  `skills/` directory as source of truth: Codex (real marketplace support on
  CLI ≥ 0.142.0), OpenCode (native git-sourced plugin, replacing the
  now-deprecated clone+symlink flow), Cursor (local-folder install), Gemini
  CLI (native extension with auto-discovery), and Antigravity — with Factory
  Droid, GitHub Copilot CLI, and Pi confirmed working off the existing
  layout with zero platform-specific files. README installation section
  rewritten with per-platform quick links.
- `design-review`: new "Reviewing at Scale" section and
  `references/workflow-builder.md`, mapping the five-phase funnel onto a
  parallel workflow script for codebase-wide or large-PR reviews, with
  adversarial verification of findings.

### Changed

- docs site: upgraded to Astro 7 (from 5.x) with fixes for the fonts config,
  a bundling-sensitive skills-directory resolution bug that silently broke
  every skill page, and three whitespace regressions; homepage and
  `llms.txt` platform mentions updated to match the multi-platform reality.

## 1.1.2 — 2026-03-01

### Changed

- Tightened the copy of 10 skills — trimmed redundant phrasing across
  `code-evolution`, `complexity-recognition`, `deep-modules`,
  `design-it-twice`, and six others (net −27 lines of skill text).

## 1.1.1 — 2026-02-28

### Fixed

- **Removed the model-prompt hooks on `Read|Grep` and `Write|Edit`** added in
  1.1.0 — firing a model evaluation on every file read caused rate-limit
  errors during rapid file operations.

### Added

- `prompt-keywords.sh`: keyword-triggered skill suggestions across 10 design
  topics with per-session deduplication (removed again in 1.3.0 — see above).
- `enter-plan-mode.sh`: nudges `design-it-twice` when entering plan mode
  (removed in 1.3.0).

### Changed

- docs site: WCAG contrast fixes, ARIA landmark and touch-target fixes,
  larger base font (18px), mobile pager/footer layout fixes; skills.sh
  install command corrected to `--skill '*'` (installs to detected agents
  only, rather than `--all`'s 41).

## 1.1.0 — 2026-02-27

### Added

- **Two new skills, bringing the set to 16**: `design-review` (orchestrates
  a structured five-phase design review) and `diagnose` (routes a vague
  symptom to the most relevant skill).
- `clean-room-alternative` agent: blind second-design generator backing
  `design-it-twice`'s isolation mode, plus a pre-mortem fallback reference.
- First hooks: Haiku-powered prompt hooks on `Write|Edit` and `Read|Grep`
  suggesting relevant skills during code changes and reads (replaced in
  1.1.1).
- **Docs site at clairvoyance.fyi**: landing page with demo replay viewer,
  per-skill pages with syntax highlighting and cross-links, skill catalog,
  XML sitemap, `llms.txt`/`llms-full.txt` endpoints, OG/social meta, privacy
  policy page, and a GitHub Actions deploy workflow.
- Multi-platform install documentation: `.codex/INSTALL.md`,
  `.opencode/INSTALL.md`, and a skills.sh install path alongside the Claude
  Code plugin marketplace.
- `red-flags`: new `flag-interaction-map.md` reference (replacing the report
  asset template).

### Changed

- Skill description and content updates across all 14 original skills;
  copy-as-markdown button fixed by embedding skill markdown in the page
  instead of fetching from GitHub at runtime.

## 1.0.0 — 2026-02-25

### Added

- Initial release: 14 agent skills grounded in *A Philosophy of Software
  Design* — `abstraction-quality`, `code-evolution`, `comments-docs`,
  `complexity-recognition`, `deep-modules`, `design-it-twice`,
  `error-design`, `general-vs-special`, `information-hiding`,
  `module-boundaries`, `naming-obviousness`, `pull-complexity-down`,
  `red-flags`, and `strategic-mindset` — packaged as a Claude Code plugin
  with a marketplace manifest.
