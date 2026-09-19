---
type: llm
focus: last_message
---
PASS if each design the answer proposes handles non-idempotent jobs differently from idempotent ones in a concrete way (e.g. idempotency keys, at-most-once semantics, deduplication at the downstream call, or refusing automatic retry), and says where that distinction is declared.
FAIL if any proposed design retries all jobs the same way, or mentions idempotency only as a caveat without a mechanism.
