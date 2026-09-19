---
type: llm
focus: last_message
weight: 0.33
---
Classify each finding the answer raises as one of:
- DESIGN: a structural/software-design problem (module depth, pass-through, information leakage/hiding, temporal decomposition, special-general mixture, overexposure/caller burden, repetition, conjoined methods, vague names, comments restating code, error-handling strategy, tactical vs strategic change, etc.)
- BUG: a concrete correctness defect (wrong result, lost data, crash, deadlock). BUG findings are neutral.
- GENERIC: review noise with no design lens — formatting/style, adding type annotations or replacing `any`, adding tests, logging, micro-performance, lint conventions.

PASS if the number of GENERIC findings is smaller than the number of DESIGN findings. BUG findings are not counted either way. In your reasoning, list each finding with its label and give both counts.
