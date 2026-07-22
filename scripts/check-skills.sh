#!/bin/bash
# Frontmatter consistency checks for skills/ and agents/, run in CI.
# Catches the class of bug shipped in v1.2.0 (fields nested under an inert
# metadata: key) and description-quality regressions.

set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'PYEOF'
import re
import sys
from pathlib import Path

errors = []

SKILL_ALLOWED = {
    "name", "description", "argument-hint", "allowed-tools",
    "disallowed-tools", "when_to_use", "model", "effort", "context",
    "agent", "disable-model-invocation", "user-invocable", "license",
}
AGENT_ALLOWED = {"name", "description", "tools", "model", "effort", "skills"}
# Silently ignored in plugin agents per docs — flag them so they never ship
AGENT_FORBIDDEN = {"hooks", "mcpServers", "permissionMode", "metadata"}


def frontmatter(path):
    text = path.read_text()
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        errors.append(f"{path}: no frontmatter block")
        return {}
    fields = {}
    current = None
    for line in m.group(1).splitlines():
        km = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if km:
            current = km.group(1)
            fields[current] = km.group(2)
        elif current and line.startswith((" ", "\t")):
            fields[current] += " " + line.strip()
        elif line.strip():
            errors.append(f"{path}: unparseable frontmatter line: {line!r}")
    return fields


for skill_dir in sorted(p for p in Path("skills").iterdir() if p.is_dir()):
    md = skill_dir / "SKILL.md"
    if not md.is_file():
        errors.append(f"{skill_dir}: missing SKILL.md")
        continue
    fm = frontmatter(md)
    name = fm.get("name", "")
    desc = fm.get("description", "")
    if name != skill_dir.name:
        errors.append(f"{md}: name '{name}' != directory '{skill_dir.name}'")
    if not desc:
        errors.append(f"{md}: missing description")
    else:
        if "Use when" not in desc:
            errors.append(f"{md}: description lacks a 'Use when' trigger clause")
        if len(desc) > 1024:
            errors.append(f"{md}: description is {len(desc)} chars (max 1024)")
    unknown = set(fm) - SKILL_ALLOWED
    if unknown:
        errors.append(f"{md}: unrecognized frontmatter fields: {sorted(unknown)}")

for agent_md in sorted(Path("agents").glob("*.md")):
    fm = frontmatter(agent_md)
    for field in ("name", "description"):
        if not fm.get(field):
            errors.append(f"{agent_md}: missing {field}")
    forbidden = set(fm) & AGENT_FORBIDDEN
    if forbidden:
        errors.append(
            f"{agent_md}: fields ignored in plugin agents: {sorted(forbidden)}")
    unknown = set(fm) - AGENT_ALLOWED - AGENT_FORBIDDEN
    if unknown:
        errors.append(f"{agent_md}: unrecognized frontmatter fields: {sorted(unknown)}")

if errors:
    print("\n".join(errors))
    sys.exit(1)

skills = len([p for p in Path("skills").iterdir() if p.is_dir()])
print(f"ok: {skills} skills and all agents pass frontmatter checks")
PYEOF
