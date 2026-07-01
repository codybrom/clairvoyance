<p align="center">
  <img src="docs/src/assets/crystal-ball.svg" width="80" alt="Clairvoyance">
</p>

<h1 align="center">Clairvoyance</h1>

AI agents can write working code, but they don't stop to consider effective design unless asked. Clairvoyance is a set of skills inspired by John Ousterhout's [*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd.php). Each skill gives your agent **extrasensory perspective** around software design, with concrete tests to see ahead of obstacles during implementation and review.

## How It Works

Skills activate automatically and push your agent to ask questions like:

- *Does this interface hide real complexity, or just pass things through?*
- *Can this method be understood without reading another one in a different file?*
- *Is error handling pushing work onto callers that the module could handle itself?*

You can also invoke them directly. Use `/red-flags` to trigger a design smell scan, `/deep-modules` to check interface depth and `/design-it-twice` to compare alternatives before committing.

## Installation

Give your agent Clairvoyance: [Claude Code](#claude-code), [skills.sh](#skillssh), [Codex](#codex), [Cursor](#cursor), [OpenCode](#opencode), [Gemini CLI](#gemini-cli), [Antigravity](#antigravity), [Factory Droid](#factory-droid), [GitHub Copilot CLI](#github-copilot-cli), [Kimi Code](#kimi-code), [Pi](#pi).

**Note:** Installation differs by platform. If you use more than one, install Clairvoyance separately for each.

### Claude Code

```bash
/plugin marketplace add codybrom/clairvoyance
/plugin install clairvoyance@clairvoyance-plugins
```

### [skills.sh](https://skills.sh/codybrom/clairvoyance)

```bash
npx skills add codybrom/clairvoyance --skill '*'
```

### Codex

Requires Codex CLI ≥ 0.142.0 (`codex --version`). The Codex App and CLI share the same config, so this also makes Clairvoyance visible in the App's Plugins panel.

```bash
codex plugin marketplace add codybrom/clairvoyance
codex plugin add clairvoyance@clairvoyance
```

Older Codex versions only get the 16 skills, via a manual symlink — see [.codex/INSTALL.md](.codex/INSTALL.md) for that fallback and full troubleshooting.

### Cursor

Cursor doesn't yet have a one-line "install from a GitHub URL" flow for unlisted plugins, so clone (or symlink) the repo into Cursor's local plugins folder and restart:

```bash
git clone https://github.com/codybrom/clairvoyance.git ~/.cursor/plugins/local/clairvoyance
```

Then check the **Customize** panel in the sidebar to confirm Clairvoyance and its 16 skills are listed.

### OpenCode

Add Clairvoyance to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["clairvoyance@git+https://github.com/codybrom/clairvoyance.git"]
}
```

Restart OpenCode — no symlinks or manual skill paths needed. See [.opencode/INSTALL.md](.opencode/INSTALL.md) for version pinning, troubleshooting, and migrating off the old symlink-based install.

### Gemini CLI

Requires Gemini CLI ≥ 0.26.0 and an account Gemini CLI currently serves (Code Assist Standard/Enterprise, Google Cloud, or a paid API key — see [.gemini/INSTALL.md](.gemini/INSTALL.md) for details).

```bash
gemini extensions install https://github.com/codybrom/clairvoyance.git
```

Restart Gemini CLI to load the extension.

### Antigravity

```bash
agy plugin install https://github.com/codybrom/clairvoyance
```

### Factory Droid

Droid translates Claude Code plugin format automatically — no Clairvoyance-specific files needed.

```bash
droid plugin marketplace add https://github.com/codybrom/clairvoyance
droid plugin install clairvoyance@clairvoyance-plugins
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add codybrom/clairvoyance
copilot plugin install clairvoyance@clairvoyance-plugins
```

### Kimi Code

In Kimi Code's plugin manager (`/plugins`), choose **Custom**, or run directly:

```text
/plugins install https://github.com/codybrom/clairvoyance
```

Kimi Code will show a third-party trust prompt since this isn't an officially curated source — confirm to proceed.

### Pi

```bash
pi install git:github.com/codybrom/clairvoyance
```

Pi auto-discovers the `skills/` directory with no extra config.

### llms.txt

Machine-readable skill index for LLM agents:

- [clairvoyance.fyi/llms.txt](https://clairvoyance.fyi/llms.txt) — table of contents with descriptions
- [clairvoyance.fyi/llms-full.txt](https://clairvoyance.fyi/llms-full.txt) — full content of all skills

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
| `design-review` | Structured review funnel from complexity triage through structural, interface, and surface checks |
| `diagnose` | Routes a vague symptom or complaint to the most relevant skill via a decision tree |

## Attribution

These skills are adapted in part from the teachings of
[John Ousterhout](https://web.stanford.edu/~ouster/cgi-bin/home.php),
professor of computer science at Stanford University, and his book
[*A Philosophy of Software Design*](https://web.stanford.edu/~ouster/cgi-bin/aposd.php). This project is not affiliated with, endorsed by, or sponsored by John Ousterhout, Stanford University, or the publishers of *A Philosophy of Software Design*.

**If you find these skills useful, you should really buy and read the book.** The skills in this repo are by no means a substitute for reading it. It is the definitive treatment of these ideas and an enjoyable read for any dev.  Available from [Amazon](https://www.amazon.com/dp/173210221X) (no affiliate link). Also available in [German](https://www.oreilly.com/library/view/prinzipien-des-softwaredesigns/9781098130053/) (O'Reilly, 2021) and [Chinese](https://item.jd.com/14328323.html) (Posts and Telecommunications Press, 2024).

The skills and code in this project are independently authored original works by the project's contributors. Brief quotations from the book are sometimes used with full attribution for purposes of commentary, criticism, and education. All trademarks and copyrights are the property of their respective owners.

## Contributing

Contributions are welcome beyond the inspiration material, but should reinforce the core philosophy of thinking strategically about software design.

To contribute:

1. Fork the repository
2. Create a branch
3. Follow the [`writing-skills`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) skill from [Superpowers](https://github.com/obra/superpowers) for creating and testing skills
4. Add your skill in `skills/<skill-name>/SKILL.md` with optional `references/` files
5. Commit your changes and submit a PR

## Updating

- **Claude Code:** `/plugin update clairvoyance`
- **skills.sh:** `npx skills update codybrom/clairvoyance`
- **Codex:** `codex plugin marketplace upgrade clairvoyance && codex plugin add clairvoyance@clairvoyance`
- **Cursor:** `cd ~/.cursor/plugins/local/clairvoyance && git pull`, then restart
- **OpenCode:** doesn't auto-refresh on restart unless you pinned a tag — see [.opencode/INSTALL.md](.opencode/INSTALL.md#updating)
- **Gemini CLI:** `gemini extensions update clairvoyance`
- **Antigravity:** re-run `agy plugin install https://github.com/codybrom/clairvoyance`
- **Factory Droid:** `droid plugin marketplace update clairvoyance-plugins && droid plugin update clairvoyance@clairvoyance-plugins`
- **GitHub Copilot CLI:** `copilot plugin update clairvoyance`
- **Kimi Code:** re-run the install command from the Custom tab
- **Pi:** `pi update --extensions` (re-run install with a new ref if you pinned one)
- **llms.txt:** Always up to date at [clairvoyance.fyi/llms-full.txt](https://clairvoyance.fyi/llms-full.txt).

## License

[MIT License](LICENSE) © 2026 [Cody Bromley](https://github.com/codybrom)
