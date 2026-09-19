---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Rename `process` in this function to something clearer and show me the updated code.

```python
def process(rows):
    out = {}
    for r in rows:
        out.setdefault(r["customer_id"], 0)
        out[r["customer_id"]] += r["amount_cents"]
    return out
```
