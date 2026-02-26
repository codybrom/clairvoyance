# Clairvoyance

Clairvoyance is a set of agent skills and commands inspired by John Ousterhout's *A Philosophy of Software Design*. Each skill focuses on one design dimension (module depth, information hiding, error handling, etc.) and suggests concrete tests and decision criteria to apply during code review and implementation.

The goal is to get your agent to write software the way Ousterhout argues it should be written: strategically, with deep modules, clean abstractions, and relentless simplicity. Instead of applying these principles yourself after the fact, Clairvoyance nudges agents to bake them into the code as it's being written.

## How It Works

Each skill teaches your agent to ask specific questions.

- *Does this interface hide real complexity, or just pass things through?*
- *Can this method be understood without reading another one in a different file?*
- *Is error handling pushing work onto callers that the module could handle itself?*

Skills activate automatically when relevant, or you can invoke them directly as slash commands: `/red-flags` for a design smell scan, `/deep-modules` to check interface depth, `/design-it-twice` to compare alternatives before committing.

## Installation

Installation differs by platform. Claude Code has a built-in plugin marketplace. Codex and OpenCode require manual setup.

### Claude Code (via Plugin Marketplace)

```bash
/plugin marketplace add codybrom/clairvoyance
/plugin install clairvoyance@clairvoyance-plugins
```

### skills.sh

```bash
npx skills add codybrom/clairvoyance
```

### Codex

Tell Codex:

```txt
Fetch and follow instructions from https://raw.githubusercontent.com/codybrom/clairvoyance/refs/heads/main/.codex/INSTALL.md
```

See [.codex/INSTALL.md](.codex/INSTALL.md) for detailed steps.

### OpenCode

Tell OpenCode:

```txt
Fetch and follow instructions from https://raw.githubusercontent.com/codybrom/clairvoyance/refs/heads/main/.opencode/INSTALL.md
```

See [.opencode/INSTALL.md](.opencode/INSTALL.md) for detailed steps.

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

These skills are adapted in part from the teachings of
[John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/home.php),
professor of computer science at Stanford University, and his book
[*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd.php). This project is not affiliated with, endorsed by, or sponsored by John Ousterhout, Stanford University, or the publishers of *A Philosophy of Software Design*.

**If you find these skills useful, you should really buy and read the book.** The skills in this repo are by no means a substitute for reading it. It is the definitive treatment of these ideas and an enjoyable read for any dev.  Available from [Amazon](https://www.amazon.com/dp/173210221X) (no affiliate link). Also available in [German](https://www.oreilly.com/library/view/prinzipien-des-softwaredesigns/9781098130053/) (O'Reilly, 2021) and [Chinese](https://item.jd.com/14328323.html) (Posts and Telecommunications Press, 2024).

The skills and code in this project are independently authored original works by the project's contributors. Brief quotations from the book are sometimes used with full attribution for purposes of commentary, criticism, and education. All trademarks and copyrights are the property of their respective owners.

## Contributing

Skills live directly in this repository. To contribute:

1. Fork the repository
2. Create a branch for your skill
3. Follow the [`writing-skills`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) skill from [Superpowers](https://github.com/obra/superpowers) for creating and testing new skills
4. Each skill lives in `skills/<skill-name>/SKILL.md` with optional `references/` files
5. Submit a PR

## Updating

Skills update automatically when you update the plugin:

```bash
/plugin update clairvoyance
```

## License

[MIT License](LICENSE) © 2026 [Cody Bromley](https://github.com/codybrom)
