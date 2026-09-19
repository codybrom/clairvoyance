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
| 01-04 | <= $0.60 | <= 300 s | <= 5 |
| 05 (dispatches the clean-room agent) | <= $1.20 | <= 600 s | <= 6 |
| 06-07 | <= $0.15 | <= 60 s | 1 |

A negative case that exceeds its ceiling usually means the skill over-fired.
