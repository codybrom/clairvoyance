# Installing Clairvoyance for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation

### 1. Clone Clairvoyance

```bash
git clone https://github.com/codybrom/clairvoyance.git ~/.config/opencode/clairvoyance
```

### 2. Symlink Skills

```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/clairvoyance
ln -s ~/.config/opencode/clairvoyance/skills ~/.config/opencode/skills/clairvoyance
```

### 3. Restart OpenCode

Restart OpenCode. Skills will be available via the native `skill` tool.

Verify by asking: "use skill tool to list skills"

You should see skills like `clairvoyance/deep-modules`, `clairvoyance/red-flags`, etc.

## Updating

```bash
cd ~/.config/opencode/clairvoyance
git pull
```

## Getting Help

- Report issues: <https://github.com/codybrom/clairvoyance/issues>
