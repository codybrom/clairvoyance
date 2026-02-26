# Installing Clairvoyance for Codex

Enable Clairvoyance skills in Codex via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/codybrom/clairvoyance.git ~/.codex/clairvoyance
   ```

2. **Create the skills symlink:**

   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/clairvoyance/skills ~/.agents/skills/clairvoyance
   ```

   **Windows (PowerShell):**

   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\clairvoyance" "$env:USERPROFILE\.codex\clairvoyance\skills"
   ```

3. **Restart Codex** to discover the skills.

## Verify

```bash
ls -la ~/.agents/skills/clairvoyance
```

You should see a symlink pointing to the clairvoyance skills directory.

## Updating

```bash
cd ~/.codex/clairvoyance && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/clairvoyance
rm -rf ~/.codex/clairvoyance
```

## Getting Help

- Report issues: <https://github.com/codybrom/clairvoyance/issues>
