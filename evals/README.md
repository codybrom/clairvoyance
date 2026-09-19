# Evals

Eval suite for the `red-flags` skill, run with `claude plugin eval`. Every case runs twice: once with Clairvoyance installed and once without. The headline number is **Δ**: the with-plugin score minus the without-plugin score. It measures the uplift the plugin gives, not the raw pass rate.

## Run

```bash
claude plugin eval . --ablation with-without --judge-model sonnet
```

- Add `--no-publish` to keep the report local. Reports go to `evals/results/`, which is gitignored.
- Add `--case '05-*'` to run a single case.
- Every case pins the agent to `model: opus`. Keep the judge on a different model (`sonnet`) so it never grades its own model's answers.
- A full run (6 cases × 3 runs × 2 arms) takes about 40 minutes and uses about $9–10 of API-equivalent tokens. On a claude.ai login, this comes out of your subscription usage.

## Cases

| Case | Shape | Planted smells |
|---|---|---|
| `01-scan-orders` | Explicit "red flags scan", Python | pass-through, one-use boolean flag, catch-and-ignore |
| `02-inherited-billing` | "Inherited this, anything off?", 3 files | temporal decomposition, CSV-format leakage, duplicated date logic |
| `03-diff-review` | "Review this diff before I merge" | growing param list, partner-only branches in shared `validate`, welcome-email override |
| `04-pasted-ts` | "Does this look well-designed?", TypeScript | shallow getter/setter class, comments restating code, vague names |
| `05-checklist-cache` | "Check against a design smell checklist", Go | overexposed constructor, conjoined `Prepare`/`Commit` |
| `06-neg-keyerror` | Bug fix: should **not** trigger a design review | none |

The code for each case is inlined in its prompt. The prompts don't hint at the smells, so the baseline has to find them on its own.

## Graders

- **One grader per planted smell (weight 1).** Did the answer find it, in design terms?
- **`root-cause` (weight 1).** Does the answer tie its findings to one shared design cause, rather than listing them as independent issues? This grader carries most of the uplift.
- **`headline-not-generic`, `design-outweighs-generic`, `no-phantom-code` (weight 0.33 each).** These penalize generic review noise (style, types, tests, perf) and references to code that doesn't exist. Stretched or debatable flags aren't penalized.
- **`skill-fired`.** A display-only trigger check. It's reported but never scored.
- **Negative case:** a correct fix, no flag-report structure (regex), and the answer stays on the bug.

## Baseline

This is v1.3.0, full run of 2026-09-19 (3 runs × 2 arms, Opus agent, Sonnet judge):

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-scan-orders | 1.00 | 0.91 | +0.09 | 3/3 |
| 02-inherited-billing | 1.00 | 0.93 | +0.07 | 3/3 |
| 03-diff-review | 0.73 | 0.67 | +0.07 | **0/3** |
| 04-pasted-ts | 0.93 | 0.82 | +0.11 | 2/3 |
| 05-checklist-cache | 0.97 | 0.83 | +0.14 | 3/3 |
| 06-neg-keyerror | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| **Mean** | | | **+0.08** | |

How to read it:

- **Where the uplift comes from.** Plain Opus catches most of the individual planted smells. The gap is `root-cause`: with the plugin, the answer ties its findings to a shared design cause almost every time; without it, about half the time.
- **Case 03 is noise.** No Clairvoyance skill fires on "review this diff before I merge" (#4), so its Δ says nothing about the plugin.
- **Case 04's one with-arm miss** happened in the run where the skill didn't fire. Trigger reliability on "Does this look well-designed?" is part of what this case measures.
- **Case 05 was re-run after the baseline.** `no-phantom-code` was tightened to make the judge classify each unknown name before giving a verdict. After that change it passed 6/6, and the case scored with 1.00, without 0.83, Δ +0.17.
- A single run on one case can swing by about ±0.1. Compare means across full runs, not single pilots. If Δ jumps sharply with no plugin change behind it, spot-check the answers by hand before trusting it.

## When to re-run

Re-run after any change to `skills/red-flags/SKILL.md`, or to the description of a skill that competes for the same triggers (`code-evolution`, `design-review`, `complexity-recognition`). When the numbers move, update the baseline table above.
