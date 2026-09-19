---
type: llm
focus: last_message
---
PASS if the answer identifies that knowledge of the CSV layout (column order/positions, cents representation, and/or date format) is spread across more than one module (reader, parser, writer), so a format change requires edits in several files — information leakage, shared hidden knowledge, or equivalent. FAIL if not mentioned.
