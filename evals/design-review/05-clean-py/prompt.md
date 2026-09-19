---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Review the design of slugify.py.

```python
# slugify.py
"""Turn arbitrary text into URL-safe slugs."""

import re
import unicodedata

_NON_WORD = re.compile(r"[^a-z0-9]+")


def slugify(text: str, max_length: int = 80) -> str:
    """Return a lowercase ASCII slug for text.

    Accented letters are folded to their base letter, every run of other
    characters becomes a single hyphen, and the result is trimmed to
    max_length without leaving a trailing hyphen. Returns "" if nothing
    usable remains.
    """
    folded = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    slug = _NON_WORD.sub("-", folded.lower()).strip("-")
    return slug[:max_length].rstrip("-")
```
