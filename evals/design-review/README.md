# design-review evals

Eval suite for the `design-review` skill. Every case runs twice: once with Clairvoyance installed and once without. The headline number is **Δ**: the with-plugin score minus the without-plugin score.

## Run

```bash
claude plugin eval . --eval-dir evals/design-review --ablation with-without --judge-model sonnet
```

- Add `--no-publish` to keep the report local. Reports go to `evals/design-review/results/`, which is gitignored.
- Add `--case '04-*'` to run a single case. Only `*` wildcards work.
- Add `-j 4` to run up to 4 runs at once. They share your rate limit.
- Every case pins the agent to `model: opus`. Keep the judge on a different model (`sonnet`).
- A full run (6 cases × 3 runs × 2 arms) costs **about $8** of API-equivalent tokens, under $1 of it judging. An earlier run cost $17, much of it from a `no-phantom-code` grader that sent the whole transcript to the judge; that grader has been removed.

## What it measures

`design-review` should give **one prioritized assessment**: shared root causes first, then boundary issues, with naming and comments last. When the code is fine, it should say so and **not invent structural problems**. Padding clean code is the failure users notice most.

| Case | Shape | What it tests |
|---|---|---|
| `01-orders-module` | Full review of a module | The duplicated payment-payload format (a boundary issue) is ranked above naming and comment nits |
| `02-pr-diff` | Prioritized PR assessment | The `_prefs_json` encapsulation leak is ranked first; the vague name `tmp2` comes lower |
| `03-cluster` | Three modules | The headline is the one shared cause (the session format has no owner), and the symptoms are tied to it |
| `04-clean-go` | Clean token-bucket limiter | Verdict is sound; recommends no restructuring; invents no structural problems |
| `05-clean-py` | Clean `slugify` | Same as 04, in a different language and shape |
| `06-neg-rename` | "Rename this function" | Should **not** trigger a review: just the rename |

## Graders

- **Ranking graders (01–03).** Is the structural finding present, and is it ranked above surface findings? For 03: is the shared cause the headline?
- **`clean-verdict` (04–05).** Judged on what the answer *recommends*, not on how it labels things. Adding a method, validation, edge-case fixes, and comments all count as local changes. Only splitting or merging modules, replacing the core approach, or replacing the code with a library counts as restructuring.
- **`no-padding` (04–05).** Fails only on claimed *structural* problems the code doesn't have. Real edge-case findings are never padding.
- **`skill-fired`.** A display-only check that `design-review` was invoked. It's reported but never scored.

## Baseline

This is v1.3.0, full run of 2026-09-19 at commit `97dedce` (6 cases × 3 runs × 2 arms, Opus agent, Sonnet judge, `-j 4`; 38 minutes, $7.91). The skill files at that commit are identical to `b55f118`, so this baseline holds for the merge commit too. Hallucinated code is rare and isn't scored; spot-check by hand.

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-orders-module | 1.00 | 0.83 | +0.17 | 3/3 |
| 02-pr-diff | 1.00 | 1.00 | 0.00 | 3/3 |
| 03-cluster | 0.67 | 0.50 | +0.17 | 3/3 |
| 04-clean-go | 0.50 | 0.50 | 0.00 | 3/3 |
| 05-clean-py | 0.83 | 0.67 | +0.17 | 3/3 |
| 06-neg-rename | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| **Mean** | | | **+0.08** | |

Previous baseline (recomputed from an earlier run, before the trigger fixes in #10) had a mean Δ of +0.11, with 03 and 04 both at +0.33.

How to read it:

- **This suite did not gain from #10, and 04 lost its uplift.** `04-clean-go` sits at 0.50 in both arms, down from 1.00 / 0.67. The with-arm regression is the one to chase: the #10 edit narrowed the description to "comprehensive or prioritized design assessment" and pushed plain diff review to `code-evolution`, which may have cost the padding restraint that 04 grades. One 3-run delta is inside the ±0.1 noise band, so confirm with a re-run before acting on it.
- **The uplift is now spread thin** (+0.17 on three cases) rather than concentrated in 03 and 04.
- **02 has no headroom.** Plain Opus already puts a clear boundary leak above naming nits.
- **The skill fires reliably** on explicit "design review / design assessment" phrasing, and correctly stays out of the rename case. It is not a candidate owner for the open-ended "anything off?" prompts in #9 — see `evals/red-flags/README.md`.

## When to re-run

Re-run after any change to `skills/design-review/SKILL.md` or to the lens skills it orchestrates. When the numbers move, update the table above.
