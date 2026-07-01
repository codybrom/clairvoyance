# Installing Clairvoyance for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed (used by OpenCode to fetch the git-sourced plugin)

## Installation

Add Clairvoyance to the `plugin` array in your `opencode.json` (global
`~/.config/opencode/opencode.json` or project-level):

```json
{
  "plugin": ["clairvoyance@git+https://github.com/codybrom/clairvoyance.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and
registers all 16 skills with OpenCode's native `skill` tool — no symlinks or
manual skill paths required.

Verify by asking: "use skill tool to list skills"

You should see Clairvoyance's skills listed by their plain frontmatter names —
`deep-modules`, `red-flags`, `abstraction-quality`, and so on. OpenCode's
skill tool does not namespace skill names by plugin or package, so there's no
`clairvoyance/` prefix. If another source on your system also provides a
skill with the same name, OpenCode logs a "duplicate skill name" warning and
the most recently scanned source wins.

### Pinning a version

```json
{
  "plugin": ["clairvoyance@git+https://github.com/codybrom/clairvoyance.git#v1.2.0"]
}
```

## Migrating from the old symlink-based install

Earlier versions of this guide used `git clone` plus a manual symlink into
`~/.config/opencode/skills/`. If you're on that setup, remove it before
switching to the native plugin install above:

```bash
# Remove the old symlink
rm -rf ~/.config/opencode/skills/clairvoyance

# Remove the old cloned repo (optional, if you no longer need it)
rm -rf ~/.config/opencode/clairvoyance
```

Then add the `plugin` entry above and restart.

## Updating

OpenCode installs Clairvoyance through a git-backed package spec and reuses
the cached install on every subsequent restart — it does not re-fetch just
because you restarted. To pick up a new Clairvoyance release:

- If you pinned a tag (`#v1.2.0`), bump it in `opencode.json` and restart.
- If you didn't pin a tag, restarting still won't notice new commits on its
  own. Force a refresh by clearing the cached package directory under
  OpenCode's cache folder (look for a directory containing "clairvoyance" under
  OpenCode's `packages` cache, typically under `~/.cache/opencode/` on Linux,
  `~/Library/Caches/opencode/` on macOS, or `%LOCALAPPDATA%\opencode\` on
  Windows) and restart.

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i clairvoyance`
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Windows install issues

OpenCode has several known upstream bugs installing `git+https://` plugin
specs on Windows (invalid characters in the cache path, "no git binary
found" errors). If the plugin entry above fails to install, install it with
npm into a folder of your choice first, then point `opencode.json` at the
installed package using an absolute `file://` URL — OpenCode's plugin loader
does not expand `~` or environment variables in plugin paths, so it must be
a literal absolute path:

```powershell
npm install clairvoyance@git+https://github.com/codybrom/clairvoyance.git --prefix "$env:LOCALAPPDATA\opencode-clairvoyance"
```

```json
{
  "plugin": ["file:///C:/Users/<you>/AppData/Local/opencode-clairvoyance/node_modules/clairvoyance"]
}
```

Replace the path with wherever `--prefix` actually installed it on your machine.

### Skills not found

Use the `skill` tool to list what's discovered, and confirm the plugin
loaded (see Troubleshooting above).

## Getting Help

- Report issues: <https://github.com/codybrom/clairvoyance/issues>
