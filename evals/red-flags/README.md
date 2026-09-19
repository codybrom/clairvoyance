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

This is v1.3.0, full run of 2026-09-19 at commit `ad561ff` (10 cases × 3 runs × 2 arms, Opus agent, Sonnet judge, `-j 4`; 18 minutes, $20.89).

| Case | With | Without | Δ | Skill fired (with) |
|---|---|---|---|---|
| 01-scan-orders | 1.00 | 0.79 | +0.21 | 3/3 |
| 02-inherited-billing | 1.00 | 0.93 | +0.07 | 3/3 |
| 03-diff-review | 0.93 | 0.79 | +0.14 | 3/3 |
| 04-pasted-ts | 1.00 | 0.79 | +0.21 | 3/3 |
| 05-checklist-cache | 1.00 | 0.70 | +0.30 | 3/3 |
| 06-neg-keyerror | 1.00 | 1.00 | 0.00 | 0/3 (correct) |
| 07-units-leak | 1.00 | 1.00 | 0.00 | 3/3 |
| 08-buried-passthrough | 0.91 | 0.12 | **+0.79** | 3/3 |
| 09-layered-function | 1.00 | 0.64 | +0.36 | 3/3 |
| 10-caller-retries | 0.97 | 0.91 | +0.06 | 3/3 |
| **Mean** | | | **+0.22** | |

Every should-fire case now fires 3/3, and the negative case still fires nothing. Two earlier baselines for comparison: mean Δ +0.13 at `55e986a` (before #10), +0.20 at `97dedce` (after #10, before #9).

How to read it:

- **Where the uplift comes from.** Plain Opus catches most of the individual planted smells. The gap is mostly `root-cause`: with the plugin, the answer ties its findings to a shared design cause far more often.
- **08 is where #9 paid off.** "Anything off in this user service?" went from 0/3 fired and Δ +0.18 to 3/3 and Δ **+0.79**, the largest in the suite. Without the plugin both arms used to go bug-hunting and miss the planted pass-throughs; now only the no-plugin arm does (0.12).
- **09 was already scoring well before it fired.** It sat at 0.91 with 0/3 fired, because the skill descriptions steer the answer just by sitting in context. Now it fires 3/3 and scores 1.00.
- **The with-arm is at or above 0.91 on all ten cases.** Remaining Δ movement is mostly the no-plugin arm bouncing, not the plugin regressing: 03 fell from +0.60 to +0.14 only because its without-arm jumped 0.26 → 0.79, while its with-arm rose 0.86 → 0.93. Same story on 07. The suite is close to its measurement ceiling; harder cases would buy more signal than re-reading these deltas.
- A single run on one case can swing by about ±0.1. Compare means across full runs.

## When to re-run

Re-run after any change to `skills/red-flags/SKILL.md`, or to the description of a skill that competes for the same triggers (`code-evolution`, `design-review`, `complexity-recognition`). When the numbers move, update the baseline table above.
