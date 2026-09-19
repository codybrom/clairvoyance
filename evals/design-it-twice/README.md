# design-it-twice evals

Measures whether `design-it-twice` produces two genuinely different designs, compared and then picked, compared with the same model without the plugin.

```bash
claude plugin eval . --eval-dir evals/design-it-twice --ablation with-without --judge-model sonnet
```

The headline number is Δ: the with-plugin score minus the without-plugin score.

## What counts as a failure

- **F1**: the two designs are semantically identical, or very similar under scrutiny (different names, same interface shape, state ownership, and decomposition).
- **F2**: one design plus suggestions for how it could change, presented as the second design.
- **F3**: B is A with one small change or with pieces bolted on.
- **F4**: one alternative is a strawman built to lose.

A third, synthesized design is fine, as long as A and B are different.

## Cases

| Case | Shape | Should fire |
| --- | --- | --- |
| 01-rate-limiter | explicit "design it twice" | yes |
| 02-plugin-api | implicit, before writing an interface | yes |
| 03-undo-redo | implicit, architecture question | yes |
| 04-retry-rfc | RFC design section | yes |
| 05-notif-prefs-canary | existing design in the prompt (isolation mode) | yes |
| 06-neg-pagination | bug fix, no interface change | no |
| 07-neg-rename | trivial rename | no |

Shared graders on 01-05: `two-distinct-designs` (F1/F3, weight 2), `peer-level-detail` (F2), `no-strawman` (F4), `grounded-pick`. Each case adds one or two problem-specific graders. `skill-fired` is display-only.

## Side-channel ceilings (per run)

| Cases | Cost | Latency | Turns |
| --- | --- | --- | --- |
| 01-03 | <= $0.60 | <= 300 s | <= 5 |
| 04 (RFC section, writes the most prose) | <= $0.90 | <= 300 s | <= 7 |
| 05 (dispatches the clean-room agent) | <= $1.20 | <= 600 s | <= 6 |
| 06-07 | <= $0.15 | <= 60 s | 1 |

A negative case that exceeds its ceiling usually means the skill over-fired.

## Baseline

This is v1.3.0, full run of 2026-09-19 at commit `02de4ab` (7 cases × 3 runs × 2 arms, Opus agent, Sonnet judge, `-j 4`; 62 minutes, $13.43). `02de4ab` and the merge commit `b55f118` have identical skill files.

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-rate-limiter | 1.00 | 0.95 | +0.05 | 3/3 |
| 02-plugin-api | 0.94 | 0.22 | **+0.72** | 3/3 |
| 03-undo-redo | 1.00 | 0.56 | **+0.44** | 3/3 |
| 04-retry-rfc | 0.90 | 0.29 | **+0.62** | 3/3 |
| 05-notif-prefs-canary | 1.00 | 0.33 | **+0.67** | 3/3 |
| 06-neg-pagination | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| 07-neg-rename | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| **Mean** | | | **+0.36** | |

Before the fixes in #10, the mean Δ was +0.18 or lower across four earlier runs. Two things changed:

- **01-rate-limiter was negative** (−0.11 and −0.44 in the two earlier 3-run baselines): the with-plugin arm scored *below* no-plugin. It dispatched the clean-room agent on a design it had drafted itself, and the two designs converged (#6). Scoping isolation mode to a user- or codebase-supplied design fixed it. The traces confirm the mechanism: 01 now runs `Skill → Glob → Glob` with no agent dispatch, while 05, which does have a supplied design, still runs `Skill → Agent:clean-room-alternative → Glob → Glob`.
- **04-retry-rfc never fired** (0/3) and scored 0.29. Adding RFC / design-doc / ADR phrasing to the description (#5) plus the equal-depth-alternatives rule in the procedure took it to 3/3 and 0.90.

How to read it:

- **No headroom left on 01.** Plain Opus handles the explicit "design it twice" ask well on its own; the uplift lives in the implicit cases.
- **The isolation canary is working.** 05 is the only case that dispatches the agent, and it does so in 3/3 runs.
- A single run on one case can swing by about ±0.1. Compare means across full runs.

## When to re-run

Re-run after any change to `skills/design-it-twice/SKILL.md`, `agents/clean-room-alternative.md`, `references/pre-mortem-fallback.md`, or to the description of a skill that competes for the same triggers (`strategic-mindset`, `code-evolution`). When the numbers move, update the table above.
