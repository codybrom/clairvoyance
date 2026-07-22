---
name: design-it-twice
description: "Generates and compares at least two fundamentally different design alternatives on concrete criteria before committing. Use when the user asks to design something twice, or before committing to any significant design of classes, modules, APIs, or architecture. Not for judging strategic vs. tactical investment in existing code (use strategic-mindset) or whether a change degrades design (use code-evolution)."
argument-hint: "[description of the design problem]"
allowed-tools: Read, Grep, Task
---

# Design It Twice

When invoked with $ARGUMENTS, treat the argument as the design problem to explore. Do not assume a solution. Start from the problem statement and generate at least two fundamentally different approaches independently. If a design already exists in the conversation or codebase, dispatch the `clean-room-alternative` agent (see Isolation Mode below) rather than trying to produce a second attempt yourself — a design already sitting in your context contaminates anything you write next, no matter how deliberately you try to ignore it. Then compare all approaches on concrete criteria.

**This skill has two modes.** Before a design exists, use it to generate and compare alternatives directly. After a design exists, dispatch the isolated agent described below to produce an independent second attempt that isn't anchored to the first. Either way, the first idea is unlikely to produce the best design, not because the designer isn't smart, but because the problems are genuinely hard.

## When to Apply

- Before committing to a class, module, or API design
- When choosing between architectural approaches
- When an interface feels awkward but "good enough"
- When writing a design document or RFC
- When you catch yourself thinking "this is obviously the right way"

## When NOT to Apply

- Trivial decisions with negligible consequences
- Well-established patterns where the design space is explored
- Bug fixes that don't change the interface
- Cost of the exercise should be proportional to cost of getting the design wrong

## The Procedure

1. **Generate at least two fundamentally different approaches**, not variations on one idea. If both share an interface shape, they're variations. Push until the second makes you uncomfortable.

2. **Compare the designs on concrete criteria:**
   - **Caller ease-of-use**: Which requires less work from higher-level code? (primary criterion)
   - **Interface simplicity**: Which is easier to learn and use?
   - **Generality**: Which handles more use cases without special-casing?
   - **Implementation complexity**: Which is easier to get right?
   - **Performance characteristics**: Are there meaningful performance differences?

3. **Choose or synthesize**: Comparing two weak designs may reveal a shared weakness that points at a third, stronger design neither suggested directly. **When no alternative is attractive,** use the problems you identified to drive a new design. If both alternatives force callers to do extra work, that's a signal the abstraction level is wrong.

### Applies at Multiple Levels

Use for interfaces first, then again for implementation (where simplicity and performance matter most), and again at system level (module decomposition, feature design). Different levels, different criteria, but always more than one option.

## Why It Works

When you only have one design, its strengths are invisible and its weaknesses look like inherent constraints. A second design breaks that illusion by making trade-offs visible. Documenting the alternatives you considered also prevents future maintainers from revisiting rejected or failed approaches.

Recording rejected alternatives and why they were rejected — in the design doc, commit message, or PR description — means a future agent invocation (which starts with an empty context window) gets the comparison for free instead of re-deriving it from scratch.

### The Smart People Trap

The first design generated anchors everything after it — once a finished design sits in context, it contaminates the comparison the same way a finished implementation contaminates a rewrite. Pushing past that anchor is what produces the stronger second design.

> "It isn't that you aren't smart; it's that the problems are really hard!" — John Ousterhout, _A Philosophy of Software Design_

Forcing technique: "Suppose you may not implement your first idea. What would be your second approach?" The second idea, when forced, is consistently better.

## Isolation Mode

When a design already exists in the conversation or codebase, the second alternative should be generated in a clean-room context. Use the `clean-room-alternative` agent to produce the second design in isolation.

#### Dispatch the agent with

1. The problem statement from $ARGUMENTS
2. Relevant file paths the agent should read for context

#### The agent receives

- The problem statement
- Access to the codebase via Read, Grep, Glob

#### The agent should NOT receive

- The first design
- Conversation history containing the first design
- Any indication of what approaches to avoid

After the agent returns its design, compare both approaches using the criteria in "The Procedure" above. The value is in the comparison, not in either design alone.

### Fallback (No Agent Available)

If your runtime does not support agents, use the design pre-mortem technique from `references/pre-mortem-fallback.md` to force a structurally different alternative without clean-room isolation.

## Time Cost

Sketching and comparing two alternatives costs a small fraction of the tokens a full implementation consumes — and far less than the tokens spent debugging, then re-implementing, a flawed first design. The ratio holds: exploration is on the order of a few percent of implementation cost, with disproportionate return.

## Review Process

1. **Check for alternatives**: Was more than one genuinely different design considered? Was the reasoning for rejecting alternatives documented?
2. **Evaluate comparison quality**: Concrete criteria used, or gut feel?
3. **Look for shared weaknesses**: Do alternatives share a flaw pointing at a better design?
4. **Assess proportionality**: Depth of exploration proportional to decision's impact?
5. **Check for synthesis**: Could the best elements be combined?

Red flag signals for design comparison are cataloged in **red-flags** (No Alternatives Considered).
