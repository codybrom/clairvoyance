---
type: llm
focus: last_message
---
PASS if the answer identifies that the same try/except/retry loop is duplicated across the call sites (daily.py, inventory.py, handlers.py, reconcile.py), with at least one noting the reconcile.py variant already drifts (5 attempts, ConnectionError, fixed sleep). FAIL if the duplication is not called out. Noticing the drift is not required for PASS if the duplication itself is clearly identified.
