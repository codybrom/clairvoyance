---
type: llm
focus: last_message
---
PASS if the answer explicitly ties at least two of these three symptoms to the shared cause of the session format/ownership: (1) auth.py writing into `store._pending` between `begin()` and `finish()` (conjoined methods / leaked internal state), (2) audit.py re-implementing the `sess:{token}` key and JSON decoding (duplicated knowledge / leakage), (3) `raw()` returning the internal dict so callers index `["scopes"]` / `["uid"]` / `["ts"]`. FAIL if the symptoms are listed as unrelated issues.
