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
- A full run (6 cases × 3 runs × 2 arms) uses about $17 of API-equivalent tokens and takes about 13 minutes with `-j 4`. `design-review` runs use more turns than a single-lens skill.

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
- **`no-phantom-code` (weight 0.33).** Fails only on references to code that doesn't exist. It uses `focus: trace` so the judge can see the provided code.
- **`skill-fired`.** A display-only check that `design-review` was invoked. It's reported but never scored.

## Baseline

This is v1.3.0, 2026-09-19 (3 runs × 2 arms, Opus agent, Sonnet judge). Case 04 is from its re-run after its fixture and rubric were fixed.

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-orders-module | 0.86 | 0.86 | 0.00 | 3/3 |
| 02-pr-diff | 1.00 | 0.95 | +0.05 | 3/3 |
| 03-cluster | 0.86 | 0.57 | **+0.29** | 3/3 |
| 04-clean-go | 1.00 | 0.71 | **+0.29** | 3/3 |
| 05-clean-py | 1.00 | 1.00 | 0.00 | 3/3 |
| 06-neg-rename | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| **Mean** | | | **+0.10** | |

How to read it:

- **The uplift is in 03 and 04.** Without the plugin, the answer leads with separate symptoms instead of the shared cause (03: 0/3 runs). It also frames clean code as "design gaps, ranked" or asks whether to replace the code with a library (04: 2 of 3 runs fail).
- **01 and 02 have no headroom.** Plain Opus already puts a clear boundary leak above naming nits.
- **05 has no headroom either.** Neither arm padded `slugify`.
- **The skill fires reliably** on explicit "design review / design assessment" phrasing, unlike `red-flags` on "review this diff" (#4).

## When to re-run

Re-run after any change to `skills/design-review/SKILL.md` or to the lens skills it orchestrates. When the numbers move, update the table above.
