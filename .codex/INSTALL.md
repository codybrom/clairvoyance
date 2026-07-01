# Installing Clairvoyance for Codex (App + CLI)

Codex supports installing Clairvoyance as a plugin from a marketplace source. This registers the plugin identity (name, description, icon) in addition to all 16 skills, and lets you track updates with `codex plugin marketplace upgrade` instead of manual `git pull`.

The Codex App and Codex CLI share the same `~/.codex/config.toml`, so installing once from the CLI makes Clairvoyance visible and toggleable in the App's Plugins panel too — there's currently no App-only way to add a third-party marketplace, so the CLI step below is required either way.

## Prerequisites

- Codex CLI ≥ 0.142.0 (`codex --version`) — earlier versions reject root-level plugin sources and will silently skip this marketplace
- Git

## Installation

```bash
codex plugin marketplace add codybrom/clairvoyance
codex plugin add clairvoyance@clairvoyance
```

Restart Codex (CLI) or reload the Plugins panel (App) to pick up the install.

If the second command can't find the plugin, confirm the exact marketplace identifier Codex assigned:

```bash
codex plugin marketplace list
```

and use that name in place of the second `clairvoyance` in `codex plugin add <plugin>@<marketplace>`.

## Verify

```bash
codex plugin list --json
```

Look for `clairvoyance` in the `installed` array.

## Updating

```bash
codex plugin marketplace upgrade clairvoyance
codex plugin add clairvoyance@clairvoyance
```

The first command refreshes the tracked source to the latest commit; re-running `plugin add` picks up any plugin.json version bump.

## Uninstalling

```bash
codex plugin remove clairvoyance
codex plugin marketplace remove clairvoyance
```

## Fallback: manual symlink (Codex CLI < 0.142.0, or skills-only)

If you're on an older Codex CLI, or you only want the 16 `SKILL.md` files without the plugin wrapper, clone the repo and link the skills directory into Codex's native skill-scan path:

```bash
git clone https://github.com/codybrom/clairvoyance.git ~/.codex/clairvoyance
mkdir -p ~/.agents/skills
ln -s ~/.codex/clairvoyance/skills ~/.agents/skills/clairvoyance
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\clairvoyance" "$env:USERPROFILE\.codex\clairvoyance\skills"
```

Restart Codex to discover the skills. Verify with:

```bash
ls -la ~/.agents/skills/clairvoyance
```

Update with:

```bash
cd ~/.codex/clairvoyance && git pull
```

Skills update instantly through the symlink. Uninstall with:

```bash
rm ~/.agents/skills/clairvoyance
rm -rf ~/.codex/clairvoyance
```

## Getting Help

- Report issues: <https://github.com/codybrom/clairvoyance/issues>
