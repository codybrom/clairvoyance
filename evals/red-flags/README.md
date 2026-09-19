# Evals

Eval suite for the `red-flags` skill, run with `claude plugin eval`. Every case runs twice: once with Clairvoyance installed and once without. The headline number is **Δ**: the with-plugin score minus the without-plugin score. It measures the uplift the plugin gives, not the raw pass rate.

## Run

```bash
claude plugin eval . --eval-dir evals/red-flags --ablation with-without --judge-model sonnet
```

- Add `--no-publish` to keep the report local. Reports go to `evals/red-flags/results/`, which is gitignored.
- Add `--case '05-*'` to run a single case. Only `*` wildcards work; bracket and brace patterns don't.
- Add `-j 4` to run up to 4 runs at once. They share your rate limit.
- Every case pins the agent to `model: opus`. Keep the judge on a different model (`sonnet`) so it never grades its own model's answers.
- A full run (10 cases × 3 runs × 2 arms) costs **about $16** of API-equivalent tokens, $4 of it judging. An earlier run cost $42, $31 of it judging, because a `no-phantom-code` grader sent the whole transcript to the judge; that grader has been removed. On a claude.ai login, this comes out of your subscription usage.

## Cases

| Case | Shape | Planted smells |
|---|---|---|
| `01-scan-orders` | Explicit "red flags scan", Python | pass-through, one-use boolean flag, catch-and-ignore |
| `02-inherited-billing` | "Inherited this, anything off?", 3 files | temporal decomposition, CSV-format leakage, duplicated date logic |
| `03-diff-review` | "Review this diff before I merge" | growing param list, partner-only branches in shared `validate`, welcome-email override |
| `04-pasted-ts` | "Does this look well-designed?", TypeScript | shallow getter/setter class, comments restating code, vague names |
| `05-checklist-cache` | "Check against a design smell checklist", Go | overexposed constructor, conjoined `Prepare`/`Commit` |
| `06-neg-keyerror` | Bug fix: should **not** trigger a design review | none |
| `07-units-leak` | Two-file scan | `backoff()` returns seconds, `client.py` treats it as ms: a unit the interface doesn't carry |
| `08-buried-passthrough` | "Anything off in this user service?", about 150 lines | pass-through buried among real methods; caching decorator forwarding 5 of 6 methods |
| `09-layered-function` | "Take a look at `compute_price`" | special cases piled into a general function; hard to describe |
| `10-caller-retries` | Four call sites plus the client | identical retry loop at every caller; the client should absorb it |

The code for each case is inlined in its prompt. The prompts don't hint at the smells, so the baseline has to find them on its own.

## Graders

- **One grader per planted smell (weight 1).** Did the answer find it, in design terms?
- **`root-cause` (weight 1).** Does the answer tie its findings to one shared design cause, rather than listing them as independent issues? This grader carries most of the uplift.
- **`headline-not-generic`, `design-outweighs-generic` (weight 0.33 each).** These penalize generic review noise (style, types, tests, perf). Stretched or debatable flags aren't penalized. Hallucinated code is rare and isn't scored; spot-check by hand.
- **`skill-fired`.** A display-only trigger check. It's reported but never scored.
- **Negative case:** a correct fix, no flag-report structure (regex), and the answer stays on the bug.

## Baseline

This is v1.3.0, full run of 2026-09-19 at commit `97dedce` (10 cases × 3 runs × 2 arms, Opus agent, Sonnet judge, `-j 4`; 76 minutes, $15.85). The skill files at that commit are identical to `b55f118`, so this baseline holds for the merge commit too.

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-scan-orders | 1.00 | 0.86 | +0.14 | 3/3 |
| 02-inherited-billing | 1.00 | 0.93 | +0.07 | 3/3 |
| 03-diff-review | 0.86 | 0.26 | +0.60 | 3/3 |
| 04-pasted-ts | 1.00 | 0.76 | +0.24 | 3/3 |
| 05-checklist-cache | 1.00 | 0.73 | +0.27 | 3/3 |
| 06-neg-keyerror | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| 07-units-leak | 1.00 | 0.80 | +0.20 | 3/3 |
| 08-buried-passthrough | 0.36 | 0.18 | +0.18 | **0/3** |
| 09-layered-function | 0.91 | 0.61 | +0.30 | **0/3** |
| 10-caller-retries | 1.00 | 1.00 | 0.00 | 3/3 |
| **Mean** | | | **+0.20** | |

Previous baseline (commit `55e986a`, before the trigger fixes in #10) had a mean Δ of +0.13, with 03 at +0.12 and 08 at −0.12.

How to read it:

- **Where the uplift comes from.** Plain Opus catches most of the individual planted smells. The gap is mostly `root-cause`: with the plugin, the answer ties its findings to a shared design cause far more often.
- **Case 03 is fixed.** "Review this diff before I merge" now fires 3/3 after `code-evolution` took ownership of diff review (#4). Its Δ went from +0.12 to +0.60.
- **Cases 08 and 09 are the remaining trigger gap (#9).** "Anything off in this user service?" and "Take a look at `compute_price`" fire nothing. 09 regressed from 1/3 to 0/3 when the #10 wording made the red-flags triggers more explicit-ask shaped.
- **09 scores well anyway** (0.91 with, 0.61 without, at 0/3 fired). The skill descriptions appear to steer the answer just by sitting in context. Treat its Δ as evidence about context, not about the skill body.
- **08 is where quality is actually lost.** Both arms go bug-hunting and miss the planted pass-throughs.
- A single run on one case can swing by about ±0.1. Compare means across full runs. If Δ jumps sharply with no plugin change behind it, spot-check the answers by hand before trusting it.

## When to re-run

Re-run after any change to `skills/red-flags/SKILL.md`, or to the description of a skill that competes for the same triggers (`code-evolution`, `design-review`, `complexity-recognition`). When the numbers move, update the baseline table above.
