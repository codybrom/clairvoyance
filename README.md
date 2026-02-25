# Clairvoyance

Clairvoyance is a set of agent skills and commands inspired by John Ousterhout's *A Philosophy of Software Design*. Each skill focuses on one design dimension (module depth, information hiding, error handling, etc.) and suggests concrete tests and decision criteria to apply during code review and implementation.

The goal is to get your agent to write software the way Ousterhout argues it should be written: strategically, with deep modules, clean abstractions, and relentless simplicity. Instead of applying these principles yourself after the fact, Clairvoyance nudges agents to bake them into the code as it's being written.

## How It Works

Each skill teaches your agent to ask a specific question. Does this interface hide real complexity, or just pass things through? Can this method be understood without reading another one in a different file? Is error handling pushing work onto callers that the module could handle itself?

Skills activate on their own when they're relevant. Every skill is also a slash command. Use `/red-flags` to trigger a scan for design smells, `/deep-modules` to check interface depth, `/design-it-twice` to compare alternatives before advancing.

## Installation

```bash
/plugin marketplace add codybrom/clairvoyance
/plugin install clairvoyance@clairvoyance-plugins
```

## What's Inside

### Structure & Modules

| Skill | Covers |
| --- | --- |
| `deep-modules` | Module depth, shallow modules, classitis, pass-through methods, interface vs implementation |
| `module-boundaries` | Merge vs split, conjoined methods, method splitting, dependency minimization |
| `information-hiding` | Information leakage, temporal decomposition, partial hiding, false encapsulation |
| `pull-complexity-down` | Caller burden, configuration parameters, the core asymmetry |

### Abstraction & Generality

| Skill | Covers |
| --- | --- |
| `abstraction-quality` | Genuine vs false abstractions, layer boundaries, decorators |
| `general-vs-special` | Interface generality, special-general mixture, edge-case elimination |
| `error-design` | Define errors out of existence, exception masking, aggregation, just crash |

### Clarity & Communication

| Skill | Covers |
| --- | --- |
| `naming-obviousness` | Isolation test, scope-length principle, consistency, avoid extra words |
| `comments-docs` | Comment types, comments-first workflow, cross-module documentation |

### Process & Evolution

| Skill | Covers |
| --- | --- |
| `strategic-mindset` | Strategic vs tactical, investment rule, tactical tornado |
| `design-it-twice` | Generate alternatives, compare on criteria, synthesize |
| `code-evolution` | "Designed this way" standard, repetition, technical debt |
| `complexity-recognition` | Change amplification, cognitive load, unknown unknowns |

### Diagnostic

| Skill | Covers |
| --- | --- |
| `red-flags` | Design smell scan covering structure, boundaries, documentation, naming, and process |

## Attribution

The design principles, terminology, and concepts in these skills are based on
[*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd.php)
(2nd Edition) by [John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/home.php),
professor of computer science at Stanford University.

This project is not affiliated with, endorsed by, or sponsored by John Ousterhout or Stanford University. This project contains independently authored review frameworks that operationalize Ousterhout's ideas for use by AI coding agents. Brief quotations from the book are used with full attribution for commentary and criticism purposes only. All trademarks and copyrights are the property of their respective owners.

**If you find these skills useful, you should really buy the book.** It is the definitive treatment of these ideas and an enjoyable read for any dev. The skills in this repo are by no means a substitute for reading it. Available from [Amazon](https://www.amazon.com/dp/173210221X)
(no affiliate link). Also available in
[German](https://www.oreilly.com/library/view/prinzipien-des-softwaredesigns/9781098130053/)
(O'Reilly, 2021) and
[Chinese](https://item.jd.com/14328323.html)
(Posts and Telecommunications Press, 2024).

## Contributing

Contributions are welcome — bug reports, new skills, improvements to existing
ones. Please open an issue or pull request on
[GitHub](https://github.com/codybrom/clairvoyance).

## License

[MIT License](LICENSE) © 2026 [Cody Bromley](https://github.com/codybrom)
