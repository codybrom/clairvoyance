# Building a Design Review Workflow

How to turn the five-phase funnel in SKILL.md into a Dynamic Workflow script, for reviews too large to run once per file in a single conversation.

## The Mapping

The funnel is already phase-shaped. Each phase becomes a workflow stage, not a rewrite:

- **Phase 1 (Complexity Triage)** → the fan-out stage. One agent per file or module, run concurrently, applying only the complexity-recognition checks. This is deliberately cheap and broad: its job is to rank targets, not diagnose them.
- **Phases 2-4 (Structural, Interface, Surface)** → the deep-dive stage. Runs only on targets Phase 1 flagged (or, if nothing was flagged anywhere, the largest or most-connected targets — same early-termination logic as the single-target funnel, just applied per target instead of once).
- **Phase 5 (Red Flags Sweep) + Prioritization** → the verification and synthesis stage. This is where findings get challenged and ranked, not just collected.

## Structure It as a Pipeline, Not a Barrier

Use a pipeline over targets, not a `parallel()` triage pass followed by a separate `parallel()` deep-dive pass. A file that triages clean should exit immediately; a file that triages dirty should move straight into its deep-dive while other files are still being triaged. Waiting for every file to finish triage before starting any deep-dive wastes exactly the wall-clock this exercise exists to save.

A barrier is justified in exactly one place: before final synthesis, since prioritization (syndrome clusters, boundary issues, canary flags) requires comparing findings across the whole target set, not just within one file.

## Adversarial Verification

A design-quality finding is a judgment call, not a compile error. "Getter/setter exposing internal state" can be a real information leak or a defensible choice given the module's actual callers. Treat every candidate finding from the deep-dive stage as a claim to be challenged, not a fact to be reported:

- Spawn 2-3 independent agents per finding, each asked to argue it's *not* real given the surrounding code (is there a caller that genuinely needs this, a constraint that makes the "shallow" module unavoidably shallow, a reason the exception count is justified).
- Keep a finding only if a majority survive the challenge.
- This matters more here than in a typical bug-finding workflow: correctness bugs are usually binary, design smells are contextual, and an unverified sweep will over-report defensible code as broken.

## Scale and Cost

Don't spawn one agent per file on a codebase with thousands of files. Batch the triage stage by directory or module, and only descend to per-file granularity for targets the batch already flagged as worth a closer look. If the run bounds coverage in any way (skipping generated code, sampling a subset, capping directory depth), say so in the final report — a design review that silently skipped half the codebase is worse than one that says what it skipped and why.

## Skeleton

The shape, not exact syntax (this evolves; match whatever workflow-scripting conventions your current session actually exposes):

```text
phase('Triage')
targets = list of files/modules to review (batched, not necessarily one-per-file)
triageResults = pipeline(
  targets,
  target => agent(apply complexity-recognition to `target`, return ranked signal),
)

phase('Deep dive')
flagged = triageResults.filter(has a signal worth investigating)
deepDiveResults = pipeline(
  flagged,
  target => agent(apply structural + interface + surface lenses to `target`, return candidate findings),
)

phase('Verify')
verified = pipeline(
  deepDiveResults.flatMap(findings),
  finding => parallel of 2-3 challenger agents arguing it's not real,
    keep if majority disagree with the challenge
)

phase('Synthesize')
one final agent: dedupe verified findings, group into syndrome clusters,
apply the Prioritization ranking from SKILL.md, write the report
```

## Fallback

If Dynamic Workflows aren't available in this session (older Claude Code, a session with workflows disabled, or a different platform entirely), fall back to running the funnel from SKILL.md per file or module in sequence. Same phases, same prioritization, just slower and without adversarial verification — same tradeoff `design-it-twice` makes with its `references/pre-mortem-fallback.md` when subagents aren't available.
