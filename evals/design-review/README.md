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

This is v1.3.0, full run of 2026-09-19 at commit `ad561ff` (6 cases × 3 runs × 2 arms, Opus agent, Sonnet judge, `-j 4`; 9 minutes, $8.48).

| Case | With | Without | Δ | design-review fired |
|---|---|---|---|---|
| 01-orders-module | 1.00 | 0.83 | +0.17 | 3/3 |
| 02-pr-diff | 1.00 | 1.00 | 0.00 | 3/3 |
| 03-cluster | 0.67 | 0.67 | 0.00 | 3/3 |
| 04-clean-go | 1.00 | 0.50 | **+0.50** | 3/3 |
| 05-clean-py | 0.50 | 0.67 | −0.17 | **2/3** |
| 06-neg-rename | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| **Mean** | | | **+0.08** | |

Earlier baselines: +0.11 before #10, +0.08 after #10. The mean has been flat while individual cases swing, so read the cases, not the mean.

How to read it:

- **04-clean-go's earlier regression was noise.** It read 0.50/0.50 in the post-#10 run and recovered to 1.00/0.50 here with no change behind it. A single 3-run case delta on this suite can swing a full 0.50; do not act on one.
- **05-clean-py is a real misroute, not noise.** A traced re-run (1 case, 3 runs, $1.58) came back 0.83/0.83, Δ 0.00, but the traces show why the number moves: in 1 of 3 runs `red-flags` fires instead of `design-review` on "Review the design of slugify.py", pads the clean file, and scores 0.50. The other two fire `design-review` and score 1.00. The #9 exclusion has since been narrowed to key on a missing review goal rather than on "a single file or function", which should stop the steal — **unvalidated as of this baseline**.
- **Note what `skill-fired` measures here.** This suite's grader carries `input_match: design-review`, so the column above counts *this* skill, not any skill. The `red-flags` suite's grader has no `input_match` and counts any skill call. The two columns are not comparable.
- **02 has no headroom.** Plain Opus already puts a clear boundary leak above naming nits.
- **03-cluster is the standing weak case.** `shared-cause-headline` fails 3/3 in both arms: neither arm leads with the shared cause.

## When to re-run

Re-run after any change to `skills/design-review/SKILL.md`, to the lens skills it orchestrates, or to `skills/red-flags/SKILL.md`, which competes for the same single-file prompts. When the numbers move, update the table above.
