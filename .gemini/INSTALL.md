# Installing Clairvoyance for Gemini CLI

Gemini CLI natively supports the Agent Skills open standard (agentskills.io) — the same `SKILL.md` format Clairvoyance already ships. This repo includes a `gemini-extension.json` manifest at its root so the whole `skills/` directory installs in one command, with no duplicated content.

## Prerequisites

- Gemini CLI ≥ 0.26.0 (Agent Skills were enabled by default starting in this version; check with `gemini --version`)
- Git
- A Gemini CLI account/auth method that can still serve requests: as of June 18, 2026, Gemini CLI stopped serving requests for free, Google AI Pro, and Ultra individual accounts. You need a Gemini Code Assist Standard/Enterprise license, Google Cloud access, or a paid Gemini/Gemini Enterprise Agent Platform API key to run Gemini CLI at all right now. (The CLI binary, the open-source repo, and the extension/skills system below are unaffected and continue to be actively maintained — this restriction is about which accounts the backend will serve, not about this install method.) If you don't have one of those, see Google's [Antigravity CLI](https://antigravity.google/product/antigravity-cli) migration path instead.

## Installation

```bash
gemini extensions install https://github.com/codybrom/clairvoyance.git
```

Restart Gemini CLI to load the extension.

## Verify

```bash
/skills list
```

or from a terminal:

```bash
gemini skills list --all
```

You should see all 16 `clairvoyance` skills (`deep-modules`, `red-flags`, `design-review`, etc.).

## Updating

```bash
gemini extensions update clairvoyance
```

## Uninstalling

```bash
gemini extensions uninstall clairvoyance
```

## Alternative: manual symlink (no extension install)

If you'd rather not install Clairvoyance as a full Gemini CLI extension, clone the repo and link the skills directory directly into Gemini's native skill-scan path — the same approach the Codex and OpenCode installs use:

```bash
git clone https://github.com/codybrom/clairvoyance.git ~/.gemini/clairvoyance
mkdir -p ~/.agents/skills
ln -s ~/.gemini/clairvoyance/skills ~/.agents/skills/clairvoyance
```

`~/.agents/skills/` is Gemini CLI's documented cross-tool alias for `~/.gemini/skills/` — it's also where the Codex install (`.codex/INSTALL.md`) already places Clairvoyance, so if you've already installed Clairvoyance for Codex, Gemini CLI will discover it automatically with no extra steps.

Run `/skills reload` in an active session, or restart Gemini CLI, to pick up the link.

### Updating (symlink method)

```bash
cd ~/.gemini/clairvoyance && git pull
```

## Getting Help

- Report issues: <https://github.com/codybrom/clairvoyance/issues>
