---
max_turns: 5
timeout_seconds: 120
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
`paginate` is returning one item too few on every page after the first. Fix it and show me the corrected function.

```python
def paginate(items, page, page_size):
    """Return the items for a 1-indexed page."""
    if page < 1:
        raise ValueError("page must be >= 1")
    start = (page - 1) * page_size + 1 if page > 1 else 0
    end = start + page_size - 1 if page > 1 else page_size
    return items[start:end]
```
