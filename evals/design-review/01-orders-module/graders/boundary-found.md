---
type: llm
focus: last_message
---
PASS if the answer identifies that `OrderValidator` and `OrderSubmitter` both independently build/know the payment gateway payload format (the `amt` / `ccy` / `ref` fields and their encoding), so knowledge of that format is duplicated across a module boundary — information leakage, a misplaced boundary, or equivalent — and proposes giving that knowledge a single owner. FAIL if not identified.
